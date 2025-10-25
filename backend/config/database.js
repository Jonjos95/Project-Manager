// Database Configuration
const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'n8tive_project_manager',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('   → Make sure MySQL is running');
            console.error('   → Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   → Check your MySQL username and password');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('   → Database does not exist. Run database.sql first');
        }
        process.exit(1);
    }
    
    if (connection) {
        console.log('✅ Database connected successfully');
        connection.release();
    }
});

// Export promise-based pool for async/await usage
const promisePool = pool.promise();

module.exports = promisePool;

