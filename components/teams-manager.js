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
        
        // Update active team members in sidebar
        this.renderActiveTeamMembers();
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
        const modal = document.getElementById('createTeamModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('createTeamName').value = '';
            document.getElementById('createTeamDescription').value = '';
        }
    }

    // Hide create team modal
    hideCreateTeamModal() {
        const modal = document.getElementById('createTeamModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Create team
    async createTeam(e) {
        e.preventDefault();
        
        const name = document.getElementById('createTeamName').value.trim();
        const description = document.getElementById('createTeamDescription').value.trim();
        
        if (!name) return;
        
        try {
            const response = await fetch(`${API_URL}/teams`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description })
            });
            
            if (response.ok) {
                await this.loadMyTeams();
                this.hideCreateTeamModal();
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Team created successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error creating team:', error);
            if (window.app && window.app.ui) {
                window.app.ui.showToast('Failed to create team', 'error');
            }
        }
    }

    // View team details
    async viewTeam(teamId) {
        try {
            const response = await fetch(`${API_URL}/teams/${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                const team = await response.json();
                this.currentTeamDetails = team;
                this.renderTeamDetails(team);
                
                const modal = document.getElementById('teamDetailModal');
                if (modal) {
                    modal.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error loading team details:', error);
        }
    }

    // Render team details modal
    renderTeamDetails(team) {
        document.getElementById('teamDetailName').textContent = team.name;
        document.getElementById('teamDetailDescription').textContent = team.description || 'No description';
        
        // Render members
        const membersContainer = document.getElementById('teamMembersList');
        if (membersContainer && team.members) {
            membersContainer.innerHTML = team.members.map(member => `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            ${member.name.charAt(0)}
                        </div>
                        <div>
                            <p class="font-medium text-gray-800 dark:text-white">${member.name}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${member.email}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <select 
                            onchange="window.app.teams.changeMemberRole('${team.id}', '${member.user_id}', this.value)"
                            class="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            ${this.hasPermission('manage_members') ? '' : 'disabled'}
                        >
                            <option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                            <option value="member" ${member.role === 'member' ? 'selected' : ''}>Member</option>
                            <option value="manager" ${member.role === 'manager' ? 'selected' : ''}>Manager</option>
                            <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        ${this.hasPermission('manage_members') && member.user_id !== this.auth.getCurrentUser().id ? `
                            <button onclick="window.app.teams.removeMember('${team.id}', '${member.user_id}')" 
                                    class="text-red-500 hover:text-red-700 p-1">
                                <i data-feather="x" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
            
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }
    }

    // Hide team detail modal
    hideTeamDetailModal() {
        const modal = document.getElementById('teamDetailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Show invite member modal
    showInviteMemberModal() {
        const modal = document.getElementById('inviteMemberModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('inviteMemberEmail').value = '';
            document.getElementById('inviteMemberRole').value = 'member';
        }
    }

    // Hide invite member modal
    hideInviteMemberModal() {
        const modal = document.getElementById('inviteMemberModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Invite member
    async inviteMember(e) {
        e.preventDefault();
        
        if (!this.currentTeamDetails) return;
        
        const email = document.getElementById('inviteMemberEmail').value.trim();
        const role = document.getElementById('inviteMemberRole').value;
        
        if (!email) return;
        
        try {
            const response = await fetch(`${API_URL}/teams/${this.currentTeamDetails.id}/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, role })
            });
            
            if (response.ok) {
                this.hideInviteMemberModal();
                await this.viewTeam(this.currentTeamDetails.id);
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Member invited successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error inviting member:', error);
            if (window.app && window.app.ui) {
                window.app.ui.showToast('Failed to invite member', 'error');
            }
        }
    }

    // Change member role
    async changeMemberRole(teamId, userId, newRole) {
        try {
            const response = await fetch(`${API_URL}/teams/${teamId}/members/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });
            
            if (response.ok) {
                await this.viewTeam(teamId);
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Member role updated', 'success');
                }
            }
        } catch (error) {
            console.error('Error changing member role:', error);
        }
    }

    // Remove member
    async removeMember(teamId, userId) {
        if (!confirm('Remove this member from the team?')) return;
        
        try {
            const response = await fetch(`${API_URL}/teams/${teamId}/members/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            
            if (response.ok) {
                await this.viewTeam(teamId);
                if (window.app && window.app.ui) {
                    window.app.ui.showToast('Member removed', 'success');
                }
            }
        } catch (error) {
            console.error('Error removing member:', error);
        }
    }

    // Delete team
    async deleteTeam(teamId) {
        if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;
        
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
            if (window.app && window.app.ui) {
                window.app.ui.showToast('Failed to delete team', 'error');
            }
        }
    }

    // Render active team members in sidebar
    renderActiveTeamMembers() {
        const section = document.getElementById('activeTeamMembersSection');
        const listContainer = document.getElementById('activeTeamMembersList');
        
        if (!section || !listContainer) return;
        
        // Show section if there's a current team, hide otherwise
        if (!this.currentTeam || !this.currentTeam.members || this.currentTeam.members.length === 0) {
            section.classList.add('hidden');
            return;
        }
        
        section.classList.remove('hidden');
        
        // Limit to first 5 members for sidebar display
        const displayMembers = this.currentTeam.members.slice(0, 5);
        
        listContainer.innerHTML = displayMembers.map(member => {
            const initial = member.name.charAt(0).toUpperCase();
            const roleColor = {
                'admin': 'from-red-500 to-pink-500',
                'manager': 'from-purple-500 to-blue-500',
                'member': 'from-blue-500 to-cyan-500',
                'viewer': 'from-gray-400 to-gray-600'
            }[member.role] || 'from-gray-400 to-gray-600';
            
            return `
                <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div class="w-8 h-8 bg-gradient-to-br ${roleColor} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        ${initial}
                    </div>
                    <div class="flex-1 min-w-0 sidebar-text">
                        <p class="text-sm font-medium text-gray-800 dark:text-white truncate">${member.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${member.role}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add "view all" link if there are more members
        if (this.currentTeam.members.length > 5) {
            listContainer.innerHTML += `
                <button onclick="showView('teams')" 
                        class="w-full text-center p-2 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors sidebar-text">
                    View all ${this.currentTeam.members.length} members →
                </button>
            `;
        }
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
}

