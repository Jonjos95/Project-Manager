// Custom Stages API Routes
// N8tive.io Project Manager

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Get stages for a team
router.get('/team/:teamId', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        
        const [stages] = await db.query(
            `SELECT * FROM team_stages 
             WHERE team_id = ? 
             ORDER BY order_index ASC`,
            [teamId]
        );
        
        res.json(stages);
    } catch (error) {
        console.error('Error fetching team stages:', error);
        res.status(500).json({ error: 'Failed to fetch stages' });
    }
});

// Create a new stage for a team
router.post('/team/:teamId', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { name, description, color, isInitial, isFinal } = req.body;
        
        // Generate ID
        const stageId = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Get max order_index
        const [maxOrder] = await db.query(
            'SELECT MAX(order_index) as maxOrder FROM team_stages WHERE team_id = ?',
            [teamId]
        );
        const orderIndex = (maxOrder[0]?.maxOrder || 0) + 1;
        
        // Insert stage
        await db.query(
            `INSERT INTO team_stages (id, team_id, name, description, color, order_index, is_initial, is_final)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [stageId, teamId, name, description || null, color || 'gray', orderIndex, isInitial || false, isFinal || false]
        );
        
        const [newStage] = await db.query('SELECT * FROM team_stages WHERE id = ?', [stageId]);
        res.status(201).json(newStage[0]);
    } catch (error) {
        console.error('Error creating stage:', error);
        res.status(500).json({ error: 'Failed to create stage' });
    }
});

// Update a stage
router.put('/:stageId', authenticateToken, async (req, res) => {
    try {
        const { stageId } = req.params;
        const { name, description, color, orderIndex, isInitial, isFinal } = req.body;
        
        await db.query(
            `UPDATE team_stages 
             SET name = ?, description = ?, color = ?, order_index = ?, is_initial = ?, is_final = ?
             WHERE id = ?`,
            [name, description, color, orderIndex, isInitial, isFinal, stageId]
        );
        
        const [updated] = await db.query('SELECT * FROM team_stages WHERE id = ?', [stageId]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating stage:', error);
        res.status(500).json({ error: 'Failed to update stage' });
    }
});

// Delete a stage
router.delete('/:stageId', authenticateToken, async (req, res) => {
    try {
        const { stageId } = req.params;
        
        // Check if any tasks are using this stage
        const [tasksCount] = await db.query(
            'SELECT COUNT(*) as count FROM tasks WHERE status = ?',
            [stageId]
        );
        
        if (tasksCount[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete stage with existing tasks',
                taskCount: tasksCount[0].count 
            });
        }
        
        await db.query('DELETE FROM team_stages WHERE id = ?', [stageId]);
        res.json({ message: 'Stage deleted successfully' });
    } catch (error) {
        console.error('Error deleting stage:', error);
        res.status(500).json({ error: 'Failed to delete stage' });
    }
});

// Reorder stages
router.post('/team/:teamId/reorder', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { stageIds } = req.body;  // Array of stage IDs in new order
        
        // Update order_index for each stage
        for (let i = 0; i < stageIds.length; i++) {
            await db.query(
                'UPDATE team_stages SET order_index = ? WHERE id = ? AND team_id = ?',
                [i, stageIds[i], teamId]
            );
        }
        
        res.json({ message: 'Stages reordered successfully' });
    } catch (error) {
        console.error('Error reordering stages:', error);
        res.status(500).json({ error: 'Failed to reorder stages' });
    }
});

module.exports = router;

