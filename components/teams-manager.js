// Teams Manager Component
// Handles team collaboration, roles, and permissions

class TeamsManager {
    constructor(authManager) {
        this.auth = authManager;
        this.currentTeam = null;
        this.myTeams = [];
        this.currentRole = 'member';
        this.impersonating = false;
        this.impersonatedRole = null;
        
        // Role permissions matrix
        this.permissions = {
            admin: ['create_team', 'delete_team', 'edit_team', 'invite_member', 'remove_member', 'change_roles', 'create_task', 'edit_task', 'delete_task', 'assign_task', 'view_all'],
            manager: ['edit_team', 'invite_member', 'create_task', 'edit_task', 'delete_task', 'assign_task', 'view_all'],
            member: ['create_task', 'edit_own_task', 'view_all'],
            viewer: ['view_all']
        };
    }

    async init() {
        await this.loadMyTeams();
        await this.loadCurrentRole();
        this.updateTeamSwitcher();
        this.checkAdminStatus();
    }

    // Load user's teams
    async loadMyTeams() {
        try {
            const response = await fetch(`${API_URL}/teams`, {
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            if (response.ok) {
                this.myTeams = await response.json();
                this.renderTeams();
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    }

    // Load current user's role
    async loadCurrentRole() {
        const user = this.auth.getCurrentUser();
        if (user && user.role) {
            this.currentRole = user.role;
        }
        this.updateRoleBadge();
    }

    // Check if user is admin
    checkAdminStatus() {
        if (this.currentRole === 'admin') {
            const panel = document.getElementById('adminImpersonationPanel');
            if (panel) {
                // Show impersonation panel but collapsed
                const btn = document.createElement('button');
                btn.className = 'mb-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2';
                btn.innerHTML = '<i data-feather="eye" class="w-4 h-4"></i><span>Enable Testing Mode</span>';
                btn.onclick = () => this.enableImpersonation();
                
                const container = panel.parentElement;
                if (!document.getElementById('enableTestModeBtn')) {
                    btn.id = 'enableTestModeBtn';
                    container.insertBefore(btn, panel);
                }
            }
        }
    }

    // Enable impersonation mode
    enableImpersonation() {
        this.impersonating = true;
        this.impersonatedRole = 'member';
        
        const panel = document.getElementById('adminImpersonationPanel');
        const btn = document.getElementById('enableTestModeBtn');
        
        if (panel) panel.classList.remove('hidden');
        if (btn) btn.classList.add('hidden');
        
        this.applyRolePermissions();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Disable impersonation mode
    disableImpersonation() {
        this.impersonating = false;
        this.impersonatedRole = null;
        
        const panel = document.getElementById('adminImpersonationPanel');
        const btn = document.getElementById('enableTestModeBtn');
        
        if (panel) panel.classList.add('hidden');
        if (btn) btn.classList.remove('hidden');
        
        this.applyRolePermissions();
    }

    // Change impersonated role
    changeImpersonationRole(role) {
        this.impersonatedRole = role;
        document.getElementById('impersonatedRoleName').textContent = role.charAt(0).toUpperCase() + role.slice(1);
        this.applyRolePermissions();
    }

    // Get effective role (considering impersonation)
    getEffectiveRole() {
        return this.impersonating ? this.impersonatedRole : this.currentRole;
    }

    // Check if user has permission
    hasPermission(permission) {
        const role = this.getEffectiveRole();
        return this.permissions[role]?.includes(permission) || false;
    }

    // Apply role-based UI restrictions
    applyRolePermissions() {
        const role = this.getEffectiveRole();
        
        // Show/hide create team button
        const createTeamBtn = document.querySelector('[onclick*="showCreateTeamModal"]');
        if (createTeamBtn) {
            createTeamBtn.style.display = this.hasPermission('create_team') ? 'flex' : 'none';
        }
        
        // Show/hide delete/edit buttons on teams
        document.querySelectorAll('[data-permission]').forEach(el => {
            const permission = el.getAttribute('data-permission');
            el.style.display = this.hasPermission(permission) ? 'block' : 'none';
        });
        
        // Re-render teams to apply permissions
        this.renderTeams();
    }

    // Update role badge
    updateRoleBadge() {
        const roleBadge = document.getElementById('currentUserRole');
        if (roleBadge) {
            const role = this.getEffectiveRole();
            roleBadge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        }
    }

    // Update team switcher dropdown
    updateTeamSwitcher() {
        const currentTeamName = document.getElementById('currentTeamName');
        if (currentTeamName) {
            currentTeamName.textContent = this.currentTeam ? this.currentTeam.name : 'Personal';
        }
    }

    // Toggle team switcher dropdown
    toggleTeamSwitcher() {
        // Create dropdown menu
        const btn = document.getElementById('teamSwitcherBtn');
        if (!btn) return;
        
        // Check if dropdown already exists
        let dropdown = document.getElementById('teamSwitcherDropdown');
        if (dropdown) {
            dropdown.remove();
            return;
        }
        
        // Create dropdown
        dropdown = document.createElement('div');
        dropdown.id = 'teamSwitcherDropdown';
        dropdown.className = 'absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-2';
        
        let html = `
            <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Switch Team</p>
            </div>
            <div class="max-h-64 overflow-y-auto">
                <button onclick="window.app.teams.switchTeam(null)" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${!this.currentTeam ? 'bg-purple-50 dark:bg-purple-900/20' : ''}">
                    <i data-feather="user" class="w-4 h-4"></i>
                    <span class="font-medium">Personal</span>
                </button>
        `;
        
        this.myTeams.forEach(team => {
            const isActive = this.currentTeam && this.currentTeam.id === team.id;
            html += `
                <button onclick="window.app.teams.switchTeam('${team.id}')" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${isActive ? 'bg-purple-50 dark:bg-purple-900/20' : ''}">
                    <i data-feather="users" class="w-4 h-4"></i>
                    <span class="font-medium">${team.name}</span>
                    <span class="ml-auto text-xs text-gray-500">${team.member_count} members</span>
                </button>
            `;
        });
        
        html += `
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <button onclick="window.app.teams.showCreateTeamModal(); document.getElementById('teamSwitcherDropdown').remove();" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <i data-feather="plus" class="w-4 h-4"></i>
                    <span class="font-medium">Create Team</span>
                </button>
            </div>
        `;
        
        dropdown.innerHTML = html;
        
        // Position dropdown
        const rect = btn.getBoundingClientRect();
        btn.parentElement.style.position = 'relative';
        btn.parentElement.appendChild(dropdown);
        
        // Refresh icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }

    // Switch active team
    async switchTeam(teamId) {
        if (teamId) {
            const team = this.myTeams.find(t => t.id === teamId);
            if (team) {
                this.currentTeam = team;
                localStorage.setItem('currentTeam', teamId);
            }
        } else {
            this.currentTeam = null;
            localStorage.removeItem('currentTeam');
        }
        
        this.updateTeamSwitcher();
        
        // Close dropdown
        const dropdown = document.getElementById('teamSwitcherDropdown');
        if (dropdown) dropdown.remove();
        
        // Reload tasks for the new team context
        if (window.app && window.app.taskManager) {
            await window.app.taskManager.init();
            if (window.app.board) {
                window.app.board.render();
            }
        }
        
        // Refresh assignment dropdowns
        if (typeof updateTaskAssignees === 'function') {
            updateTaskAssignees();
        }
        if (typeof updateTaskDependencies === 'function') {
            updateTaskDependencies();
        }
    }

    // Render teams grid
    renderTeams() {
        const grid = document.getElementById('teamsGrid');
        if (!grid || !this.myTeams.length) return;
        
        let html = '';
        this.myTeams.forEach(team => {
            const canEdit = this.hasPermission('edit_team');
            const canDelete = this.hasPermission('delete_team');
            
            html += `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-lg">${team.name.charAt(0)}</span>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-800 dark:text-white">${team.name}</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${team.member_count} members</p>
                            </div>
                        </div>
                        ${canDelete ? `
                            <button onclick="window.app.teams.deleteTeam('${team.id}')" class="text-red-500 hover:text-red-700 transition-colors" data-permission="delete_team">
                                <i data-feather="trash-2" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">${team.description || 'No description'}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                            ${team.user_role}
                        </span>
                        <button onclick="window.app.teams.viewTeam('${team.id}')" class="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                            View Details →
                        </button>
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Show create team modal
    showCreateTeamModal() {
        // Implementation will be added
        console.log('Create team modal - to be implemented');
    }

    // View team details
    viewTeam(teamId) {
        // Implementation will be added
        console.log('View team:', teamId);
    }

    // Delete team
    async deleteTeam(teamId) {
        if (!confirm('Are you sure you want to delete this team?')) return;
        
        try {
            const response = await fetch(`${API_URL}/teams/${teamId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                await this.loadMyTeams();
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Team deleted successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error deleting team:', error);
        }
    }
}

