// N8tive.io Project Manager - Main Application Controller
// Modular architecture with separate components

class App {
    constructor() {
        // Initialize all modules
        this.auth = new AuthManager();
        this.methodology = new MethodologyManager();
        this.ui = new UIController();
        this.taskManager = null; // Initialized after login
        this.board = null; // Initialized after login
        this.analytics = null; // Initialized after login
    }

    // Initialize application
    async init() {
        // Initialize UI first
        this.ui.init();
        
        // Initialize methodology
        this.methodology.init();
        
        // Check authentication (await the promise)
        const hasSession = await this.auth.init();
        
        if (!hasSession) {
            // Show login modal
            this.auth.showLoginModal();
            document.getElementById('appContainer').classList.add('hidden');
        } else {
            // User is authenticated - hide login/register modals and show app
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('loginModal').classList.remove('flex');
            document.getElementById('registerModal').classList.add('hidden');
            document.getElementById('registerModal').classList.remove('flex');
            document.getElementById('appContainer').classList.remove('hidden');
            this.initializeAfterLogin(this.auth.getCurrentUser());
        }
        
        // Setup global event listeners
        this.setupEventListeners();
        
        // Update icons
        this.ui.refreshIcons();
    }

    // Initialize app after successful login
    initializeAfterLogin(user) {
        // Initialize modules that require authentication
        this.taskManager = new TaskManager(this.auth, this.methodology);
        this.board = new KanbanBoard(this.taskManager, this.methodology, this.ui);
        this.analytics = new Analytics(this.taskManager, this.methodology);
        
        // Load data
        this.taskManager.init();
        
        // Update UI with user info
        this.auth.updateUserUI();
        
        // Render initial board
        this.board.render();
        
        // Update methodology selector
        this.methodology.updateMethodologySelector();
        this.methodology.updateStatusSelectors();
    }

    // Setup global event listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.auth.handleLogin(e));
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.auth.handleRegister(e));
        }
        
        // Task form
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        }
        
        // Edit task form
        const editForm = document.getElementById('editTaskForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditTask(e));
        }
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }
        
        // Methodology selector
        const methodologySelect = document.getElementById('methodologySelect');
        if (methodologySelect) {
            methodologySelect.addEventListener('change', (e) => this.handleMethodologyChange(e));
        }
        
        // File upload
        const fileInput = document.getElementById('taskFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
    }

    // Handle add task
    handleAddTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const status = document.getElementById('taskStatus').value;
        
        if (!title) {
            this.ui.alert('Please enter a task title');
            return;
        }
        
        this.taskManager.addTask({
            title,
            description,
            priority,
            status
        });
        
        this.board.render();
        
        document.getElementById('taskForm').reset();
        document.getElementById('taskTitle').focus();
        
        this.ui.showToast('Task created successfully', 'success');
    }

    // Handle edit task
    handleEditTask(e) {
        e.preventDefault();
        
        const taskId = document.getElementById('editTaskId').value;
        const title = document.getElementById('editTaskTitle').value.trim();
        const description = document.getElementById('editTaskDescription').value.trim();
        const priority = document.getElementById('editTaskPriority').value;
        const status = document.getElementById('editTaskStatus').value;
        
        if (!title) {
            this.ui.alert('Please enter a task title');
            return;
        }
        
        this.taskManager.updateTask(taskId, {
            title,
            description,
            priority,
            status
        });
        
        this.board.render();
        this.ui.hideModal('editTaskModal');
        
        this.ui.showToast('Task updated successfully', 'success');
    }

    // Handle search
    handleSearch(e) {
        const query = e.target.value;
        this.taskManager.setSearchQuery(query);
        this.board.render();
    }

    // Handle methodology change
    handleMethodologyChange(e) {
        const methodology = e.target.value;
        
        if (!this.ui.confirm('Changing methodology will migrate your tasks. Continue?')) {
            e.target.value = this.methodology.getCurrent();
            return;
        }
        
        // Migrate tasks
        const tasks = this.taskManager.getAllTasks();
        tasks.forEach(task => {
            const newStatus = this.methodology.migrateTaskStatus(task.status);
            if (newStatus !== task.status) {
                this.taskManager.updateTask(task.id, { status: newStatus });
            }
        });
        
        // Change methodology
        this.methodology.changeMethodology(methodology);
        
        // Update UI
        this.methodology.updateStatusSelectors();
        this.board.render();
        
        this.ui.showToast(`Switched to ${this.methodology.getCurrentName()}`, 'success');
    }

    // Handle file upload
    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            this.ui.alert('File size must be less than 5MB');
            e.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            // Store file data (base64)
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: event.target.result
            };
            
            // You can store this for later attachment to task
            console.log('File loaded:', fileData);
        };
        reader.readAsDataURL(file);
    }

    // Export data
    exportData() {
        const data = this.taskManager.exportTasks();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `n8tive-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.ui.showToast('Data exported successfully', 'success');
    }

    // Import data
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const success = this.taskManager.importTasks(event.target.result);
                
                if (success) {
                    this.board.render();
                    this.ui.showToast('Data imported successfully', 'success');
          } else {
                    this.ui.alert('Failed to import data. Invalid format.');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Clear all data
    clearAllData() {
        if (!this.ui.confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
            return;
        }
        
        this.taskManager.clearAllTasks();
        this.board.render();
        
        this.ui.showToast('All data cleared', 'success');
    }
}

// Global functions for HTML onclick handlers
function toggleProfileMenu() {
    window.app.ui.toggleProfileMenu();
}

function toggleSettingsMenu() {
    window.app.ui.toggleSettingsMenu();
}

function toggleHelpMenu() {
    window.app.ui.toggleHelpMenu();
}

function toggleNotifications() {
    window.app.ui.toggleNotifications();
}

function toggleMobileMenu() {
    window.app.ui.toggleMobileMenu();
}

function closeMobileMenu() {
    window.app.ui.closeMobileMenu();
}

function toggleMobileSearch() {
    window.app.ui.toggleMobileSearch();
}

function toggleSidebarCollapse() {
    window.app.ui.toggleSidebarCollapse();
}

function expandSidebarIfCollapsed() {
    window.app.ui.expandSidebarIfCollapsed();
}

function showLoginModal() {
    window.app.auth.showLoginModal();
}

function showRegisterModal() {
    window.app.auth.showRegisterModal();
}

function logout() {
    window.app.auth.logout();
}

function exportData() {
    window.app.exportData();
}

function importData() {
    window.app.importData();
}

function clearAllData() {
    window.app.clearAllData();
}

function toggleTheme() {
    window.app.ui.toggleTheme();
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});

