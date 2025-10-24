
// Enhanced Task Manager Functionality
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const progressBar = document.getElementById('progressBar');
    const searchInput = document.getElementById('searchInput');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let searchQuery = '';

    // Initialize the app
    function init() {
        renderTasks();
        updateTaskCount();
        updateProgressBar();
        initKanban();
        initDarkMode();
        
        // Event listeners
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderTasks();
        });
        
        darkModeToggle.addEventListener('click', toggleDarkMode);
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });
    }

    // Initialize Kanban board
    function initKanban() {
        const kanbanColumns = document.querySelectorAll('.kanban-column');
        kanbanColumns.forEach(column => {
            new Sortable(column, {
                group: 'tasks',
                animation: 150,
                ghostClass: 'opacity-50',
                onEnd: (evt) => {
                    const taskId = parseInt(evt.item.dataset.id);
                    const newStatus = evt.to.closest('.kanban-column').dataset.status;
                    
                    tasks = tasks.map(task => 
                        task.id === taskId ? { ...task, status: newStatus } : task
                    );
                    saveTasks();
                    updateProgressBar();
                }
            });
        });
    }

    // Initialize dark mode from localStorage
    function initDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        document.documentElement.classList.toggle('dark', isDark);
        darkModeToggle.innerHTML = isDark ? 
            '<i data-feather="sun"></i>' : '<i data-feather="moon"></i>';
        feather.replace();
    }

    // Toggle dark mode
    function toggleDarkMode() {
        const isDark = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('darkMode', isDark);
        darkModeToggle.innerHTML = isDark ? 
            '<i data-feather="sun"></i>' : '<i data-feather="moon"></i>';
        feather.replace();
    }
// Add a new task
    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            const newTask = {
                id: Date.now(),
                text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            tasks.unshift(newTask);
            saveTasks();
            taskInput.value = '';
            renderTasks();
            updateTaskCount();
        }
    }

    // Render tasks based on current filter
    function renderTasks() {
        let filteredTasks = tasks;
        
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state text-center py-10">
                    <i data-feather="check-circle" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
                    <p class="text-gray-500">No ${currentFilter === 'all' ? '' : currentFilter} tasks yet.</p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        taskList.innerHTML = filteredTasks.map(task => `
            <div class="task-item bg-white border border-gray-200 rounded-lg p-4 flex items-start hover:bg-gray-50">
<button 
                    class="task-toggle flex-shrink-0 w-6 h-6 rounded-full border-2 ${task.completed ? 'bg-primary-500 border-primary-500' : 'border-gray-300'} flex items-center justify-center mr-3 mt-1"
                    data-id="${task.id}"
                >
                    ${task.completed ? '<i data-feather="check" class="w-4 h-4 text-white"></i>' : ''}
                </button>
                <div class="flex-1">
                    <p class="${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}">${task.text}</p>
                    <p class="text-xs text-gray-500 mt-1">${new Date(task.createdAt).toLocaleString()}</p>
                </div>
                <button class="task-delete text-gray-400 hover:text-red-500 ml-3" data-id="${task.id}">
                    <i data-feather="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        `).join('');
        
        feather.replace();
        
        // Add event listeners to new elements
        document.querySelectorAll('.task-toggle').forEach(btn => {
            btn.addEventListener('click', toggleTask);
        });
        
        document.querySelectorAll('.task-delete').forEach(btn => {
            btn.addEventListener('click', deleteTask);
        });
    }

    // Toggle task completion status
    function toggleTask(e) {
        const taskId = parseInt(e.currentTarget.dataset.id);
        tasks = tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
        updateTaskCount();
    }

    // Delete a task
    function deleteTask(e) {
        const taskId = parseInt(e.currentTarget.dataset.id);
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }

    // Update the task counter
    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        taskCount.textContent = activeTasks;
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    // Initialize the app
    init();

    // Sync tasks with visualization
    function syncTasksWithVisualization() {
      const visualization = document.querySelector('project-visualization');
      if (!visualization) return;

      const todoTasks = tasks.filter(task => !task.completed);
      const doneTasks = tasks.filter(task => task.completed);

      visualization.shadowRoot.querySelectorAll('[data-task-id]').forEach(el => {
        const colType = el.closest('.kanban-column')?.querySelector('.column-header span')?.textContent;
        if (!colType) return;

        if (colType === 'To Do') {
          if (todoTasks.length > 0) {
            el.innerHTML = todoTasks.map(task => `<div>${task.text}</div>`).join('');
          } else {
            el.innerHTML = '<div>No tasks yet</div>';
          }
        } else if (colType === 'Done') {
          if (doneTasks.length > 0) {
            el.innerHTML = doneTasks.map(task => `<div>${task.text}</div>`).join('');
          } else {
            el.innerHTML = '<div>No completed tasks</div>';
          }
        }
      });
    }

    // Update visualization when tasks change
    function saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      syncTasksWithVisualization();
    }
// Initialize project visualization (if exists)
    if (document.querySelector('project-visualization')) {
      // Future integration with task data
    }
});