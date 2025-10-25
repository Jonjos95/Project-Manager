// Authentication Middleware
const jwt = require('jsonwebtoken');

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }
        
        // Add user info to request object
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };

