// Milestones API Routes
// N8tive.io Project Manager

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

// Get milestones for user or team
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.query;
        const userId = req.user.id;
        
        let query = `
            SELECT m.*, 
                   u.name as handoff_to_name,
                   (SELECT COUNT(*) FROM task_milestones tm WHERE tm.milestone_id = m.id) as task_count
            FROM milestones m
            LEFT JOIN users u ON m.handoff_to = u.id
            WHERE m.user_id = ?
        `;
        const params = [userId];
        
        if (teamId) {
            query += ' AND m.team_id = ?';
            params.push(teamId);
        }
        
        query += ' ORDER BY m.due_date ASC, m.created_at DESC';
        
        const [milestones] = await db.query(query, params);
        res.json(milestones);
    } catch (error) {
        console.error('Error fetching milestones:', error);
        res.status(500).json({ error: 'Failed to fetch milestones' });
    }
});

// Get a single milestone with tasks
router.get('/:milestoneId', authenticateToken, async (req, res) => {
    try {
        const { milestoneId } = req.params;
        
        const [milestones] = await db.query(
            `SELECT m.*, u.name as handoff_to_name
             FROM milestones m
             LEFT JOIN users u ON m.handoff_to = u.id
             WHERE m.id = ?`,
            [milestoneId]
        );
        
        if (milestones.length === 0) {
            return res.status(404).json({ error: 'Milestone not found' });
        }
        
        // Get associated tasks
        const [tasks] = await db.query(
            `SELECT t.* FROM tasks t
             INNER JOIN task_milestones tm ON t.id = tm.task_id
             WHERE tm.milestone_id = ?`,
            [milestoneId]
        );
        
        res.json({ ...milestones[0], tasks });
    } catch (error) {
        console.error('Error fetching milestone:', error);
        res.status(500).json({ error: 'Failed to fetch milestone' });
    }
});

// Create a milestone
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, dueDate, teamId, handoffTo, handoffStage } = req.body;
        const userId = req.user.id;
        
        const milestoneId = `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await db.query(
            `INSERT INTO milestones (id, team_id, user_id, name, description, due_date, handoff_to, handoff_stage)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [milestoneId, teamId || null, userId, name, description || null, dueDate || null, handoffTo || null, handoffStage || null]
        );
        
        const [newMilestone] = await db.query('SELECT * FROM milestones WHERE id = ?', [milestoneId]);
        res.status(201).json(newMilestone[0]);
    } catch (error) {
        console.error('Error creating milestone:', error);
        res.status(500).json({ error: 'Failed to create milestone' });
    }
});

// Update a milestone
router.put('/:milestoneId', authenticateToken, async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { name, description, dueDate, handoffTo, handoffStage, completed } = req.body;
        
        const completedAt = completed ? new Date() : null;
        
        await db.query(
            `UPDATE milestones 
             SET name = ?, description = ?, due_date = ?, handoff_to = ?, handoff_stage = ?, completed_at = ?
             WHERE id = ?`,
            [name, description, dueDate, handoffTo, handoffStage, completedAt, milestoneId]
        );
        
        // If milestone is being completed and has handoff rules, execute handoff
        if (completed && handoffTo && handoffStage) {
            await executeMilestoneHandoff(milestoneId, handoffTo, handoffStage);
        }
        
        const [updated] = await db.query('SELECT * FROM milestones WHERE id = ?', [milestoneId]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating milestone:', error);
        res.status(500).json({ error: 'Failed to update milestone' });
    }
});

// Delete a milestone
router.delete('/:milestoneId', authenticateToken, async (req, res) => {
    try {
        const { milestoneId } = req.params;
        
        // Delete task associations first (CASCADE should handle this, but being explicit)
        await db.query('DELETE FROM task_milestones WHERE milestone_id = ?', [milestoneId]);
        await db.query('DELETE FROM milestones WHERE id = ?', [milestoneId]);
        
        res.json({ message: 'Milestone deleted successfully' });
    } catch (error) {
        console.error('Error deleting milestone:', error);
        res.status(500).json({ error: 'Failed to delete milestone' });
    }
});

// Add task to milestone
router.post('/:milestoneId/tasks/:taskId', authenticateToken, async (req, res) => {
    try {
        const { milestoneId, taskId } = req.params;
        
        await db.query(
            'INSERT INTO task_milestones (task_id, milestone_id) VALUES (?, ?)',
            [taskId, milestoneId]
        );
        
        // Also update the task's milestone_id for quick reference
        await db.query('UPDATE tasks SET milestone_id = ? WHERE id = ?', [milestoneId, taskId]);
        
        res.json({ message: 'Task added to milestone' });
    } catch (error) {
        console.error('Error adding task to milestone:', error);
        res.status(500).json({ error: 'Failed to add task to milestone' });
    }
});

// Remove task from milestone
router.delete('/:milestoneId/tasks/:taskId', authenticateToken, async (req, res) => {
    try {
        const { milestoneId, taskId } = req.params;
        
        await db.query(
            'DELETE FROM task_milestones WHERE task_id = ? AND milestone_id = ?',
            [taskId, milestoneId]
        );
        
        await db.query('UPDATE tasks SET milestone_id = NULL WHERE id = ?', [taskId]);
        
        res.json({ message: 'Task removed from milestone' });
    } catch (error) {
        console.error('Error removing task from milestone:', error);
        res.status(500).json({ error: 'Failed to remove task from milestone' });
    }
});

// Helper function to execute milestone handoff
async function executeMilestoneHandoff(milestoneId, handoffTo, handoffStage) {
    try {
        // Get all tasks in this milestone
        const [tasks] = await db.query(
            `SELECT task_id FROM task_milestones WHERE milestone_id = ?`,
            [milestoneId]
        );
        
        // Update each task with new assignee and stage
        for (const task of tasks) {
            const [user] = await db.query('SELECT name FROM users WHERE id = ?', [handoffTo]);
            const assigneeName = user[0]?.name || 'Unknown';
            
            await db.query(
                `UPDATE tasks 
                 SET assignee = ?, assignee_name = ?, status = ?
                 WHERE id = ?`,
                [handoffTo, assigneeName, handoffStage, task.task_id]
            );
        }
        
        console.log(`Milestone ${milestoneId} handoff completed: ${tasks.length} tasks assigned to ${handoffTo}`);
    } catch (error) {
        console.error('Error executing milestone handoff:', error);
        throw error;
    }
}

module.exports = router;

