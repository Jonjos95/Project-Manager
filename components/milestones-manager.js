// Milestones Manager Component
// Project milestones with task tracking and automatic handoffs
// N8tive.io Project Manager

class MilestonesManager {
    constructor(auth, teams, stages) {
        this.auth = auth;
        this.teams = teams;
        this.stages = stages;
        this.milestones = [];
        this.currentMilestone = null;
    }

    async init() {
        console.log('Milestones Manager initialized');
    }

    // Load milestones
    async loadMilestones(teamId = null) {
        try {
            let url = `${API_URL}/milestones`;
            if (teamId) {
                url += `?teamId=${teamId}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                this.milestones = await response.json();
                this.renderMilestones();
            }
        } catch (error) {
            console.error('Error loading milestones:', error);
        }
    }

    // Render milestones list
    renderMilestones() {
        const container = document.getElementById('milestonesContainer');
        if (!container) return;
        
        if (this.milestones.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <i data-feather="flag" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Milestones Yet</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">Create milestones to track major project checkpoints</p>
                    <button onclick="window.app.milestones.showCreateMilestoneModal()" 
                            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                        Create First Milestone
                    </button>
                </div>
            `;
            
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
            return;
        }
        
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
        
        this.milestones.forEach(milestone => {
            const dueDate = milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No due date';
            const isCompleted = !!milestone.completed_at;
            const isOverdue = milestone.due_date && new Date(milestone.due_date) < new Date() && !isCompleted;
            
            html += `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border-l-4 ${
                    isCompleted ? 'border-green-500' : isOverdue ? 'border-red-500' : 'border-blue-500'
                }">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 dark:text-white mb-1">${milestone.name}</h4>
                            ${milestone.description ? `
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${milestone.description}</p>
                            ` : ''}
                        </div>
                        <div class="flex items-center gap-1 ml-2">
                            <button onclick="window.app.milestones.viewMilestone('${milestone.id}')" 
                                    class="text-gray-400 hover:text-blue-500 transition-colors p-1">
                                <i data-feather="eye" class="w-4 h-4"></i>
                            </button>
                            <button onclick="window.app.milestones.deleteMilestone('${milestone.id}')" 
                                    class="text-gray-400 hover:text-red-500 transition-colors p-1">
                                <i data-feather="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Due Date:</span>
                            <span class="font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}">${dueDate}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Tasks:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${milestone.task_count || 0}</span>
                        </div>
                        ${milestone.handoff_to_name ? `
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Handoff to:</span>
                                <span class="font-medium text-purple-600 dark:text-purple-400">${milestone.handoff_to_name}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        ${isCompleted ? `
                            <span class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
                                <i data-feather="check-circle" class="w-3 h-3"></i>
                                Completed
                            </span>
                        ` : `
                            <button onclick="window.app.milestones.completeMilestone('${milestone.id}')" 
                                    class="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors">
                                Mark Complete
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Show create milestone modal
    showCreateMilestoneModal() {
        const modal = document.getElementById('createMilestoneModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('createMilestoneName').value = '';
            document.getElementById('createMilestoneDescription').value = '';
            document.getElementById('createMilestoneDueDate').value = '';
            document.getElementById('createMilestoneHandoffTo').value = '';
            document.getElementById('createMilestoneHandoffStage').value = '';
            
            // Populate team members for handoff
            this.populateHandoffMembers();
            
            // Populate stages for handoff
            this.populateHandoffStages();
        }
    }

    // Hide create milestone modal
    hideCreateMilestoneModal() {
        const modal = document.getElementById('createMilestoneModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Populate handoff members dropdown
    populateHandoffMembers() {
        const select = document.getElementById('createMilestoneHandoffTo');
        if (!select) return;
        
        let html = '<option value="">No handoff</option>';
        
        if (this.teams.currentTeam && this.teams.currentTeam.members) {
            html += '<optgroup label="Team Members">';
            this.teams.currentTeam.members.forEach(member => {
                html += `<option value="${member.user_id}">${member.name} (${member.role})</option>`;
            });
            html += '</optgroup>';
        }
        
        select.innerHTML = html;
    }

    // Populate handoff stages dropdown
    populateHandoffStages() {
        const select = document.getElementById('createMilestoneHandoffStage');
        if (!select || !this.stages) return;
        
        let html = '<option value="">No stage change</option>';
        
        if (this.stages.currentTeamStages && this.stages.currentTeamStages.length > 0) {
            html += '<optgroup label="Team Stages">';
            this.stages.currentTeamStages.forEach(stage => {
                html += `<option value="${stage.id}">${stage.name}</option>`;
            });
            html += '</optgroup>';
        }
        
        select.innerHTML = html;
    }

    // Create milestone
    async createMilestone(e) {
        e.preventDefault();
        
        const name = document.getElementById('createMilestoneName').value.trim();
        const description = document.getElementById('createMilestoneDescription').value.trim();
        const dueDate = document.getElementById('createMilestoneDueDate').value;
        const handoffTo = document.getElementById('createMilestoneHandoffTo').value;
        const handoffStage = document.getElementById('createMilestoneHandoffStage').value;
        
        if (!name) return;
        
        try {
            const teamId = this.teams.currentTeam ? this.teams.currentTeam.id : null;
            
            const response = await fetch(`${API_URL}/milestones`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    dueDate,
                    teamId,
                    handoffTo: handoffTo || null,
                    handoffStage: handoffStage || null
                })
            });
            
            if (response.ok) {
                await this.loadMilestones(teamId);
                this.hideCreateMilestoneModal();
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Milestone created successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error creating milestone:', error);
            if (window.app && window.app.ui) {
                window.app.ui.showToast('Failed to create milestone', 'error');
            }
        }
    }

    // View milestone details
    async viewMilestone(milestoneId) {
        try {
            const response = await fetch(`${API_URL}/milestones/${milestoneId}`, {
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                this.currentMilestone = await response.json();
                this.renderMilestoneDetail();
                
                const modal = document.getElementById('milestoneDetailModal');
                if (modal) {
                    modal.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error loading milestone:', error);
        }
    }

    // Render milestone detail modal
    renderMilestoneDetail() {
        if (!this.currentMilestone) return;
        
        const milestone = this.currentMilestone;
        
        document.getElementById('milestoneDetailName').textContent = milestone.name;
        document.getElementById('milestoneDetailDescription').textContent = milestone.description || 'No description';
        document.getElementById('milestoneDetailDueDate').textContent = milestone.due_date ? 
            new Date(milestone.due_date).toLocaleDateString() : 'No due date';
        document.getElementById('milestoneDetailHandoff').textContent = milestone.handoff_to_name || 'No handoff configured';
        
        // Render tasks
        const tasksContainer = document.getElementById('milestoneDetailTasks');
        if (tasksContainer && milestone.tasks) {
            if (milestone.tasks.length === 0) {
                tasksContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">No tasks assigned to this milestone</p>';
            } else {
                tasksContainer.innerHTML = milestone.tasks.map(task => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex-1">
                            <p class="font-medium text-gray-800 dark:text-white">${task.title}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${task.status}</p>
                        </div>
                        <button onclick="window.app.milestones.removeTaskFromMilestone('${milestone.id}', '${task.id}')"
                                class="text-red-500 hover:text-red-700 p-1">
                            <i data-feather="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                `).join('');
                
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
        }
    }

    // Hide milestone detail modal
    hideMilestoneDetailModal() {
        const modal = document.getElementById('milestoneDetailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Complete milestone
    async completeMilestone(milestoneId) {
        if (!confirm('Mark this milestone as complete? Any configured handoffs will be executed.')) return;
        
        try {
            const response = await fetch(`${API_URL}/milestones/${milestoneId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: true })
            });
            
            if (response.ok) {
                const teamId = this.teams.currentTeam ? this.teams.currentTeam.id : null;
                await this.loadMilestones(teamId);
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Milestone completed! Tasks handed off.', 'success');
                }
            }
        } catch (error) {
            console.error('Error completing milestone:', error);
            if (window.app && window.app.ui) {
                window.app.ui.showToast('Failed to complete milestone', 'error');
            }
        }
    }

    // Delete milestone
    async deleteMilestone(milestoneId) {
        if (!confirm('Delete this milestone? Tasks will not be deleted, just unlinked.')) return;
        
        try {
            const response = await fetch(`${API_URL}/milestones/${milestoneId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                const teamId = this.teams.currentTeam ? this.teams.currentTeam.id : null;
                await this.loadMilestones(teamId);
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Milestone deleted', 'success');
                }
            }
        } catch (error) {
            console.error('Error deleting milestone:', error);
            if (window.app && window.app.ui) {
                window.app.ui.showToast('Failed to delete milestone', 'error');
            }
        }
    }

    // Remove task from milestone
    async removeTaskFromMilestone(milestoneId, taskId) {
        try {
            const response = await fetch(`${API_URL}/milestones/${milestoneId}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                await this.viewMilestone(milestoneId);
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Task removed from milestone', 'success');
                }
            }
        } catch (error) {
            console.error('Error removing task:', error);
        }
    }
}

