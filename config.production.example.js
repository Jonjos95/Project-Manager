// Production Configuration Template
// Copy this to config.production.js and fill in your actual values
// Add config.production.js to .gitignore!

const PRODUCTION_CONFIG = {
    // Your EC2 public IP or custom domain
    host: 'YOUR_EC2_IP_OR_DOMAIN',
    
    // API endpoint
    apiUrl: '/api',  // Relative path when using same domain
    
    // Or use full URL if hosting frontend separately
    // apiUrl: 'https://api.yourdomain.com/api',
};

// Export for use in application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRODUCTION_CONFIG;
}

