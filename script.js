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
    async initializeAfterLogin(user) {
        // Initialize modules that require authentication
        this.taskManager = new TaskManager(this.auth, this.methodology);
        this.board = new KanbanBoard(this.taskManager, this.methodology, this.ui);
        this.analytics = new Analytics(this.taskManager, this.methodology);
        
        // Load data from backend (await the async call)
        await this.taskManager.init();
        console.log('Tasks loaded, count:', this.taskManager.getAllTasks().length);
        
        // Update UI with user info
        this.auth.updateUserUI();
        
        // Render initial board
        this.board.render();
        
        // Update Quick Stats
        updateQuickStats();
        
        // Update methodology selector
        this.methodology.updateMethodologySelector();
        this.methodology.updateStatusSelectors();
        
        // Refresh Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
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
    async handleAddTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const status = document.getElementById('taskStatus').value;
        
        if (!title) {
            this.ui.alert('Please enter a task title');
            return;
        }
        
        const newTask = await this.taskManager.addTask({
            title,
            description,
            priority,
            status
        });
        
        if (newTask) {
            this.board.render();
            updateQuickStats(); // Update stats after adding task
            document.getElementById('taskForm').reset();
            document.getElementById('taskTitle').focus();
            this.ui.showToast('Task created successfully', 'success');
        } else {
            this.ui.showToast('Failed to create task', 'error');
        }
    }

    // Handle edit task
    async handleEditTask(e) {
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
        
        const success = await this.taskManager.updateTask(taskId, {
            title,
            description,
            priority,
            status
        });
        
        if (success) {
            this.board.render();
            updateQuickStats(); // Update stats after editing task
            this.ui.hideModal('editTaskModal');
            this.ui.showToast('Task updated successfully', 'success');
        } else {
            this.ui.showToast('Failed to update task', 'error');
        }
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

function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(view => {
        view.classList.add('hidden');
    });
    
    // Show selected view
    const selectedView = document.getElementById(`${viewName}View`);
    if (selectedView) {
        selectedView.classList.remove('hidden');
    }
    
    // Update nav button states
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
            btn.classList.add('bg-purple-600', 'text-white');
        } else {
            btn.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
            btn.classList.remove('bg-purple-600', 'text-white');
        }
    });
    
    // Render view-specific data
    if (window.app) {
        switch(viewName) {
            case 'board':
                if (window.app.board) {
                    // Always re-render to show latest tasks
                    window.app.board.render();
                    updateQuickStats();
                    console.log('Board rendered with tasks:', window.app.taskManager.getAllTasks().length);
                }
                break;
            case 'analytics':
                if (window.app.analytics) {
                    window.app.analytics.renderAnalytics();
                }
                break;
            case 'timeline':
                // Initialize timeline with current date
                renderTimeline();
                break;
            case 'reports':
                if (window.app.analytics) {
                    window.app.analytics.renderActivityLog();
                }
                break;
            case 'profile':
                updateProfileView();
                break;
        }
    }
    
    // Refresh Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

function updateQuickStats() {
    if (!window.app || !window.app.taskManager) return;
    
    const counts = window.app.taskManager.getTaskCounts();
    
    // Update Quick Stats
    const totalEl = document.getElementById('quickStatTotal');
    const activeEl = document.getElementById('quickStatActive');
    const doneEl = document.getElementById('quickStatDone');
    const rateEl = document.getElementById('quickStatRate');
    
    if (totalEl) totalEl.textContent = counts.total || 0;
    if (activeEl) activeEl.textContent = counts.active || 0;
    if (doneEl) doneEl.textContent = counts.completed || 0;
    
    if (rateEl) {
        const rate = counts.total > 0 
            ? Math.round((counts.completed / counts.total) * 100) 
            : 0;
        rateEl.textContent = `${rate}%`;
    }
}

function updateProfileView() {
    // Update profile view with current user data
    if (window.app && window.app.auth) {
        const user = window.app.auth.getCurrentUser();
        if (user) {
            document.getElementById('profileFullName').textContent = user.name || 'User';
            document.getElementById('profileUsername').textContent = '@' + (user.username || 'username');
            document.getElementById('profileEmail').textContent = user.email || 'email@example.com';
            
            // Update initials
            const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
            document.getElementById('profileInitials').textContent = initials;
        }
    }
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

function deleteTaskFromDetail() {
    if (window.app && window.app.board && window.app.board.currentDetailTaskId) {
        window.app.board.deleteTask(window.app.board.currentDetailTaskId);
        window.app.ui.hideModal('taskDetailModal');
    }
}

function openEditModalFromDetail() {
    if (window.app && window.app.board && window.app.board.currentDetailTaskId) {
        window.app.board.editTask(window.app.board.currentDetailTaskId);
        window.app.ui.hideModal('taskDetailModal');
    }
}

// Timeline View Management
let timelineState = {
    view: 'month', // 'month' or 'year'
    currentDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

function setTimelineView(view) {
    timelineState.view = view;
    
    // Update button states
    const monthBtn = document.getElementById('timelineMonthBtn');
    const yearBtn = document.getElementById('timelineYearBtn');
    
    if (view === 'month') {
        monthBtn.classList.add('bg-purple-600', 'text-white');
        monthBtn.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        yearBtn.classList.remove('bg-purple-600', 'text-white');
        yearBtn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    } else {
        yearBtn.classList.add('bg-purple-600', 'text-white');
        yearBtn.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        monthBtn.classList.remove('bg-purple-600', 'text-white');
        monthBtn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    }
    
    renderTimeline();
}

function timelineNavigate(direction) {
    if (timelineState.view === 'month') {
        if (direction === 'prev') {
            timelineState.currentMonth--;
            if (timelineState.currentMonth < 0) {
                timelineState.currentMonth = 11;
                timelineState.currentYear--;
            }
        } else {
            timelineState.currentMonth++;
            if (timelineState.currentMonth > 11) {
                timelineState.currentMonth = 0;
                timelineState.currentYear++;
            }
        }
    } else {
        timelineState.currentYear += direction === 'prev' ? -1 : 1;
    }
    
    timelineState.currentDate = new Date(timelineState.currentYear, timelineState.currentMonth, 1);
    renderTimeline();
}

function changeTimelineYear(year) {
    timelineState.currentYear = parseInt(year);
    timelineState.currentDate = new Date(timelineState.currentYear, timelineState.currentMonth, 1);
    renderTimeline();
}

function timelineToday() {
    const now = new Date();
    timelineState.currentMonth = now.getMonth();
    timelineState.currentYear = now.getFullYear();
    timelineState.currentDate = now;
    renderTimeline();
}

function renderTimeline() {
    // Populate year selector
    const yearSelect = document.getElementById('timelineYearSelect');
    if (yearSelect.children.length === 0) {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === timelineState.currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }
    } else {
        yearSelect.value = timelineState.currentYear;
    }
    
    // Render based on view type
    if (timelineState.view === 'month') {
        renderMonthTimeline();
    } else {
        renderYearTimeline();
    }
}

function renderMonthTimeline() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update period display
    document.getElementById('timelinePeriod').textContent = 
        `${monthNames[timelineState.currentMonth]} ${timelineState.currentYear}`;
    
    // Get days in month
    const daysInMonth = new Date(timelineState.currentYear, timelineState.currentMonth + 1, 0).getDate();
    const firstDay = new Date(timelineState.currentYear, timelineState.currentMonth, 1).getDay();
    
    // Create calendar grid
    let html = '<div class="grid grid-cols-7 gap-2">';
    
    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="text-center font-semibold text-gray-600 dark:text-gray-400 text-sm py-2">${day}</div>`;
    });
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="aspect-square"></div>';
    }
    
    // Days of month
    const today = new Date();
    const isCurrentMonth = today.getMonth() === timelineState.currentMonth && 
                          today.getFullYear() === timelineState.currentYear;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && today.getDate() === day;
        const bgClass = isToday ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' : 
                                  'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600';
        
        html += `
            <div class="aspect-square ${bgClass} rounded-lg p-2 transition-colors cursor-pointer relative">
                <div class="text-center font-medium text-gray-800 dark:text-white">${day}</div>
                <div id="day-${day}-tasks" class="mt-1 space-y-1">
                    <!-- Tasks for this day -->
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    document.getElementById('timelineGrid').innerHTML = html;
    
    // Populate tasks if available
    if (window.app && window.app.taskManager) {
        populateMonthTasks();
    }
}

function renderYearTimeline() {
    document.getElementById('timelinePeriod').textContent = timelineState.currentYear;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let html = '<div class="grid grid-cols-4 gap-4">';
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    monthNames.forEach((month, index) => {
        const isCurrentMonth = index === currentMonth && timelineState.currentYear === currentYear;
        const borderClass = isCurrentMonth ? 'border-2 border-blue-500' : '';
        
        html += `
            <div class="${borderClass} bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                 onclick="jumpToMonth(${index})">
                <div class="text-center font-semibold text-gray-800 dark:text-white mb-2">${month}</div>
                <div id="month-${index}-summary" class="text-center text-sm text-gray-600 dark:text-gray-400">
                    <!-- Task summary -->
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('timelineGrid').innerHTML = html;
    
    // Populate summaries if available
    if (window.app && window.app.taskManager) {
        populateYearSummary();
    }
}

function jumpToMonth(monthIndex) {
    timelineState.view = 'month';
    timelineState.currentMonth = monthIndex;
    setTimelineView('month');
}

function populateMonthTasks() {
    const tasks = window.app.taskManager.getAllTasks();
    const monthStart = new Date(timelineState.currentYear, timelineState.currentMonth, 1);
    const monthEnd = new Date(timelineState.currentYear, timelineState.currentMonth + 1, 0);
    
    const tasksInMonth = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= monthStart && taskDate <= monthEnd;
    });
    
    // Add task indicators to days
    tasksInMonth.forEach(task => {
        const day = new Date(task.createdAt).getDate();
        const dayEl = document.getElementById(`day-${day}-tasks`);
        if (dayEl) {
            const dot = document.createElement('div');
            dot.className = `w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)} mx-auto`;
            dot.title = task.title;
            dayEl.appendChild(dot);
        }
    });
    
    // Update task list
    renderTimelineTaskList(tasksInMonth);
}

function populateYearSummary() {
    const tasks = window.app.taskManager.getAllTasks();
    
    for (let month = 0; month < 12; month++) {
        const monthStart = new Date(timelineState.currentYear, month, 1);
        const monthEnd = new Date(timelineState.currentYear, month + 1, 0);
        
        const tasksInMonth = tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= monthStart && taskDate <= monthEnd;
        });
        
        const summaryEl = document.getElementById(`month-${month}-summary`);
        if (summaryEl) {
            summaryEl.textContent = `${tasksInMonth.length} tasks`;
        }
    }
    
    // Show all tasks for the year
    const tasksInYear = tasks.filter(task => {
        return new Date(task.createdAt).getFullYear() === timelineState.currentYear;
    });
    renderTimelineTaskList(tasksInYear);
}

function renderTimelineTaskList(tasks) {
    const listEl = document.getElementById('timelineTaskList');
    
    if (tasks.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i data-feather="calendar" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                <p>No tasks in this period</p>
            </div>
        `;
        if (typeof feather !== 'undefined') feather.replace();
        return;
    }
    
    let html = '';
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(task => {
        const date = new Date(task.createdAt).toLocaleDateString();
        html += `
            <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                 onclick="openTaskDetailModal('${task.id}')">
                <div class="w-2 h-2 rounded-full ${getPriorityColor(task.priority)}"></div>
                <div class="flex-1">
                    <div class="font-medium text-gray-800 dark:text-white">${task.title}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${date}</div>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}">
                    ${task.status}
                </span>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return 'bg-red-500';
        case 'med': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
}

function getStatusColor(status) {
    const colors = {
        backlog: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
        todo: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        'in-progress': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    };
    return colors[status] || colors.backlog;
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

