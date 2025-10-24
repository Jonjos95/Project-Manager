// N8tive.io Project Manager - Main JavaScript

// Task Management State
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let currentDetailTaskId = null;

// Constants
const STORAGE_KEY = 'n8tive.tasks';
const THEME_KEY = 'theme';
const METHODOLOGY_KEY = 'methodology';

// Project Management Methodologies
const METHODOLOGIES = {
    kanban: {
        name: 'Kanban',
        statuses: [
            { id: 'backlog', name: 'Backlog', icon: 'inbox', color: 'gray' },
            { id: 'todo', name: 'To Do', icon: 'circle', color: 'gray' },
            { id: 'doing', name: 'In Progress', icon: 'loader', color: 'blue' },
            { id: 'review', name: 'Review', icon: 'eye', color: 'yellow' },
            { id: 'testing', name: 'Testing', icon: 'check-square', color: 'purple' },
            { id: 'done', name: 'Done', icon: 'check-circle', color: 'green' },
            { id: 'archived', name: 'Archived', icon: 'archive', color: 'gray' }
        ]
    },
    waterfall: {
        name: 'Waterfall',
        statuses: [
            { id: 'requirements', name: 'Requirements', icon: 'file-text', color: 'blue' },
            { id: 'design', name: 'Design', icon: 'layout', color: 'purple' },
            { id: 'implementation', name: 'Implementation', icon: 'code', color: 'yellow' },
            { id: 'verification', name: 'Verification', icon: 'check-square', color: 'orange' },
            { id: 'maintenance', name: 'Maintenance', icon: 'tool', color: 'green' },
            { id: 'archived', name: 'Archived', icon: 'archive', color: 'gray' }
        ]
    },
    scrum: {
        name: 'Scrum',
        statuses: [
            { id: 'product_backlog', name: 'Product Backlog', icon: 'inbox', color: 'gray' },
            { id: 'sprint_backlog', name: 'Sprint Backlog', icon: 'list', color: 'blue' },
            { id: 'in_progress', name: 'In Progress', icon: 'loader', color: 'yellow' },
            { id: 'testing', name: 'Testing', icon: 'check-square', color: 'purple' },
            { id: 'done', name: 'Done', icon: 'check-circle', color: 'green' },
            { id: 'archived', name: 'Archived', icon: 'archive', color: 'gray' }
        ]
    },
    lean: {
        name: 'Lean',
        statuses: [
            { id: 'requested', name: 'Requested', icon: 'inbox', color: 'gray' },
            { id: 'in_progress', name: 'In Progress', icon: 'loader', color: 'blue' },
            { id: 'done', name: 'Done', icon: 'check-circle', color: 'green' }
        ]
    },
    simple: {
        name: 'Simple',
        statuses: [
            { id: 'todo', name: 'To Do', icon: 'circle', color: 'gray' },
            { id: 'doing', name: 'Doing', icon: 'loader', color: 'blue' },
            { id: 'done', name: 'Done', icon: 'check-circle', color: 'green' }
        ]
    }
};

let currentMethodology = 'kanban';
let STATUSES = [];

// Seed data
const SEED_TASKS = [
    {
        id: generateId(),
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
        id: generateId(),
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

// Initialize App
function init() {
    loadTheme();
    loadMethodology();
    loadTasks();
    setupEventListeners();
    renderKanbanBoard();
    updateFilters();
    updateStatusSelectors();
    renderTasks();
    updateCounters();
    feather.replace();
}

// Load Methodology
function loadMethodology() {
    const saved = localStorage.getItem(METHODOLOGY_KEY);
    currentMethodology = saved && METHODOLOGIES[saved] ? saved : 'kanban';
    STATUSES = METHODOLOGIES[currentMethodology].statuses.map(s => s.id);
    updateMethodologySelector();
}

function saveMethodology() {
    localStorage.setItem(METHODOLOGY_KEY, currentMethodology);
}

function changeMethodology(methodology) {
    if (!METHODOLOGIES[methodology]) return;
    
    currentMethodology = methodology;
    STATUSES = METHODOLOGIES[currentMethodology].statuses.map(s => s.id);
    saveMethodology();
    
    // Migrate tasks to first valid status if their current status doesn't exist
    tasks.forEach(task => {
        if (!STATUSES.includes(task.status)) {
            task.status = STATUSES[0];
            task.updatedAt = new Date().toISOString();
        }
    });
    saveTasks();
    
    // Re-render everything
    renderKanbanBoard();
    updateFilters();
    updateStatusSelectors();
    renderTasks();
    updateCounters();
    feather.replace();
}

function updateStatusSelectors() {
    const taskStatusSelect = document.getElementById('taskStatus');
    if (taskStatusSelect) {
        const methodology = METHODOLOGIES[currentMethodology];
        taskStatusSelect.innerHTML = methodology.statuses.slice(0, 2).map(status => 
            `<option value="${status.id}">${status.name}</option>`
        ).join('');
    }
}

function updateMethodologySelector() {
    const selector = document.getElementById('methodologySelector');
    if (selector) {
        selector.value = currentMethodology;
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Local Storage Functions
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        tasks = JSON.parse(stored);
        // Migrate old tasks to new schema
        tasks = tasks.map(task => ({
            ...task,
            updatedAt: task.updatedAt || task.createdAt,
            files: task.files || []
        }));
    } else {
        tasks = SEED_TASKS;
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Theme Functions
function loadTheme() {
    const theme = localStorage.getItem(THEME_KEY);
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

// Event Listeners
function setupEventListeners() {
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleTheme);
    
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', handleAddTask);
    
    // Edit form submission
    document.getElementById('editForm').addEventListener('submit', handleEditTask);
    
    // Close modals on outside click
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });
    
    document.getElementById('detailModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDetailModal();
        }
    });
    
    document.getElementById('settingsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            toggleSettingsMenu();
        }
    });
    
    document.getElementById('helpModal').addEventListener('click', function(e) {
        if (e.target === this) {
            toggleHelpMenu();
        }
    });
    
    // Close profile menu when clicking outside
    document.addEventListener('click', function(e) {
        const profileMenu = document.getElementById('profileMenu');
        const profileButton = e.target.closest('[onclick="toggleProfileMenu()"]');
        
        if (!profileButton && !profileMenu.contains(e.target)) {
            profileMenu.classList.add('hidden');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeEditModal();
            closeDetailModal();
            toggleSettingsMenu(false);
            toggleHelpMenu(false);
            document.getElementById('profileMenu').classList.add('hidden');
        }
    });
    
    // Sync mobile search with desktop search
    document.getElementById('searchInputMobile').addEventListener('input', function() {
        document.getElementById('searchInput').value = this.value;
        searchTasks();
    });
}

// Task CRUD Operations
function handleAddTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    
    if (!title) return;
    
    const newTask = {
        id: generateId(),
        title,
        description,
        priority,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        files: []
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateCounters();
    
    // Reset form
    document.getElementById('taskForm').reset();
    document.getElementById('taskTitle').focus();
    
    // Re-initialize feather icons
    feather.replace();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateCounters();
    }
}

function openEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskPriority').value = task.priority;
    
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').classList.add('flex');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editModal').classList.remove('flex');
}

function handleEditTask(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    
    if (!title) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.title = title;
        task.description = description;
        task.priority = priority;
        task.updatedAt = new Date().toISOString();
        
        saveTasks();
        renderTasks();
        closeEditModal();
        
        // Update detail view if open
        if (currentDetailTaskId === taskId) {
            openDetailModal(taskId);
        }
        
        feather.replace();
    }
}

// Detailed View Modal
function openDetailModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentDetailTaskId = taskId;
    
    // Populate modal
    document.getElementById('detailTitle').textContent = task.title;
    document.getElementById('detailDescription').textContent = task.description || 'No description provided';
    document.getElementById('detailStatus').textContent = task.status.replace('_', ' ');
    document.getElementById('detailId').textContent = task.id;
    
    // Priority badge
    const priorityBadge = `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}">
            ${task.priority === 'high' ? '🔴' : task.priority === 'med' ? '🟡' : '🟢'} ${task.priority.toUpperCase()}
        </span>
    `;
    document.getElementById('detailPriority').innerHTML = priorityBadge;
    
    // Dates
    document.getElementById('detailCreated').textContent = formatDateTime(task.createdAt);
    document.getElementById('detailUpdated').textContent = formatDateTime(task.updatedAt);
    document.getElementById('detailCompleted').textContent = task.completedAt ? formatDateTime(task.completedAt) : 'Not completed';
    
    // Files
    renderFileList(task.files);
    
    // Show modal
    document.getElementById('detailModal').classList.remove('hidden');
    document.getElementById('detailModal').classList.add('flex');
    
    feather.replace();
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.getElementById('detailModal').classList.remove('flex');
    currentDetailTaskId = null;
}

function openEditModalFromDetail() {
    if (currentDetailTaskId) {
        closeDetailModal();
        openEditModal(currentDetailTaskId);
    }
}

function deleteTaskFromDetail() {
    if (currentDetailTaskId) {
        deleteTask(currentDetailTaskId);
        closeDetailModal();
    }
}

// File Management
function handleFileUpload(e) {
    if (!currentDetailTaskId) return;
    
    const task = tasks.find(t => t.id === currentDetailTaskId);
    if (!task) return;
    
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const fileData = {
                id: generateId(),
                name: file.name,
                size: file.size,
                type: file.type,
                data: event.target.result,
                uploadedAt: new Date().toISOString()
            };
            
            task.files.push(fileData);
            task.updatedAt = new Date().toISOString();
            saveTasks();
            renderFileList(task.files);
        };
        
        // Read file as data URL for storage
        reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
}

function renderFileList(files) {
    const container = document.getElementById('detailFiles');
    
    if (!files || files.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No attachments</p>';
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
                <i data-feather="file" class="w-5 h-5 text-gray-400 flex-shrink-0"></i>
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">${escapeHtml(file.name)}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${formatFileSize(file.size)} • ${formatDateTime(file.uploadedAt)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 ml-2">
                <button onclick="downloadFile('${file.id}')" class="text-blue-500 hover:text-blue-600 p-1" title="Download">
                    <i data-feather="download" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteFile('${file.id}')" class="text-red-500 hover:text-red-600 p-1" title="Delete">
                    <i data-feather="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    feather.replace();
}

function downloadFile(fileId) {
    if (!currentDetailTaskId) return;
    
    const task = tasks.find(t => t.id === currentDetailTaskId);
    if (!task) return;
    
    const file = task.files.find(f => f.id === fileId);
    if (!file) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
}

function deleteFile(fileId) {
    if (!currentDetailTaskId) return;
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    const task = tasks.find(t => t.id === currentDetailTaskId);
    if (!task) return;
    
    task.files = task.files.filter(f => f.id !== fileId);
    task.updatedAt = new Date().toISOString();
    saveTasks();
    renderFileList(task.files);
}

// Drag and Drop Functions
let draggedTaskId = null;

function handleDragStart(e, taskId) {
    draggedTaskId = taskId;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback
    const column = e.currentTarget;
    if (column && column.classList.contains('space-y-3')) {
        column.classList.add('bg-purple-50', 'dark:bg-purple-900/10');
    }
}

function handleDragLeave(e) {
    const column = e.currentTarget;
    if (column && column.classList.contains('space-y-3')) {
        column.classList.remove('bg-purple-50', 'dark:bg-purple-900/10');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const column = e.currentTarget;
    column.classList.remove('bg-purple-50', 'dark:bg-purple-900/10');
    
    if (!draggedTaskId) return;
    
    const newStatus = column.dataset.status;
    const task = tasks.find(t => t.id === draggedTaskId);
    
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        
        // Update completedAt timestamp
        if (newStatus === 'done' && !task.completedAt) {
            task.completedAt = new Date().toISOString();
        } else if (newStatus !== 'done') {
            task.completedAt = null;
        }
        
        saveTasks();
        renderTasks();
        updateCounters();
        feather.replace();
    }
    
    draggedTaskId = null;
}

// Filter and Search Functions
function filterTasks(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('bg-purple-600', 'text-white');
            btn.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        } else {
            btn.classList.remove('bg-purple-600', 'text-white');
            btn.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        }
    });
    
    renderTasks();
}

function searchTasks() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    renderTasks();
}

function getFilteredTasks() {
    let filtered = [...tasks];
    
    // Apply filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(task => task.status === currentFilter);
    }
    
    // Apply search
    if (searchQuery) {
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(searchQuery) ||
            (task.description && task.description.toLowerCase().includes(searchQuery))
        );
    }
    
    return filtered;
}

// Dynamic Kanban Board Rendering
function renderKanbanBoard() {
    const container = document.getElementById('kanbanBoardColumns');
    if (!container) return;
    
    const methodology = METHODOLOGIES[currentMethodology];
    container.innerHTML = '';
    
    methodology.statuses.forEach(statusConfig => {
        const column = createColumnElement(statusConfig);
        container.appendChild(column);
    });
}

function createColumnElement(statusConfig) {
    const colorClasses = {
        gray: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    };
    
    const iconColors = {
        gray: 'text-gray-500',
        blue: 'text-blue-500',
        purple: 'text-purple-500',
        yellow: 'text-yellow-500',
        orange: 'text-orange-500',
        green: 'text-green-500'
    };
    
    const column = document.createElement('div');
    column.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 w-80 flex-shrink-0';
    column.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <i data-feather="${statusConfig.icon}" class="w-5 h-5 mr-2 ${iconColors[statusConfig.color] || 'text-gray-500'}"></i>
                ${statusConfig.name}
            </h3>
            <span class="${colorClasses[statusConfig.color] || colorClasses.gray} px-2 py-1 rounded-full text-sm" id="${statusConfig.id}Count">0</span>
        </div>
        <div 
            id="${statusConfig.id}Column" 
            class="space-y-3 min-h-[300px]"
            data-status="${statusConfig.id}"
            ondrop="handleDrop(event)"
            ondragover="handleDragOver(event)"
            ondragleave="handleDragLeave(event)"
        ></div>
    `;
    
    return column;
}

// Update Filters Based on Methodology
function updateFilters() {
    const filterContainer = document.querySelector('.space-y-2');
    if (!filterContainer) return;
    
    const methodology = METHODOLOGIES[currentMethodology];
    
    // Keep "All Tasks" filter and rebuild status filters
    const allButton = filterContainer.querySelector('[data-filter="all"]');
    filterContainer.innerHTML = '';
    
    if (allButton) {
        filterContainer.appendChild(allButton);
    } else {
        const allBtn = document.createElement('button');
        allBtn.onclick = () => filterTasks('all');
        allBtn.className = 'filter-btn w-full text-left px-4 py-2 rounded-lg bg-purple-600 text-white';
        allBtn.setAttribute('data-filter', 'all');
        allBtn.innerHTML = '<i data-feather="list" class="w-4 h-4 inline mr-2"></i> All Tasks';
        filterContainer.appendChild(allBtn);
    }
    
    // Add status-specific filters
    methodology.statuses.forEach(statusConfig => {
        const btn = document.createElement('button');
        btn.onclick = () => filterTasks(statusConfig.id);
        btn.className = 'filter-btn w-full text-left px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
        btn.setAttribute('data-filter', statusConfig.id);
        btn.innerHTML = `<i data-feather="${statusConfig.icon}" class="w-4 h-4 inline mr-2"></i> ${statusConfig.name}`;
        filterContainer.appendChild(btn);
    });
    
    feather.replace();
}

// Render Functions
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    // Clear all columns
    STATUSES.forEach(status => {
        const columnId = status + 'Column';
        const column = document.getElementById(columnId);
        if (column) {
            column.innerHTML = '';
        }
    });
    
    // Group tasks by status
    const tasksByStatus = {};
    STATUSES.forEach(status => {
        tasksByStatus[status] = filteredTasks.filter(task => task.status === status);
    });
    
    // Render tasks in each column
    Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
        const columnId = status + 'Column';
        statusTasks.forEach(task => renderTask(task, columnId));
        
        // Update column count
        const countId = status + 'Count';
        const countEl = document.getElementById(countId);
        if (countEl) {
            countEl.textContent = statusTasks.length;
        }
        
        // Show empty state if no tasks
        const column = document.getElementById(columnId);
        if (column && statusTasks.length === 0) {
            column.innerHTML = '<p class="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No tasks</p>';
        }
    });
}

function renderTask(task, columnId) {
    const column = document.getElementById(columnId);
    if (!column) return;
    
    const taskCard = document.createElement('div');
    taskCard.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow duration-200 animate-fadeIn border-l-4 ' + getPriorityBorderColor(task.priority);
    taskCard.draggable = true;
    taskCard.ondragstart = (e) => handleDragStart(e, task.id);
    taskCard.ondragend = handleDragEnd;
    taskCard.onclick = (e) => {
        // Don't open detail if clicking on buttons
        if (!e.target.closest('button')) {
            openDetailModal(task.id);
        }
    };
    
    const priorityBadge = `
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}">
            ${task.priority === 'high' ? '🔴' : task.priority === 'med' ? '🟡' : '🟢'} ${task.priority.toUpperCase()}
        </span>
    `;
    
    const fileCount = task.files && task.files.length > 0 ? `
        <span class="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
            <i data-feather="paperclip" class="w-3 h-3 mr-1"></i>${task.files.length}
        </span>
    ` : '';
    
    const createdDate = new Date(task.createdAt).toLocaleDateString();
    
    taskCard.innerHTML = `
        <div class="flex items-start justify-between mb-2">
            <h4 class="font-semibold text-gray-800 dark:text-white flex-1 ${task.status === 'done' ? 'line-through opacity-60' : ''}">${escapeHtml(task.title)}</h4>
            <div class="flex items-center space-x-2 ml-2">
                <button onclick="event.stopPropagation(); openEditModal('${task.id}')" class="text-blue-500 hover:text-blue-600 p-1" title="Edit">
                    <i data-feather="edit-2" class="w-4 h-4"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteTask('${task.id}')" class="text-red-500 hover:text-red-600 p-1" title="Delete">
                    <i data-feather="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
        ${task.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">${escapeHtml(task.description)}</p>` : ''}
        <div class="flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2">
                ${priorityBadge}
                ${fileCount}
            </div>
            <div class="text-gray-500 dark:text-gray-400">
                ${createdDate}
            </div>
        </div>
    `;
    
    column.appendChild(taskCard);
    feather.replace();
}

// Helper Functions
function getPriorityBorderColor(priority) {
    const colors = {
        low: 'border-green-400',
        med: 'border-yellow-400',
        high: 'border-red-400'
    };
    return colors[priority] || colors.med;
}

function getPriorityColor(priority) {
    const colors = {
        low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        med: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[priority] || colors.med;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function updateCounters() {
    const remaining = tasks.filter(task => task.status !== 'done' && task.status !== 'archived').length;
    const completed = tasks.filter(task => task.status === 'done').length;
    
    document.getElementById('remainingCount').textContent = remaining;
    document.getElementById('completedCount').textContent = completed;
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileMenuOverlay');
    
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// Kanban Board Scrolling
function scrollKanban(direction) {
    const container = document.getElementById('kanbanContainer');
    const scrollAmount = 350; // Width of one column plus gap
    
    if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

// Menu Toggle Functions
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.toggle('hidden');
}

function toggleSettingsMenu(forceClose = null) {
    const modal = document.getElementById('settingsModal');
    if (forceClose === false) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    } else if (forceClose === true) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.toggle('hidden');
        modal.classList.toggle('flex');
    }
    if (!modal.classList.contains('hidden')) {
        feather.replace();
    }
}

function toggleHelpMenu(forceClose = null) {
    const modal = document.getElementById('helpModal');
    if (forceClose === false) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    } else if (forceClose === true) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.toggle('hidden');
        modal.classList.toggle('flex');
    }
}

// Data Management Functions
function exportData() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `n8tive-tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('Tasks exported successfully!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedTasks)) {
                throw new Error('Invalid format');
            }
            
            // Validate task structure
            const isValid = importedTasks.every(task => 
                task.id && task.title && task.status
            );
            
            if (!isValid) {
                throw new Error('Invalid task structure');
            }
            
            if (confirm(`This will import ${importedTasks.length} tasks. Continue?`)) {
                tasks = importedTasks;
                saveTasks();
                renderTasks();
                updateCounters();
                feather.replace();
                alert('Tasks imported successfully!');
                toggleSettingsMenu();
            }
        } catch (error) {
            alert('Error importing tasks: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
}

function clearAllData() {
    if (confirm('Are you sure you want to delete ALL tasks? This action cannot be undone!')) {
        if (confirm('This will permanently delete all your tasks. Are you absolutely sure?')) {
            tasks = [];
            saveTasks();
            renderTasks();
            updateCounters();
            alert('All tasks have been deleted.');
            toggleSettingsMenu();
        }
    }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
