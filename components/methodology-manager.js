// Methodology Manager Module
// Handles project management methodology switching (Kanban, Scrum, Waterfall, etc.)

class MethodologyManager {
    constructor() {
        this.METHODOLOGY_KEY = 'methodology';
        this.currentMethodology = 'kanban';
        this.STATUSES = [];
        
        this.METHODOLOGIES = {
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
    }

    // Initialize methodology
    init() {
        this.loadMethodology();
    }

    // Load methodology from localStorage
    loadMethodology() {
        const saved = localStorage.getItem(this.METHODOLOGY_KEY);
        this.currentMethodology = saved && this.METHODOLOGIES[saved] ? saved : 'kanban';
        this.STATUSES = this.METHODOLOGIES[this.currentMethodology].statuses;
        return this.currentMethodology;
    }

    // Save methodology to localStorage
    saveMethodology() {
        localStorage.setItem(this.METHODOLOGY_KEY, this.currentMethodology);
    }

    // Change methodology
    changeMethodology(methodology) {
        if (!this.METHODOLOGIES[methodology]) {
            console.error(`Unknown methodology: ${methodology}`);
            return false;
        }

        this.currentMethodology = methodology;
        this.STATUSES = this.METHODOLOGIES[methodology].statuses;
        this.saveMethodology();

        // Update UI
        this.updateMethodologySelector();
        
        return true;
    }

    // Update methodology selector in UI
    updateMethodologySelector() {
        const selector = document.getElementById('methodologySelect');
        if (selector) {
            selector.value = this.currentMethodology;
        }
    }

    // Update status selectors in forms
    updateStatusSelectors() {
        const selectors = ['taskStatus', 'editTaskStatus'];
        selectors.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = this.STATUSES.map(status => 
                    `<option value="${status.id}">${status.name}</option>`
                ).join('');
            }
        });
    }

    // Migrate task status to new methodology
    migrateTaskStatus(oldStatus) {
        // Try to find matching status
        const match = this.STATUSES.find(s => s.id === oldStatus);
        if (match) return oldStatus;

        // Map common statuses
        const statusMap = {
            'todo': ['todo', 'backlog', 'product_backlog', 'requested', 'requirements'],
            'doing': ['doing', 'in_progress', 'sprint_backlog', 'implementation'],
            'done': ['done', 'maintenance', 'archived']
        };

        for (const [newStatus, oldStatuses] of Object.entries(statusMap)) {
            if (oldStatuses.includes(oldStatus)) {
                const found = this.STATUSES.find(s => s.id === newStatus);
                if (found) return found.id;
            }
        }

        // Default to first status
        return this.STATUSES[0].id;
    }

    // Get current statuses
    getStatuses() {
        return this.STATUSES;
    }

    // Get current methodology
    getCurrent() {
        return this.currentMethodology;
    }

    // Get current methodology name
    getCurrentName() {
        return this.METHODOLOGIES[this.currentMethodology].name;
    }

    // Get all available methodologies
    getAll() {
        return this.METHODOLOGIES;
    }

    // Get status by ID
    getStatusById(id) {
        return this.STATUSES.find(s => s.id === id);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MethodologyManager;
}

