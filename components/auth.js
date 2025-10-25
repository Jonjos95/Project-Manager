// Authentication Module
// Handles user registration, login, logout, and session management

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.USERS_KEY = 'n8tive.users';
        this.SESSION_KEY = 'n8tive.session';
    }

    // Initialize authentication
    init() {
        this.loadUsers();
        return this.loadSession();
    }

    // Load users from localStorage
    loadUsers() {
        const stored = localStorage.getItem(this.USERS_KEY);
        this.users = stored ? JSON.parse(stored) : [];
        return this.users;
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(this.users));
    }

    // Hash password (simple client-side hashing)
    // In production, use proper backend hashing (bcrypt)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
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
    }

    // Register new user
    handleRegister(e) {
        e.preventDefault();

        const name = document.getElementById('registerName').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validation
        if (!name || !username || !password) {
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

        // Check if username exists
        if (this.users.find(u => u.username === username)) {
            alert('Username already exists');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            username,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();

        // Auto-login after registration
        this.currentUser = newUser;
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
    }

    // Login user
    handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Find user
        const user = this.users.find(u => u.username === username);

        if (!user) {
            alert('Invalid username or password');
            return;
        }

        // Check password
        if (user.password !== this.hashPassword(password)) {
            alert('Invalid username or password');
            return;
        }

        // Login successful
        this.currentUser = user;
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
    }

    // Save session
    saveSession() {
        if (this.currentUser) {
            localStorage.setItem(this.SESSION_KEY, JSON.stringify({
                userId: this.currentUser.id,
                timestamp: new Date().toISOString()
            }));
        }
    }

    // Load session
    loadSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        if (!session) return false;

        const { userId } = JSON.parse(session);
        this.currentUser = this.users.find(u => u.id === userId);

        if (this.currentUser) {
            this.updateUserUI();
            return true;
        }

        return false;
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.SESSION_KEY);

        // Hide app and show login
        document.getElementById('appContainer').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('loginModal').classList.add('flex');

        setTimeout(() => document.getElementById('loginUsername').focus(), 100);
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

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

