// Liquid Glass UI Controller Module
// Applies glassmorphism effects throughout the application

class GlassUI {
    constructor() {
        this.isEnabled = true;
    }

    init() {
        console.log('🔮 Initializing Liquid Glass UI...');
        this.applyGlassEffects();
        this.setupDynamicEffects();
    }

    applyGlassEffects() {
        // Apply glass effect to main containers
        this.applyToSidebar();
        this.applyToHeader();
        this.applyToCards();
        this.applyToModals();
        this.applyToInputs();
        this.applyToButtons();
        this.applyToBackground();
    }

    applyToSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('glass-frosted');
            
            // Add shine effect to navigation buttons
            const navButtons = sidebar.querySelectorAll('.nav-btn, .filter-btn');
            navButtons.forEach(btn => {
                btn.classList.add('glass-shine');
            });
        }
    }

    applyToHeader() {
        const header = document.querySelector('header');
        if (header) {
            header.classList.add('glass-frosted');
            
            // Add glass effect to header elements
            const searchBar = document.getElementById('mainSearch');
            if (searchBar) {
                searchBar.classList.add('glass-input');
            }
        }
    }

    applyToCards() {
        // Apply glass effect to all card-like containers
        const cardSelectors = [
            '.bg-white.dark\\:bg-gray-800.rounded-lg',
            '.bg-gradient-to-br',
            '#quickStatTotal, #quickStatActive, #quickStatDone, #quickStatRate'
        ];

        cardSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Only apply if not already a button or input
                if (!el.matches('button') && !el.matches('input') && !el.matches('select')) {
                    el.classList.add('glass-card', 'glass-reflect');
                }
            });
        });

        // Special treatment for task cards
        const taskCards = document.querySelectorAll('[data-task-id]');
        taskCards.forEach(card => {
            card.classList.add('glass-card', 'glass-shine', 'glass-reflect');
        });

        // Apply to Quick Stats cards
        const statCards = document.querySelectorAll('#quickStatTotal, #quickStatActive, #quickStatDone, #quickStatRate');
        statCards.forEach(card => {
            const parent = card.closest('.bg-white, .dark\\:bg-gray-800\\/50');
            if (parent) {
                parent.classList.add('glass-card', 'glass-reflect');
            }
        });
    }

    applyToModals() {
        const modalSelectors = [
            '#detailModal',
            '#editModal',
            '#settingsModal',
            '#helpModal',
            '#loginModal',
            '#registerModal'
        ];

        modalSelectors.forEach(selector => {
            const modal = document.querySelector(selector);
            if (modal) {
                // Apply glass effect to modal content
                const modalContent = modal.querySelector('.bg-white, .dark\\:bg-gray-800');
                if (modalContent) {
                    modalContent.classList.add('glass-panel', 'glass-reflect');
                }
            }
        });
    }

    applyToInputs() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, select');
        inputs.forEach(input => {
            input.classList.add('glass-input');
        });
    }

    applyToButtons() {
        // Apply glass effect to primary buttons (purple gradient)
        const primaryButtons = document.querySelectorAll(
            '.bg-purple-600, .bg-gradient-to-r.from-purple-600, button[class*="purple"]'
        );
        
        primaryButtons.forEach(btn => {
            btn.classList.add('glass-button', 'glass-shine');
        });

        // Add subtle glass effect to secondary buttons
        const secondaryButtons = document.querySelectorAll(
            '.bg-blue-600, .bg-green-600, .bg-red-600'
        );
        
        secondaryButtons.forEach(btn => {
            btn.classList.add('glass-shine');
        });
    }

    applyToBackground() {
        // Apply liquid gradient background to main content area
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.classList.add('glass-gradient-bg');
        }

        // Apply to empty state overlay
        const emptyState = document.getElementById('emptyStateOverlay');
        if (emptyState) {
            const emptyContent = emptyState.querySelector('.bg-white');
            if (emptyContent) {
                emptyContent.classList.add('glass-panel', 'glass-liquid-border');
            }
        }
    }

    setupDynamicEffects() {
        // Observe DOM changes to apply glass effects to dynamically added elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            this.applyToNewElement(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Reapply effects when view changes
        document.addEventListener('viewChanged', () => {
            setTimeout(() => this.applyGlassEffects(), 100);
        });
    }

    applyToNewElement(element) {
        // Apply glass effects to newly added elements
        if (element.matches('.bg-white, .bg-gray-800')) {
            if (element.closest('#kanbanBoardColumns')) {
                // Task card
                element.classList.add('glass-card', 'glass-shine', 'glass-reflect');
            } else if (element.matches('[role="dialog"]')) {
                // Modal
                element.classList.add('glass-panel', 'glass-reflect');
            }
        }

        // Apply to inputs in new elements
        const inputs = element.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.classList.add('glass-input');
        });

        // Apply to buttons in new elements
        const buttons = element.querySelectorAll('button[class*="purple"], button[class*="blue"]');
        buttons.forEach(btn => {
            btn.classList.add('glass-button', 'glass-shine');
        });
    }

    // Refresh all glass effects (call this when rendering views)
    refresh() {
        setTimeout(() => {
            this.applyGlassEffects();
        }, 50);
    }

    // Add shimmer effect to loading states
    addLoadingShimmer(element) {
        if (element) {
            element.classList.add('glass-shimmer');
        }
    }

    removeLoadingShimmer(element) {
        if (element) {
            element.classList.remove('glass-shimmer');
        }
    }

    // Toggle glass effects on/off
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (this.isEnabled) {
            this.applyGlassEffects();
        } else {
            this.removeAllGlassEffects();
        }
    }

    removeAllGlassEffects() {
        const glassClasses = [
            'glass-card', 'glass-frosted', 'glass-shine', 'glass-shimmer',
            'glass-button', 'glass-panel', 'glass-gradient-bg', 'glass-scroll',
            'glass-reflect', 'glass-liquid-border', 'glass-input'
        ];

        glassClasses.forEach(className => {
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(el => el.classList.remove(className));
        });
    }
}

// Make it globally available
window.GlassUI = GlassUI;

