// N8tive.io Project Manager - Main JavaScript

// Task Management State
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';

// Constants
const STORAGE_KEY = 'n8tive.tasks';
const THEME_KEY = 'theme';

// Seed data
const SEED_TASKS = [
    {
        id: generateId(),
        title: 'Create project requirements',
        description: 'Define all project requirements and specifications',
        priority: 'med',
        status: 'todo',
        createdAt: new Date().toISOString(),
        completedAt: null
    },
    {
        id: generateId(),
        title: 'Design UI mockups',
        description: 'Create wireframes and visual designs for the application',
        priority: 'high',
        status: 'doing',
        createdAt: new Date().toISOString(),
        completedAt: null
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
    } else {
        // Use seed data if no tasks exist
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
    
    // Close edit modal on outside click
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });
}

// Task CRUD Operations
function handleAddTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    
    if (!title) return;
    
    const newTask = {
        id: generateId(),
        title,
        description,
        priority,
        status: 'todo',
        createdAt: new Date().toISOString(),
        completedAt: null
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
        
        saveTasks();
        renderTasks();
        closeEditModal();
        feather.replace();
    }
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
        
        // Update completedAt timestamp
        if (newStatus === 'done') {
            task.completedAt = new Date().toISOString();
        } else {
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
    if (currentFilter === 'active') {
        filtered = filtered.filter(task => task.status !== 'done');
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(task => task.status === 'done');
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
    
    // Clear columns
    document.getElementById('todoColumn').innerHTML = '';
    document.getElementById('doingColumn').innerHTML = '';
    document.getElementById('doneColumn').innerHTML = '';
    
    // Render tasks by status
    const todoTasks = filteredTasks.filter(task => task.status === 'todo');
    const doingTasks = filteredTasks.filter(task => task.status === 'doing');
    const doneTasks = filteredTasks.filter(task => task.status === 'done');
    
    todoTasks.forEach(task => renderTask(task, 'todoColumn'));
    doingTasks.forEach(task => renderTask(task, 'doingColumn'));
    doneTasks.forEach(task => renderTask(task, 'doneColumn'));
    
    // Update column counts
    document.getElementById('todoCount').textContent = todoTasks.length;
    document.getElementById('doingCount').textContent = doingTasks.length;
    document.getElementById('doneCount').textContent = doneTasks.length;
    
    // Show empty state if no tasks
    if (todoTasks.length === 0) {
        document.getElementById('todoColumn').innerHTML = '<p class="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No tasks</p>';
    }
    if (doingTasks.length === 0) {
        document.getElementById('doingColumn').innerHTML = '<p class="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No tasks</p>';
    }
    if (doneTasks.length === 0) {
        document.getElementById('doneColumn').innerHTML = '<p class="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No tasks</p>';
    }
}

function renderTask(task, columnId) {
    const column = document.getElementById(columnId);
    
    const taskCard = document.createElement('div');
    taskCard.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow duration-200 animate-fadeIn border-l-4 ' + getPriorityBorderColor(task.priority);
    taskCard.draggable = true;
    taskCard.ondragstart = (e) => handleDragStart(e, task.id);
    taskCard.ondragend = handleDragEnd;
    
    const priorityBadge = `
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}">
            ${task.priority === 'high' ? '🔴' : task.priority === 'med' ? '🟡' : '🟢'} ${task.priority.toUpperCase()}
        </span>
    `;
    
    const createdDate = new Date(task.createdAt).toLocaleDateString();
    const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : null;
    
    taskCard.innerHTML = `
        <div class="flex items-start justify-between mb-2">
            <h4 class="font-semibold text-gray-800 dark:text-white flex-1 ${task.status === 'done' ? 'line-through opacity-60' : ''}">${escapeHtml(task.title)}</h4>
            <div class="flex items-center space-x-2 ml-2">
                <button onclick="openEditModal('${task.id}')" class="text-blue-500 hover:text-blue-600 p-1" title="Edit">
                    <i data-feather="edit-2" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="text-red-500 hover:text-red-600 p-1" title="Delete">
                    <i data-feather="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
        ${task.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mb-3">${escapeHtml(task.description)}</p>` : ''}
        <div class="flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2">
                ${priorityBadge}
            </div>
            <div class="text-gray-500 dark:text-gray-400">
                ${completedDate ? `✓ ${completedDate}` : createdDate}
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

function updateCounters() {
    const remaining = tasks.filter(task => task.status !== 'done').length;
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

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
