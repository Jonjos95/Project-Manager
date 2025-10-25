// Tasks Routes with Row-Level Security
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all tasks for current user (ROW-LEVEL SECURITY)
router.get('/', async (req, res) => {
    try {
        const [tasks] = await db.query(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        
        res.json({
            success: true,
            tasks
        });
        
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching tasks' 
        });
    }
});

// Get single task by ID (with ownership check)
router.get('/:id', async (req, res) => {
    try {
        const [tasks] = await db.query(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
        if (tasks.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        res.json({
            success: true,
            task: tasks[0]
        });
        
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching task' 
        });
    }
});

// Create new task
router.post('/', [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').notEmpty().withMessage('Status is required'),
    body('priority').isIn(['low', 'med', 'high']).withMessage('Invalid priority')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }
        
        const { title, description, priority, status } = req.body;
        const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        await db.query(
            'INSERT INTO tasks (id, user_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
            [taskId, req.user.id, title, description || '', priority, status]
        );
        
        // Fetch the created task
        const [tasks] = await db.query(
            'SELECT * FROM tasks WHERE id = ?',
            [taskId]
        );
        
        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, task_id, action_type, details) VALUES (?, ?, ?, ?)',
            [req.user.id, taskId, 'created', `Created in ${status}`]
        );
        
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: tasks[0]
        });
        
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating task' 
        });
    }
});

// Update task (with ownership check)
router.put('/:id', async (req, res) => {
    try {
        const { title, description, priority, status, completedAt } = req.body;
        
        // Check ownership
        const [existing] = await db.query(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found or access denied' 
            });
        }
        
        const oldTask = existing[0];
        
        await db.query(
            'UPDATE tasks SET title = ?, description = ?, priority = ?, status = ?, completed_at = ? WHERE id = ? AND user_id = ?',
            [title, description, priority, status, completedAt || null, req.params.id, req.user.id]
        );
        
        // Fetch updated task
        const [tasks] = await db.query(
            'SELECT * FROM tasks WHERE id = ?',
            [req.params.id]
        );
        
        // Log activity
        let activityDetails = 'Updated details';
        if (oldTask.title !== title) {
            activityDetails = `Renamed from "${oldTask.title}"`;
        } else if (oldTask.status !== status) {
            activityDetails = `Moved from ${oldTask.status} to ${status}`;
        }
        
        const actionType = (status === 'done' && oldTask.status !== 'done') ? 'completed' : 
                          (oldTask.status !== status) ? 'moved' : 'updated';
        
        await db.query(
            'INSERT INTO activity_log (user_id, task_id, action_type, details) VALUES (?, ?, ?, ?)',
            [req.user.id, req.params.id, actionType, activityDetails]
        );
        
        res.json({
            success: true,
            message: 'Task updated successfully',
            task: tasks[0]
        });
        
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating task' 
        });
    }
});

// Delete task (with ownership check)
router.delete('/:id', async (req, res) => {
    try {
        // Check ownership
        const [existing] = await db.query(
            'SELECT title FROM tasks WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found or access denied' 
            });
        }
        
        // Log activity before deletion
        await db.query(
            'INSERT INTO activity_log (user_id, task_id, action_type, details) VALUES (?, ?, ?, ?)',
            [req.user.id, req.params.id, 'deleted', 'Deleted from board']
        );
        
        await db.query(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting task' 
        });
    }
});

// Get activity log for current user
router.get('/activity/log', async (req, res) => {
    try {
        const [activities] = await db.query(
            `SELECT al.*, t.title as task_title, t.status as task_status, t.priority as task_priority 
             FROM activity_log al 
             LEFT JOIN tasks t ON al.task_id = t.id 
             WHERE al.user_id = ? 
             ORDER BY al.created_at DESC 
             LIMIT 100`,
            [req.user.id]
        );
        
        res.json({
            success: true,
            activities
        });
        
    } catch (error) {
        console.error('Get activity log error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching activity log' 
        });
    }
});

module.exports = router;

