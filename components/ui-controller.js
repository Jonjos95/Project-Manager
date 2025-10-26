// UI Controller Module
// Handles all UI interactions, modals, theme, sidebar, and view switching

class UIController {
    constructor() {
        this.THEME_KEY = 'theme';
        this.SIDEBAR_KEY = 'sidebar';
        this.currentView = 'board';
        this.sidebarCollapsed = false;
    }

    // Initialize UI
    init() {
        this.loadTheme();
        this.loadSidebarState();
        this.setupEventListeners();
        this.showView('board');
    }

    // Theme Management
    loadTheme() {
        const theme = localStorage.getItem(this.THEME_KEY) || 'light';
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem(this.THEME_KEY, 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem(this.THEME_KEY, 'dark');
        }
        
        // Update Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Sidebar Management
    loadSidebarState() {
        const collapsed = localStorage.getItem(this.SIDEBAR_KEY) === 'true';
        this.sidebarCollapsed = collapsed;
        this.applySidebarCollapse();
    }

    toggleSidebarCollapse() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        localStorage.setItem(this.SIDEBAR_KEY, this.sidebarCollapsed.toString());
        this.applySidebarCollapse();
    }

    applySidebarCollapse() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const sidebarTitle = document.getElementById('sidebarTitle');
        const collapseBtn = document.getElementById('collapseBtn');
        const collapseIcon = document.getElementById('collapseIcon');
        const countersSection = document.getElementById('countersSection');
        
        if (this.sidebarCollapsed) {
            // Collapse sidebar
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-20', 'sidebar-collapsed');
            mainContent.classList.remove('md:ml-64', 'lg:ml-64', 'ml-64');
            mainContent.classList.add('md:ml-20', 'lg:ml-20', 'ml-20');
            
            // Hide text elements, title, and collapse button (but keep counters visible)
            if (sidebarTitle) sidebarTitle.classList.add('hidden');
            if (collapseBtn) collapseBtn.classList.add('hidden');
            
            document.querySelectorAll('.sidebar-text, .nav-text, .filter-text').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Center buttons and adjust padding
            document.querySelectorAll('.nav-btn, .filter-btn').forEach(btn => {
                btn.classList.add('justify-center', 'px-2', 'py-4');
                btn.classList.remove('px-4', 'py-2');
            });
            
            // Adjust counter padding for collapsed state
            if (countersSection) {
                countersSection.querySelectorAll('.p-3').forEach(counter => {
                    counter.classList.remove('p-3');
                    counter.classList.add('p-2');
                });
            }
            
            // Change collapse icon direction
            if (collapseIcon) collapseIcon.setAttribute('data-feather', 'chevrons-right');
            
            // Re-render all Feather icons to apply size changes
            if (typeof feather !== 'undefined') feather.replace();
            
        } else {
            // Expand sidebar
            sidebar.classList.remove('w-20', 'sidebar-collapsed');
            sidebar.classList.add('w-64');
            mainContent.classList.remove('md:ml-20', 'lg:ml-20', 'ml-20');
            mainContent.classList.add('md:ml-64', 'lg:ml-64', 'ml-64');
            
            // Show text elements, title, and collapse button
            if (sidebarTitle) sidebarTitle.classList.remove('hidden');
            if (collapseBtn) collapseBtn.classList.remove('hidden');
            
            document.querySelectorAll('.sidebar-text, .nav-text, .filter-text').forEach(el => {
                el.classList.remove('hidden');
            });
            
            // Restore button alignment and padding
            document.querySelectorAll('.nav-btn, .filter-btn').forEach(btn => {
                btn.classList.remove('justify-center', 'px-2', 'py-4');
                btn.classList.add('px-4', 'py-2');
            });
            
            // Restore counter padding for expanded state
            if (countersSection) {
                countersSection.querySelectorAll('.p-2').forEach(counter => {
                    counter.classList.remove('p-2');
                    counter.classList.add('p-3');
                });
            }
            
            // Change collapse icon direction
            if (collapseIcon) collapseIcon.setAttribute('data-feather', 'chevrons-left');
            
            // Re-render all Feather icons to apply size changes
            if (typeof feather !== 'undefined') feather.replace();
        }
        
        // Update Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    expandSidebarIfCollapsed() {
        if (this.sidebarCollapsed) {
            this.toggleSidebarCollapse();
        }
    }

    // View Management
    showView(viewName) {
        this.currentView = viewName;
        
        const views = ['boardView', 'analyticsView', 'timelineView', 'reportsView'];
        views.forEach(view => {
            const el = document.getElementById(view);
            if (el) {
                el.classList.add('hidden');
            }
        });
        
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
        
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('bg-purple-100', 'dark:bg-gray-800', 'text-purple-700', 'dark:text-purple-400');
        });
        
        const activeBtn = document.querySelector(`[onclick="app.ui.showView('${viewName}')"]`);
        if (activeBtn) {
            activeBtn.classList.add('bg-purple-100', 'dark:bg-gray-800', 'text-purple-700', 'dark:text-purple-400');
        }
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.toggle('hidden');
            modal.classList.toggle('flex');
        }
    }

    // Dropdown Menus
    toggleProfileMenu() {
        const menu = document.getElementById('profileMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }

    toggleSettingsMenu() {
        this.toggleModal('settingsModal');
    }

    toggleHelpMenu() {
        this.toggleModal('helpModal');
    }

    toggleNotifications() {
        // Implement notification dropdown
        alert('Notifications feature coming soon!');
    }

    // Mobile Menu
    toggleMobileMenu() {
        const overlay = document.getElementById('mobileMenuOverlay');
        if (overlay) {
            overlay.classList.toggle('hidden');
        }
    }

    closeMobileMenu() {
        const overlay = document.getElementById('mobileMenuOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // Search Management
    toggleMobileSearch() {
        const searchBar = document.getElementById('searchBar');
        if (searchBar) {
            searchBar.classList.toggle('hidden');
            searchBar.classList.toggle('flex');
            
            if (!searchBar.classList.contains('hidden')) {
                setTimeout(() => {
                    const input = document.getElementById('searchInput');
                    if (input) input.focus();
                }, 100);
            }
        }
    }

    // Floating Add Button
    showFloatingAddButton() {
        const btn = document.getElementById('floatingAddBtn');
        if (btn) {
            btn.classList.remove('hidden');
        }
    }

    hideFloatingAddButton() {
        const btn = document.getElementById('floatingAddBtn');
        if (btn) {
            btn.classList.add('hidden');
        }
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
        } text-white`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Confirmation Dialog
    confirm(message) {
        return window.confirm(message);
    }

    // Alert
    alert(message) {
        window.alert(message);
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            const profileMenu = document.getElementById('profileMenu');
            const profileBtn = e.target.closest('[onclick*="toggleProfileMenu"]');
            
            if (profileMenu && !profileMenu.contains(e.target) && !profileBtn) {
                profileMenu.classList.add('hidden');
            }
        });

        // Close modals when clicking backdrop
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    e.target.closest('.modal').classList.add('hidden');
                    e.target.closest('.modal').classList.remove('flex');
                }
            });
        });

        // Handle Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close all modals
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                });
                
                // Close dropdowns
                const profileMenu = document.getElementById('profileMenu');
                if (profileMenu) {
                    profileMenu.classList.add('hidden');
                }
            }
        });
    }

    // Update Feather Icons
    refreshIcons() {
        if (typeof feather !== 'undefined') {
            feather.replace();
            
            // FORCE icon sizes after Feather converts them to SVG
            // Navigation icons - 24px
            document.querySelectorAll('.nav-btn svg, .filter-btn svg').forEach(svg => {
                svg.setAttribute('width', '24');
                svg.setAttribute('height', '24');
            });
            
            // Counter icons - 28px
            document.querySelectorAll('.counter-icon').forEach(icon => {
                // Find the SVG that replaced this icon
                const svg = icon.tagName === 'svg' ? icon : icon.parentElement.querySelector('svg');
                if (svg) {
                    svg.setAttribute('width', '28');
                    svg.setAttribute('height', '28');
                }
            });
            
            document.querySelectorAll('#countersSection svg').forEach(svg => {
                svg.setAttribute('width', '28');
                svg.setAttribute('height', '28');
            });
        }
    }

    // Get current view
    getCurrentView() {
        return this.currentView;
    }

    // Check if sidebar is collapsed
    isSidebarCollapsed() {
        return this.sidebarCollapsed;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}

