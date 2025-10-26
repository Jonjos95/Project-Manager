// API Configuration
// For production deployment, create config.production.js with your actual values

// Try to load production config if it exists
let PRODUCTION_CONFIG = null;
try {
    PRODUCTION_CONFIG = typeof require !== 'undefined' ? require('./config.production.js') : null;
} catch (e) {
    // Production config not found, will use defaults
}

const API_CONFIG = {
    // Local development (when testing on localhost)
    development: {
        apiUrl: 'http://localhost:3000/api'
    },
    
    // AWS Production (frontend served via Nginx on EC2)
    // Uses relative path since frontend and backend are on same domain
    production: {
        apiUrl: PRODUCTION_CONFIG?.apiUrl || '/api'  // Nginx proxies /api to Node.js backend
    },
    
    // File protocol (double-clicking index.html)
    // WARNING: Set production config for security
    fileProtocol: {
        apiUrl: PRODUCTION_CONFIG?.fileApiUrl || '/api'  // Configure in config.production.js
    }
};

// Auto-detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
const isFileProtocol = window.location.protocol === 'file:';
const isAWS = window.location.hostname === '54.158.1.37' || 
              window.location.hostname.includes('amazonaws.com');

// Select API URL based on environment
let API_URL;
let environment;

if (isFileProtocol) {
    API_URL = API_CONFIG.fileProtocol.apiUrl;
    environment = 'File Protocol (AWS backend)';
} else if (isLocalhost) {
    API_URL = API_CONFIG.development.apiUrl;
    environment = 'Development (localhost)';
} else {
    API_URL = API_CONFIG.production.apiUrl;
    environment = 'Production (AWS)';
}

// Stripe Configuration (Publishable Key - safe for frontend)
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SMJdZBTJt2ybYLKFOvSjXFE1pnt02AmqCoQbOimscXu93yYnL45a8NTxwS3FPOh1RAtKr2UHWjwBcixtKbF5Zro00ynCIUuxg';

console.log('🌐 Environment:', environment);
console.log('📡 API URL:', API_URL);
console.log('💳 Stripe:', STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Not configured');

