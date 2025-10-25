// Task Manager Module
// Handles all task CRUD operations, storage, and filtering

class TaskManager {
    constructor(authManager, methodologyManager) {
        this.authManager = authManager;
        this.methodologyManager = methodologyManager;
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.activityLog = [];
        
        this.STORAGE_KEY = 'n8tive.tasks';
        this.ACTIVITY_LOG_KEY = 'n8tive.activity';
        
        // Seed data
        this.SEED_TASKS = [
            {
                id: this.generateId(),
                title: 'Create project requirements',
                description: 'Define all project requirements and specifications',
                priority: 'med',
                status: 'todo',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: null,
                files: []
            },
            {
                id: this.generateId(),
                title: 'Design UI mockups',
                description: 'Create wireframes and visual designs for the application',
                priority: 'high',
                status: 'doing',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: null,
                files: []
            }
        ];
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // Initialize task manager
    init() {
        this.loadTasks();
        this.loadActivityLog();
    }

    // Load tasks from localStorage (with row-level security)
    loadTasks() {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) {
            this.tasks = [];
            return;
        }
        
        const stored = localStorage.getItem(this.STORAGE_KEY);
        let allTasks = [];
        
        if (stored) {
            allTasks = JSON.parse(stored);
            
            // Migrate old tasks (without userId) to current user
            allTasks = allTasks.map(task => ({
                ...task,
                userId: task.userId || currentUser.id,
                updatedAt: task.updatedAt || task.createdAt,
                files: task.files || []
            }));
            
            // Save migrated tasks
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTasks));
        } else {
            // Create seed tasks for new user
            allTasks = this.SEED_TASKS.map(task => ({
                ...task,
                userId: currentUser.id
            }));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTasks));
        }
        
        // Filter tasks for current user (ROW-LEVEL SECURITY)
        this.tasks = allTasks.filter(task => task.userId === currentUser.id);
    }

    // Save tasks to localStorage
    saveTasks() {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return;
        
        // Load all tasks
        const stored = localStorage.getItem(this.STORAGE_KEY);
        let allTasks = stored ? JSON.parse(stored) : [];
        
        // Remove current user's tasks
        allTasks = allTasks.filter(task => task.userId !== currentUser.id);
        
        // Add back current user's updated tasks
        allTasks = [...allTasks, ...this.tasks];
        
        // Save all tasks
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTasks));
    }

    // Add new task
    addTask(taskData) {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return null;

        const newTask = {
            id: this.generateId(),
            userId: currentUser.id,
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'med',
            status: taskData.status || 'todo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null,
            files: taskData.files || []
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        this.logActivity('created', newTask, `Created in ${taskData.status}`);
        
        return newTask;
    }

    // Update task
    updateTask(taskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return false;

        const oldStatus = task.status;
        
        Object.assign(task, updates, {
            updatedAt: new Date().toISOString()
        });
        
        // Set completedAt if moving to done
        const doneStatuses = ['done', 'archived', 'maintenance'];
        if (doneStatuses.includes(task.status) && !task.completedAt) {
            task.completedAt = new Date().toISOString();
        } else if (!doneStatuses.includes(task.status) && task.completedAt) {
            task.completedAt = null;
        }
        
        this.saveTasks();
        
        // Log activity if status changed
        if (oldStatus !== task.status) {
            const oldStatusObj = this.methodologyManager.getStatusById(oldStatus);
            const newStatusObj = this.methodologyManager.getStatusById(task.status);
            this.logActivity('status_changed', task, 
                `Moved from ${oldStatusObj?.name || oldStatus} to ${newStatusObj?.name || task.status}`);
        } else {
            this.logActivity('updated', task, 'Task updated');
        }
        
        return true;
    }

    // Delete task
    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return false;

        this.logActivity('deleted', task, 'Task deleted');
        
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        
        return true;
    }

    // Get task by ID
    getTask(taskId) {
        return this.tasks.find(t => t.id === taskId);
    }

    // Get all tasks
    getAllTasks() {
        return this.tasks;
    }

    // Get filtered tasks
    getFilteredTasks() {
        return this.tasks.filter(task => {
            // Status filter
            const statusMatch = this.currentFilter === 'all' || task.status === this.currentFilter;
            
            // Search filter
            const searchMatch = !this.searchQuery || 
                task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(this.searchQuery.toLowerCase());
            
            return statusMatch && searchMatch;
        });
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
    }

    // Set search query
    setSearchQuery(query) {
        this.searchQuery = query;
    }

    // Get current filter
    getCurrentFilter() {
        return this.currentFilter;
    }

    // Get search query
    getSearchQuery() {
        return this.searchQuery;
    }

    // Add file to task
    addFileToTask(taskId, file) {
        const task = this.getTask(taskId);
        if (!task) return false;

        if (!task.files) task.files = [];
        
        task.files.push({
            id: this.generateId(),
            name: file.name,
            data: file.data,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
        });
        
        task.updatedAt = new Date().toISOString();
        this.saveTasks();
        
        return true;
    }

    // Remove file from task
    removeFileFromTask(taskId, fileId) {
        const task = this.getTask(taskId);
        if (!task) return false;

        task.files = task.files.filter(f => f.id !== fileId);
        task.updatedAt = new Date().toISOString();
        this.saveTasks();
        
        return true;
    }

    // Activity logging
    logActivity(action, task, details) {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return;

        const activity = {
            id: this.generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            action,
            taskId: task.id,
            taskTitle: task.title,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.activityLog.unshift(activity);
        
        // Keep only last 100 activities
        if (this.activityLog.length > 100) {
            this.activityLog = this.activityLog.slice(0, 100);
        }
        
        this.saveActivityLog();
    }

    // Load activity log
    loadActivityLog() {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return;

        const stored = localStorage.getItem(this.ACTIVITY_LOG_KEY);
        if (!stored) {
            this.activityLog = [];
            return;
        }

        const allActivity = JSON.parse(stored);
        // Filter for current user
        this.activityLog = allActivity.filter(a => a.userId === currentUser.id);
    }

    // Save activity log
    saveActivityLog() {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return;

        const stored = localStorage.getItem(this.ACTIVITY_LOG_KEY);
        let allActivity = stored ? JSON.parse(stored) : [];
        
        // Remove current user's activity
        allActivity = allActivity.filter(a => a.userId !== currentUser.id);
        
        // Add back current user's activity
        allActivity = [...allActivity, ...this.activityLog];
        
        localStorage.setItem(this.ACTIVITY_LOG_KEY, JSON.stringify(allActivity));
    }

    // Get activity log
    getActivityLog(limit = 50) {
        return this.activityLog.slice(0, limit);
    }

    // Get task counts
    getTaskCounts() {
        const statuses = this.methodologyManager.getStatuses();
        const counts = {};
        
        statuses.forEach(status => {
            counts[status.id] = this.tasks.filter(t => t.status === status.id).length;
        });
        
        counts.total = this.tasks.length;
        counts.active = this.tasks.filter(t => !['done', 'archived', 'maintenance'].includes(t.status)).length;
        counts.completed = this.tasks.filter(t => ['done', 'archived', 'maintenance'].includes(t.status)).length;
        
        return counts;
    }

    // Export tasks to JSON
    exportTasks() {
        return JSON.stringify(this.tasks, null, 2);
    }

    // Import tasks from JSON
    importTasks(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            const currentUser = this.authManager.getCurrentUser();
            
            if (!Array.isArray(imported)) {
                throw new Error('Invalid format');
            }
            
            // Add userId to imported tasks
            imported.forEach(task => {
                task.userId = currentUser.id;
                if (!task.id) task.id = this.generateId();
            });
            
            this.tasks = [...this.tasks, ...imported];
            this.saveTasks();
            
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    // Clear all tasks
    clearAllTasks() {
        this.tasks = [];
        this.activityLog = [];
        this.saveTasks();
        this.saveActivityLog();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskManager;
}

