// Subscription Manager Component
// Handles subscription display, upgrades, and limits

class SubscriptionManager {
    constructor(authManager) {
        this.auth = authManager;
        this.currentSubscription = null;
        this.plans = [];
    }

    async init() {
        await this.loadPlans();
        await this.loadCurrentSubscription();
    }

    // Load available plans
    async loadPlans() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`);
            if (response.ok) {
                this.plans = await response.json();
            }
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    }

    // Load user's current subscription
    async loadCurrentSubscription() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscriptions/my-subscription`, {
                headers: {
                    'Authorization': `Bearer ${this.auth.getToken()}`
                }
            });
            if (response.ok) {
                this.currentSubscription = await response.json();
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        }
    }

    // Check if user can perform action
    async checkLimit(action) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscriptions/check-limit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.auth.getToken()}`
                },
                body: JSON.stringify({ action })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (!result.allowed) {
                    this.showUpgradePrompt(result.reason);
                }
                return result.allowed;
            }
            return false;
        } catch (error) {
            console.error('Error checking limit:', error);
            return false;
        }
    }

    // Show upgrade prompt
    showUpgradePrompt(reason) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4">
                <div class="text-center mb-6">
                    <div class="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                        <i data-feather="lock" class="w-8 h-8 text-purple-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">Upgrade Required</h3>
                    <p class="text-gray-600 dark:text-gray-400">${reason}</p>
                </div>
                <div class="space-y-3">
                    <button onclick="window.app.subscription.showPricingModal()" class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                        View Plans
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Refresh Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Show pricing modal
    showPricingModal() {
        // Close any existing upgrade prompts
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-6xl w-full my-8">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Choose Your Plan</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <i data-feather="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${this.renderPlanCards()}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Refresh Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Render plan cards
    renderPlanCards() {
        return this.plans.map(plan => {
            const features = JSON.parse(plan.features || '[]');
            const isCurrentPlan = this.currentSubscription?.plan_id === plan.id;
            
            return `
                <div class="border-2 ${isCurrentPlan ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-6 relative hover:shadow-lg transition-shadow">
                    ${isCurrentPlan ? '<div class="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">CURRENT</div>' : ''}
                    
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">${plan.name}</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">${plan.description}</p>
                    
                    <div class="mb-6">
                        <span class="text-4xl font-bold text-purple-600">$${plan.price_monthly}</span>
                        <span class="text-gray-600 dark:text-gray-400">/month</span>
                        ${plan.price_yearly > 0 ? `<div class="text-sm text-gray-500 mt-1">or $${plan.price_yearly}/year (save ${Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)</div>` : ''}
                    </div>
                    
                    <ul class="space-y-3 mb-6">
                        ${features.map(feature => `
                            <li class="flex items-start gap-2 text-sm">
                                <i data-feather="check" class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5"></i>
                                <span class="text-gray-700 dark:text-gray-300">${feature}</span>
                            </li>
                        `).join('')}
                    </ul>
                    
                    <button 
                        onclick="window.app.subscription.selectPlan('${plan.id}')" 
                        class="w-full px-4 py-2 ${isCurrentPlan ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg font-semibold transition-colors"
                        ${isCurrentPlan ? 'disabled' : ''}
                    >
                        ${isCurrentPlan ? 'Current Plan' : plan.price_monthly > 0 ? 'Upgrade' : 'Downgrade to Free'}
                    </button>
                </div>
            `;
        }).join('');
    }

    // Select a plan
    async selectPlan(planId) {
        if (planId === 'free') {
            // Downgrade to free - confirm first
            if (confirm('Are you sure you want to downgrade to the free plan? You will lose access to premium features.')) {
                // TODO: Handle downgrade
                alert('Downgrade functionality coming soon!');
            }
        } else {
            // Upgrade to paid plan
            try {
                const response = await fetch(`${API_BASE_URL}/api/subscriptions/create-checkout-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.auth.getToken()}`
                    },
                    body: JSON.stringify({ 
                        planId, 
                        billingCycle: 'monthly' // TODO: Let user choose
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    alert('Stripe integration pending. Plan selected: ' + planId);
                    // TODO: Redirect to Stripe checkout
                    // window.location.href = result.checkoutUrl;
                }
            } catch (error) {
                console.error('Error selecting plan:', error);
                alert('Failed to process upgrade. Please try again.');
            }
        }
    }

    // Update UI with current subscription
    updateUI() {
        if (!this.currentSubscription) return;
        
        // Update any subscription indicators in the UI
        const planBadges = document.querySelectorAll('[data-subscription-badge]');
        planBadges.forEach(badge => {
            badge.textContent = this.currentSubscription.plan_name;
            badge.className = `px-3 py-1 rounded-full text-xs font-semibold ${
                this.currentSubscription.plan_id === 'free' ? 'bg-gray-200 text-gray-700' :
                this.currentSubscription.plan_id === 'pro' ? 'bg-purple-200 text-purple-700' :
                this.currentSubscription.plan_id === 'business' ? 'bg-blue-200 text-blue-700' :
                'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
            }`;
        });
    }

    // Get current plan
    getCurrentPlan() {
        return this.currentSubscription?.plan_name || 'Free';
    }

    // Check if feature is available
    hasFeature(feature) {
        if (!this.currentSubscription) return false;
        const limits = JSON.parse(this.currentSubscription.limits_json || '{}');
        return limits[feature] === -1 || limits[feature] > 0;
    }
}

// Make it globally available
window.SubscriptionManager = SubscriptionManager;

