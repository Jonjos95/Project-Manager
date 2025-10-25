// Authentication Module (Cloud-Based with Backend API)
// Uses MySQL database via backend API instead of localStorage

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.TOKEN_KEY = 'n8tive.token';
        this.USER_KEY = 'n8tive.user';
    }

    // Initialize authentication
    async init() {
        return await this.loadSession();
    }

    // Register new user (API call)
    async handleRegister(e) {
        e.preventDefault();

        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Client-side validation
        if (!name || !email || !username || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            // Call backend API
            console.log('🔵 Attempting registration...');
            console.log('API URL:', API_URL);
            console.log('Full URL:', `${API_URL}/auth/register`);
            console.log('Data:', { name, email, username, password: '***' });
            
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, username, password })
            });

            console.log('✅ Response received:', response.status);
            const data = await response.json();
            console.log('📦 Response data:', data);

            if (!response.ok) {
                alert(data.message || 'Registration failed');
                return;
            }

            // Save token and user
            this.token = data.token;
            this.currentUser = data.user;
            this.saveSession();

            // Hide modal and show app
            document.getElementById('registerModal').classList.add('hidden');
            document.getElementById('registerModal').classList.remove('flex');
            document.getElementById('appContainer').classList.remove('hidden');

            // Trigger app initialization
            if (window.app) {
                window.app.initializeAfterLogin(this.currentUser);
            }

            document.getElementById('registerForm').reset();

        } catch (error) {
            console.error('Registration error:', error);
            alert('Network error. Please check your connection and try again.');
        }
    }

    // Login user (API call)
    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            // Call backend API
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Login failed');
                return;
            }

            // Save token and user
            this.token = data.token;
            this.currentUser = data.user;
            this.saveSession();

            // Hide modal and show app
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('loginModal').classList.remove('flex');
            document.getElementById('appContainer').classList.remove('hidden');

            // Trigger app initialization
            if (window.app) {
                window.app.initializeAfterLogin(this.currentUser);
            }

            document.getElementById('loginForm').reset();

        } catch (error) {
            console.error('Login error:', error);
            alert('Network error. Please check your connection and try again.');
        }
    }

    // Save session to localStorage (token + user info)
    saveSession() {
        if (this.token && this.currentUser) {
            localStorage.setItem(this.TOKEN_KEY, this.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(this.currentUser));
        }
    }

    // Load session from localStorage and verify with backend
    async loadSession() {
        console.log('🔍 Loading session...');
        const token = localStorage.getItem(this.TOKEN_KEY);
        const userStr = localStorage.getItem(this.USER_KEY);

        console.log('Token exists:', !!token);
        console.log('User data exists:', !!userStr);

        if (!token || !userStr) {
            console.log('❌ No stored session found');
            return false;
        }

        this.token = token;
        this.currentUser = JSON.parse(userStr);

        console.log('👤 Stored user:', this.currentUser.username);
        console.log('🔐 Verifying token with backend...');

        // Verify token with backend
        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('📡 Verification response status:', response.status);

            if (!response.ok) {
                // Token invalid, clear session
                console.log('❌ Token invalid, logging out');
                this.logout();
                return false;
            }

            const data = await response.json();
            this.currentUser = data.user;
            this.updateUserUI();
            console.log('✅ Session restored successfully');
            return true;

        } catch (error) {
            console.error('⚠️ Session verification error:', error);
            // Network error, use cached user data
            this.updateUserUI();
            console.log('⚠️ Using cached user data (network error)');
            return true;
        }
    }

    // Logout
    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);

        // Hide app and show login
        document.getElementById('appContainer').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('loginModal').classList.add('flex');

        setTimeout(() => document.getElementById('loginUsername').focus(), 100);
    }

    // Get user initials for avatar
    getUserInitials(name) {
        if (!name) return 'U';
        return name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    // Update UI with current user info
    updateUserUI() {
        if (!this.currentUser) return;

        const initials = this.getUserInitials(this.currentUser.name);
        document.getElementById('userInitials').textContent = initials;
        document.getElementById('userFullName').textContent = this.currentUser.name;
        document.getElementById('userUsernameDisplay').textContent = `@${this.currentUser.username}`;
        
        // Update email display if element exists
        const emailDisplay = document.getElementById('userEmailDisplay');
        if (emailDisplay && this.currentUser.email) {
            emailDisplay.textContent = this.currentUser.email;
        }
    }

    // Show login modal
    showLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('loginModal').classList.add('flex');
        document.getElementById('registerModal').classList.add('hidden');
        document.getElementById('registerModal').classList.remove('flex');
        setTimeout(() => document.getElementById('loginUsername').focus(), 100);
    }

    // Show register modal
    showRegisterModal() {
        document.getElementById('registerModal').classList.remove('hidden');
        document.getElementById('registerModal').classList.add('flex');
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('flex');
        setTimeout(() => document.getElementById('registerName').focus(), 100);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null && this.token !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current token (for API requests)
    getToken() {
        return this.token;
    }

    // Get authorization header
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

