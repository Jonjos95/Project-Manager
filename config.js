// API Configuration

const API_CONFIG = {
    // Local development (when testing on localhost)
    development: {
        apiUrl: 'http://localhost:3000/api'
    },
    
    // AWS Production (frontend served via Nginx on EC2)
    // Uses relative path since frontend and backend are on same domain
    production: {
        apiUrl: '/api'  // Nginx proxies /api to Node.js backend
    },
    
    // File protocol (double-clicking index.html)
    fileProtocol: {
        apiUrl: 'http://54.158.1.37/api'  // Direct to AWS
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

console.log('🌐 Environment:', environment);
console.log('📡 API URL:', API_URL);

