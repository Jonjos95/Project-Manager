// Task Manager Module
// Handles all task CRUD operations with backend API

class TaskManager {
    constructor(authManager, methodologyManager) {
        this.authManager = authManager;
        this.methodologyManager = methodologyManager;
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.activityLog = [];
        
        this.ACTIVITY_LOG_KEY = 'n8tive.activity';
        this.API_URL = window.CONFIG?.API_URL || 'http://localhost:3000/api';
    }

    // Generate unique ID (for client-side only operations)
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // Initialize task manager
    async init() {
        await this.loadTasks();
        this.loadActivityLog();
    }

    // Load tasks from backend API
    async loadTasks() {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser || !currentUser.token) {
            this.tasks = [];
            console.log('No authenticated user, tasks cleared');
            return;
        }
        
        try {
            console.log('Loading tasks from API...');
            const response = await fetch(`${this.API_URL}/tasks`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load tasks: ${response.status}`);
            }
            
            const data = await response.json();
            this.tasks = data.tasks || [];
            console.log(`Loaded ${this.tasks.length} tasks from API`);
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }

    // No longer needed - backend handles persistence
    saveTasks() {
        // This method is kept for compatibility but does nothing
        // All saves go through individual API calls
    }

    // Add new task
    async addTask(taskData) {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser || !currentUser.token) return null;

        try {
            console.log('Creating task via API...', taskData);
            const response = await fetch(`${this.API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: taskData.title,
                    description: taskData.description || '',
                    priority: taskData.priority || 'med',
                    status: taskData.status || 'todo'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create task: ${response.status}`);
            }
            
            const data = await response.json();
            const newTask = data.task;
            
            // Add to local array
            this.tasks.push(newTask);
            this.logActivity('created', newTask, `Created in ${newTask.status}`);
            
            console.log('Task created successfully:', newTask);
            return newTask;
        } catch (error) {
            console.error('Error creating task:', error);
            return null;
        }
    }

    // Update task
    async updateTask(taskId, updates) {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser || !currentUser.token) return false;

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return false;

        const oldStatus = task.status;
        
        try {
            console.log('Updating task via API...', taskId, updates);
            const response = await fetch(`${this.API_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update task: ${response.status}`);
            }
            
            const data = await response.json();
            const updatedTask = data.task;
            
            // Update local array
            Object.assign(task, updatedTask);
            
            // Log activity if status changed
            if (oldStatus !== task.status) {
                const oldStatusObj = this.methodologyManager.getStatusById(oldStatus);
                const newStatusObj = this.methodologyManager.getStatusById(task.status);
                this.logActivity('status_changed', task, 
                    `Moved from ${oldStatusObj?.name || oldStatus} to ${newStatusObj?.name || task.status}`);
            } else {
                this.logActivity('updated', task, 'Task updated');
            }
            
            console.log('Task updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating task:', error);
            return false;
        }
    }

    // Delete task
    async deleteTask(taskId) {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser || !currentUser.token) return false;

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return false;

        try {
            console.log('Deleting task via API...', taskId);
            const response = await fetch(`${this.API_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete task: ${response.status}`);
            }
            
            this.logActivity('deleted', task, 'Task deleted');
            
            // Remove from local array
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            
            console.log('Task deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
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

