// N8tive.io Project Manager - Main JavaScript

// Task Management State
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let currentDetailTaskId = null;

// Constants
const STORAGE_KEY = 'n8tive.tasks';
const THEME_KEY = 'theme';

// All available statuses
const STATUSES = ['backlog', 'todo', 'doing', 'review', 'testing', 'done', 'archived'];

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
    loadTasks();
    setupEventListeners();
    renderTasks();
    updateCounters();
    feather.replace();
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

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
