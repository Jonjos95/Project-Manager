// Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            name: user.name 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Token valid for 7 days
    );
};

// Register new user
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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
        
        const { name, email, username, password } = req.body;
        
        // Check if username or email already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username.toLowerCase(), email.toLowerCase()]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Username or email already taken' 
            });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        const userId = 'user_' + Date.now();
        await db.query(
            'INSERT INTO users (id, username, email, name, password_hash) VALUES (?, ?, ?, ?, ?)',
            [userId, username.toLowerCase(), email.toLowerCase(), name, passwordHash]
        );
        
        // Generate token
        const user = { 
            id: userId, 
            username: username.toLowerCase(), 
            email: email.toLowerCase(),
            name 
        };
        const token = generateToken(user);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                name: user.name 
            }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

// Login user (supports username or email)
router.post('/login', [
    body('username').trim().notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required')
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
        
        const { username, password } = req.body;
        
        // Find user by username or email
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username.toLowerCase(), username.toLowerCase()]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        const user = users[0];
        
        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Generate token
        const token = generateToken(user);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                name: user.name 
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Verify token (check if user is still logged in)
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }
        
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Invalid token' 
                });
            }
            
            res.json({
                success: true,
                user: { 
                    id: user.id, 
                    username: user.username, 
                    name: user.name 
                }
            });
        });
        
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during verification' 
        });
    }
});

module.exports = router;

