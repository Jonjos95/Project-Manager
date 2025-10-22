// Task Manager Functionality
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Initialize the app
    function init() {
        renderTasks();
        updateTaskCount();
        
        // Set up event listeners
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });
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
            <div class="task-item bg-white border border-gray-200 rounded-lg p-4 flex items-start hover:shadow-md">
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

    // Initialize project visualization (if exists)
    if (document.querySelector('project-visualization')) {
      // Future integration with task data
    }
});