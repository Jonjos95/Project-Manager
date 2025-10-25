// Kanban Board Module
// Handles board rendering, drag-and-drop, and task display

class KanbanBoard {
    constructor(taskManager, methodologyManager, uiController) {
        this.taskManager = taskManager;
        this.methodologyManager = methodologyManager;
        this.uiController = uiController;
        this.currentDetailTaskId = null;
    }

    // Render the entire Kanban board
    render() {
        const container = document.getElementById('kanbanColumns');
        if (!container) return;

        const statuses = this.methodologyManager.getStatuses();
        
        container.innerHTML = statuses.map(status => 
            this.createColumnElement(status)
        ).join('');
        
        // Render tasks
        this.renderTasks();
        
        // Update filters
        this.updateFilters();
        
        // Update counters
        this.updateCounters();
        
        // Refresh icons
        this.uiController.refreshIcons();
    }

    // Create column HTML
    createColumnElement(status) {
        const colorClasses = {
            gray: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800',
            blue: 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20',
            yellow: 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
            purple: 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20',
            green: 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20',
            orange: 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20'
        };
        
        return `
            <div class="kanban-column flex-shrink-0 w-80" data-status="${status.id}">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-t-4 ${colorClasses[status.color] || colorClasses.gray}">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-2">
                            <i data-feather="${status.icon}" class="w-5 h-5 text-gray-600 dark:text-gray-300"></i>
                            <h3 class="font-semibold text-gray-800 dark:text-white">${status.name}</h3>
                            <span class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full" data-count="${status.id}">0</span>
                        </div>
                    </div>
                    <div class="space-y-3 min-h-[200px]" id="${status.id}Column" 
                         ondrop="app.board.handleDrop(event, '${status.id}')"
                         ondragover="app.board.handleDragOver(event)">
                        <!-- Tasks will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    // Render all tasks
    renderTasks() {
        const tasks = this.taskManager.getFilteredTasks();
        const statuses = this.methodologyManager.getStatuses();
        
        // Clear all columns
        statuses.forEach(status => {
            const column = document.getElementById(`${status.id}Column`);
            if (column) {
                column.innerHTML = '';
            }
        });
        
        // Add tasks to columns
        tasks.forEach(task => {
            const column = document.getElementById(`${task.status}Column`);
            if (column) {
                column.innerHTML += this.createTaskCard(task);
            }
        });
        
        // Update column counts
        statuses.forEach(status => {
            const count = tasks.filter(t => t.status === status.id).length;
            const countEl = document.querySelector(`[data-count="${status.id}"]`);
            if (countEl) {
                countEl.textContent = count;
            }
        });
        
        // Refresh icons
        this.uiController.refreshIcons();
    }

    // Create task card HTML
    createTaskCard(task) {
        const priorityColors = {
            low: 'border-l-green-500',
            med: 'border-l-yellow-500',
            high: 'border-l-red-500'
        };
        
        const priorityLabels = {
            low: 'Low',
            med: 'Medium',
            high: 'High'
        };
        
        return `
            <div class="task-card bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border-l-4 ${priorityColors[task.priority]} 
                        cursor-move hover:shadow-md transition-shadow"
                 draggable="true"
                 ondragstart="app.board.handleDragStart(event, '${task.id}')"
                 ondragend="app.board.handleDragEnd(event)">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium text-gray-800 dark:text-white line-clamp-2 flex-1">${task.title}</h4>
                    <div class="flex space-x-1 ml-2">
                        <button onclick="app.board.showTaskDetail('${task.id}')" 
                                class="text-gray-400 hover:text-blue-500 transition-colors">
                            <i data-feather="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="app.board.editTask('${task.id}')" 
                                class="text-gray-400 hover:text-yellow-500 transition-colors">
                            <i data-feather="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="app.board.deleteTask('${task.id}')" 
                                class="text-gray-400 hover:text-red-500 transition-colors">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                ${task.description ? `
                    <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">${task.description}</p>
                ` : ''}
                <div class="flex items-center justify-between text-xs">
                    <span class="px-2 py-1 rounded ${
                        task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        task.priority === 'med' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }">
                        ${priorityLabels[task.priority]}
                    </span>
                    ${task.files && task.files.length > 0 ? `
                        <span class="flex items-center text-gray-500 dark:text-gray-400">
                            <i data-feather="paperclip" class="w-3 h-3 mr-1"></i>
                            ${task.files.length}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Drag and Drop Handlers
    handleDragStart(event, taskId) {
        event.dataTransfer.setData('taskId', taskId);
        event.target.style.opacity = '0.5';
    }

    handleDragEnd(event) {
        event.target.style.opacity = '1';
        
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    handleDrop(event, newStatus) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const taskId = event.dataTransfer.getData('taskId');
        if (!taskId) return;
        
        // Update task status
        this.taskManager.updateTask(taskId, { status: newStatus });
        
        // Re-render
        this.render();
    }

    // Show task detail modal
    showTaskDetail(taskId) {
        this.currentDetailTaskId = taskId;
        const task = this.taskManager.getTask(taskId);
        if (!task) return;
        
        document.getElementById('detailTaskTitle').textContent = task.title;
        document.getElementById('detailTaskDescription').textContent = task.description || 'No description';
        document.getElementById('detailTaskPriority').textContent = 
            task.priority === 'low' ? 'Low' : task.priority === 'med' ? 'Medium' : 'High';
        
        const statusObj = this.methodologyManager.getStatusById(task.status);
        document.getElementById('detailTaskStatus').textContent = statusObj ? statusObj.name : task.status;
        
        document.getElementById('detailTaskCreated').textContent = new Date(task.createdAt).toLocaleString();
        document.getElementById('detailTaskUpdated').textContent = new Date(task.updatedAt).toLocaleString();
        
        // Show files
        const filesContainer = document.getElementById('detailTaskFiles');
        if (task.files && task.files.length > 0) {
            filesContainer.innerHTML = task.files.map(file => `
                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span class="text-sm truncate">${file.name}</span>
                    <button onclick="app.board.removeFile('${file.id}')" 
                            class="text-red-500 hover:text-red-700">
                        <i data-feather="x" class="w-4 h-4"></i>
                    </button>
                </div>
            `).join('');
        } else {
            filesContainer.innerHTML = '<p class="text-sm text-gray-500">No attachments</p>';
        }
        
        this.uiController.showModal('taskDetailModal');
        this.uiController.refreshIcons();
    }

    // Edit task
    editTask(taskId) {
        const task = this.taskManager.getTask(taskId);
        if (!task) return;
        
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskStatus').value = task.status;
        
        this.uiController.showModal('editTaskModal');
    }

    // Delete task
    deleteTask(taskId) {
        if (!this.uiController.confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        this.taskManager.deleteTask(taskId);
        this.render();
        this.uiController.showToast('Task deleted successfully', 'success');
    }

    // Remove file from task
    removeFile(fileId) {
        if (!this.currentDetailTaskId) return;
        
        this.taskManager.removeFileFromTask(this.currentDetailTaskId, fileId);
        this.showTaskDetail(this.currentDetailTaskId); // Refresh detail view
    }

    // Update filters in sidebar
    updateFilters() {
        const filterList = document.getElementById('filterList');
        if (!filterList) return;
        
        const statuses = this.methodologyManager.getStatuses();
        const currentFilter = this.taskManager.getCurrentFilter();
        
        filterList.innerHTML = `
            <button onclick="app.board.setFilter('all')" 
                    class="filter-btn flex items-center space-x-2 w-full px-3 py-2 rounded-lg transition-colors
                           ${currentFilter === 'all' ? 'bg-purple-100 dark:bg-gray-800 text-purple-700 dark:text-purple-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}">
                <i data-feather="list" class="w-5 h-5"></i>
                <span class="filter-text">All Tasks</span>
            </button>
        ` + statuses.map(status => `
            <button onclick="app.board.setFilter('${status.id}')" 
                    class="filter-btn flex items-center space-x-2 w-full px-3 py-2 rounded-lg transition-colors
                           ${currentFilter === status.id ? 'bg-purple-100 dark:bg-gray-800 text-purple-700 dark:text-purple-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}">
                <i data-feather="${status.icon}" class="w-5 h-5"></i>
                <span class="filter-text">${status.name}</span>
            </button>
        `).join('');
        
        this.uiController.refreshIcons();
    }

    // Set filter and re-render
    setFilter(filter) {
        this.taskManager.setFilter(filter);
        this.render();
    }

    // Update counters
    updateCounters() {
        const counts = this.taskManager.getTaskCounts();
        
        const remainingEl = document.getElementById('remainingTasks');
        const completedEl = document.getElementById('completedTasks');
        
        if (remainingEl) remainingEl.textContent = counts.active;
        if (completedEl) completedEl.textContent = counts.completed;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KanbanBoard;
}

