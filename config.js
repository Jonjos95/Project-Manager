// API Configuration
// Update this with your EC2 public IP after AWS deployment

const API_CONFIG = {
    // Localhost (for development)
    development: {
        apiUrl: 'http://localhost:3000/api'
    },
    
    // AWS Production
    production: {
        apiUrl: 'http://YOUR-EC2-PUBLIC-IP:3000/api'  // Update this!
    }
};

// Auto-detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';

const API_URL = isLocalhost ? 
    API_CONFIG.development.apiUrl : 
    API_CONFIG.production.apiUrl;

console.log('API URL:', API_URL);

