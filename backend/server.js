// N8tive.io Project Manager - Backend Server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'N8tive.io Project Manager API',
        version: '1.0.0',
        status: 'running'
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  N8tive.io Project Manager API Server     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /                    - API info');
    console.log('  GET  /health              - Health check');
    console.log('  POST /api/auth/register   - Register user');
    console.log('  POST /api/auth/login      - Login user');
    console.log('  GET  /api/auth/verify     - Verify token');
    console.log('  GET  /api/tasks           - Get user tasks');
    console.log('  POST /api/tasks           - Create task');
    console.log('  PUT  /api/tasks/:id       - Update task');
    console.log('  DELETE /api/tasks/:id     - Delete task');
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('════════════════════════════════════════════');
});

module.exports = app;

