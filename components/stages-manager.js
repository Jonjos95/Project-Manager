// Stages Manager Component
// Custom workflow stages for teams
// N8tive.io Project Manager

class StagesManager {
    constructor(auth, teams) {
        this.auth = auth;
        this.teams = teams;
        this.currentTeamStages = [];
    }

    async init() {
        console.log('Stages Manager initialized');
    }

    // Load stages for current team
    async loadTeamStages(teamId) {
        if (!teamId) return;
        
        try {
            const response = await fetch(`${API_URL}/stages/team/${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                this.currentTeamStages = await response.json();
                this.renderStages();
            }
        } catch (error) {
            console.error('Error loading team stages:', error);
        }
    }

    // Render stages list
    renderStages() {
        const container = document.getElementById('stagesContainer');
        if (!container) return;
        
        if (this.currentTeamStages.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <i data-feather="columns" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Custom Stages Yet</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">Create custom workflow stages for this team</p>
                    <button onclick="window.app.stages.showCreateStageModal()" 
                            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                        Create First Stage
                    </button>
                </div>
            `;
            
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
            return;
        }
        
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
        
        this.currentTeamStages.forEach(stage => {
            const colorClasses = {
                gray: 'from-gray-400 to-gray-600',
                blue: 'from-blue-400 to-blue-600',
                green: 'from-green-400 to-green-600',
                yellow: 'from-yellow-400 to-yellow-600',
                red: 'from-red-400 to-red-600',
                purple: 'from-purple-400 to-purple-600',
                pink: 'from-pink-400 to-pink-600',
                orange: 'from-orange-400 to-orange-600'
            };
            
            const gradient = colorClasses[stage.color] || colorClasses.gray;
            
            html += `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 rounded-full bg-gradient-to-br ${gradient}"></div>
                            <h4 class="font-semibold text-gray-800 dark:text-white">${stage.name}</h4>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="window.app.stages.editStage('${stage.id}')" 
                                    class="text-gray-400 hover:text-blue-500 transition-colors p-1">
                                <i data-feather="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button onclick="window.app.stages.deleteStage('${stage.id}')" 
                                    class="text-gray-400 hover:text-red-500 transition-colors p-1">
                                <i data-feather="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    ${stage.description ? `
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${stage.description}</p>
                    ` : ''}
                    <div class="flex items-center gap-2 text-xs">
                        ${stage.is_initial ? '<span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Initial</span>' : ''}
                        ${stage.is_final ? '<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Final</span>' : ''}
                        <span class="text-gray-500 dark:text-gray-400">Order: ${stage.order_index}</span>
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

    // Show create stage modal
    showCreateStageModal() {
        const modal = document.getElementById('createStageModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('createStageName').value = '';
            document.getElementById('createStageDescription').value = '';
            document.getElementById('createStageColor').value = 'blue';
            document.getElementById('createStageIsInitial').checked = false;
            document.getElementById('createStageIsFinal').checked = false;
        }
    }

    // Hide create stage modal
    hideCreateStageModal() {
        const modal = document.getElementById('createStageModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Create stage
    async createStage(e) {
        e.preventDefault();
        
        const currentTeam = this.teams.currentTeam;
        if (!currentTeam) {
            alert('Please select a team first');
            return;
        }
        
        const name = document.getElementById('createStageName').value.trim();
        const description = document.getElementById('createStageDescription').value.trim();
        const color = document.getElementById('createStageColor').value;
        const isInitial = document.getElementById('createStageIsInitial').checked;
        const isFinal = document.getElementById('createStageIsFinal').checked;
        
        if (!name) return;
        
        try {
            const response = await fetch(`${API_URL}/stages/team/${currentTeam.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, color, isInitial, isFinal })
            });
            
            if (response.ok) {
                await this.loadTeamStages(currentTeam.id);
                this.hideCreateStageModal();
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Stage created successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error creating stage:', error);
            if (window.app && window.app.ui) {
                window.app.ui.showToast('Failed to create stage', 'error');
            }
        }
    }

    // Edit stage (placeholder)
    editStage(stageId) {
        console.log('Edit stage:', stageId);
        // Could open an edit modal similar to create
    }

    // Delete stage
    async deleteStage(stageId) {
        if (!confirm('Delete this stage? Tasks using this stage will need to be moved.')) return;
        
        try {
            const response = await fetch(`${API_URL}/stages/${stageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                const currentTeam = this.teams.currentTeam;
                if (currentTeam) {
                    await this.loadTeamStages(currentTeam.id);
                }
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Stage deleted successfully', 'success');
                }
            } else {
                const error = await response.json();
                if (window.app && window.app.ui) {
                    window.app.ui.showToast(error.error || 'Failed to delete stage', 'error');
                }
            }
        } catch (error) {
            console.error('Error deleting stage:', error);
            if (window.app && window.app.ui) {
                window.app.ui.showToast('Failed to delete stage', 'error');
            }
        }
    }
}

