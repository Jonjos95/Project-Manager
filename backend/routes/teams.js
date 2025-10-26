// Team Management Routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// Middleware to verify JWT token
const verifyToken = require('../middleware/auth');

// Get all teams for current user
router.get('/', verifyToken, async (req, res) => {
    try {
        const [teams] = await req.db.query(
            `SELECT t.*, 
                    tm.role as user_role,
                    u.username as owner_username,
                    u.name as owner_name,
                    COUNT(DISTINCT tm2.user_id) as member_count,
                    COUNT(DISTINCT ta.id) as task_count
             FROM teams t
             INNER JOIN team_members tm ON t.id = tm.team_id
             LEFT JOIN users u ON t.owner_id = u.id
             LEFT JOIN team_members tm2 ON t.id = tm2.team_id
             LEFT JOIN tasks ta ON t.id = ta.team_id
             WHERE tm.user_id = ?
             GROUP BY t.id, tm.role, u.username, u.name
             ORDER BY t.updated_at DESC`,
            [req.userId]
        );

        res.json({ teams });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Create new team
router.post('/', [
    verifyToken,
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Team name is required'),
    body('description').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    try {
        // Create team
        const [result] = await req.db.query(
            'INSERT INTO teams (name, description, owner_id) VALUES (?, ?, ?)',
            [name, description || '', req.userId]
        );

        const teamId = result.insertId;

        // Add creator as owner member
        await req.db.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [teamId, req.userId, 'owner']
        );

        // Fetch the created team
        const [teams] = await req.db.query(
            'SELECT * FROM teams WHERE id = ?',
            [teamId]
        );

        res.status(201).json({ team: teams[0] });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Get team details
router.get('/:teamId', verifyToken, async (req, res) => {
    const { teamId } = req.params;

    try {
        // Check if user is member of this team
        const [membership] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get team details
        const [teams] = await req.db.query(
            `SELECT t.*, u.username as owner_username, u.name as owner_name
             FROM teams t
             LEFT JOIN users u ON t.owner_id = u.id
             WHERE t.id = ?`,
            [teamId]
        );

        if (teams.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json({ team: teams[0], userRole: membership[0].role });
    } catch (error) {
        console.error('Get team details error:', error);
        res.status(500).json({ error: 'Failed to fetch team details' });
    }
});

// Get team members
router.get('/:teamId/members', verifyToken, async (req, res) => {
    const { teamId } = req.params;

    try {
        // Check if user is member of this team
        const [membership] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get members
        const [members] = await req.db.query(
            `SELECT tm.role, tm.joined_at, u.id, u.username, u.name, u.email
             FROM team_members tm
             INNER JOIN users u ON tm.user_id = u.id
             WHERE tm.team_id = ?
             ORDER BY tm.joined_at ASC`,
            [teamId]
        );

        res.json({ members });
    } catch (error) {
        console.error('Get team members error:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// Invite user to team
router.post('/:teamId/invite', [
    verifyToken,
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['admin', 'member', 'viewer']).withMessage('Invalid role')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { teamId } = req.params;
    const { email, role } = req.body;

    try {
        // Check if user has admin or owner permission
        const [membership] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.userId]
        );

        if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if user exists
        const [users] = await req.db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const invitedUserId = users[0].id;

        // Check if already a member
        const [existing] = await req.db.query(
            'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, invitedUserId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        // Add user directly to team (in production, you'd send an email invitation)
        await req.db.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [teamId, invitedUserId, role]
        );

        res.json({ message: 'User added to team successfully' });
    } catch (error) {
        console.error('Invite user error:', error);
        res.status(500).json({ error: 'Failed to invite user' });
    }
});

// Update team member role
router.put('/:teamId/members/:userId', [
    verifyToken,
    body('role').isIn(['admin', 'member', 'viewer']).withMessage('Invalid role')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { teamId, userId } = req.params;
    const { role } = req.body;

    try {
        // Check if current user has admin or owner permission
        const [membership] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.userId]
        );

        if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Can't change owner role
        const [targetMember] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        if (targetMember.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }

        if (targetMember[0].role === 'owner') {
            return res.status(400).json({ error: 'Cannot change owner role' });
        }

        // Update role
        await req.db.query(
            'UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?',
            [role, teamId, userId]
        );

        res.json({ message: 'Member role updated successfully' });
    } catch (error) {
        console.error('Update member role error:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
});

// Remove team member
router.delete('/:teamId/members/:userId', verifyToken, async (req, res) => {
    const { teamId, userId } = req.params;

    try {
        // Check if current user has admin or owner permission
        const [membership] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.userId]
        );

        if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Can't remove owner
        const [targetMember] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        if (targetMember.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }

        if (targetMember[0].role === 'owner') {
            return res.status(400).json({ error: 'Cannot remove owner' });
        }

        // Remove member
        await req.db.query(
            'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Leave team
router.post('/:teamId/leave', verifyToken, async (req, res) => {
    const { teamId } = req.params;

    try {
        // Check if user is owner
        const [membership] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.userId]
        );

        if (membership.length === 0) {
            return res.status(404).json({ error: 'Not a member of this team' });
        }

        if (membership[0].role === 'owner') {
            return res.status(400).json({ error: 'Owner cannot leave team. Transfer ownership or delete team instead.' });
        }

        // Remove user from team
        await req.db.query(
            'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.userId]
        );

        res.json({ message: 'Left team successfully' });
    } catch (error) {
        console.error('Leave team error:', error);
        res.status(500).json({ error: 'Failed to leave team' });
    }
});

// Delete team
router.delete('/:teamId', verifyToken, async (req, res) => {
    const { teamId } = req.params;

    try {
        // Check if user is owner
        const [membership] = await req.db.query(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, req.userId]
        );

        if (membership.length === 0 || membership[0].role !== 'owner') {
            return res.status(403).json({ error: 'Only team owner can delete team' });
        }

        // Delete team (cascade will handle members and tasks)
        await req.db.query('DELETE FROM teams WHERE id = ?', [teamId]);

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

module.exports = router;

