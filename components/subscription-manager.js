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
            const response = await fetch(`${API_URL}/subscriptions/plans`);
            if (response.ok) {
                this.plans = await response.json();
                this.renderPlans();
                this.renderFeatureComparison();
            }
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    }
    
    // Render plans to the page
    renderPlans() {
        const container = document.getElementById('subscriptionPlansContainer');
        if (!container || !this.plans.length) return;
        
        let html = '';
        this.plans.forEach(plan => {
            const isCurrentPlan = this.currentSubscription?.plan_id === plan.id;
            const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]');
            
            html += `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${isCurrentPlan ? 'ring-2 ring-purple-600' : ''}">
                    ${isCurrentPlan ? '<div class="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">CURRENT PLAN</div>' : ''}
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">${plan.name}</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">${plan.description}</p>
                    <div class="mb-6">
                        <span class="text-4xl font-bold text-gray-800 dark:text-white">$${plan.price_monthly}</span>
                        <span class="text-gray-600 dark:text-gray-400">/month</span>
                    </div>
                    <ul class="space-y-3 mb-6">
                        ${features.map(feature => `
                            <li class="flex items-start gap-2">
                                <i data-feather="check" class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
                                <span class="text-gray-700 dark:text-gray-300">${feature}</span>
                            </li>
                        `).join('')}
                    </ul>
                    ${!isCurrentPlan ? `
                        <button onclick="window.app.subscriptionManager.selectPlan('${plan.id}')" 
                                class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                            Choose ${plan.name}
                        </button>
                    ` : `
                        <button class="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-semibold cursor-not-allowed">
                            Current Plan
                        </button>
                    `}
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Refresh Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Load user's current subscription
    async loadCurrentSubscription() {
        try {
            const response = await fetch(`${API_URL}/subscriptions/my-subscription`, {
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
    
    // Update UI with current subscription info
    updateUI() {
        // Update current plan banner (main subscriptions view)
        const banner = document.getElementById('currentSubscriptionBanner');
        if (banner && this.currentSubscription) {
            banner.classList.remove('hidden');
            document.getElementById('currentPlanName').textContent = this.currentSubscription.plan_name || 'Free';
            document.getElementById('currentPlanStatus').textContent = this.currentSubscription.status || 'Active';
        }
        
        // Update current subscription in settings modal
        const settingsBanner = document.getElementById('settingsCurrentSubscription');
        if (settingsBanner && this.currentSubscription) {
            settingsBanner.classList.remove('hidden');
            document.getElementById('settingsCurrentPlanName').textContent = this.currentSubscription.plan_name || 'Free';
            document.getElementById('settingsCurrentPlanStatus').textContent = this.currentSubscription.status || 'Active';
        }
        
        // Re-render plans to highlight current plan
        this.renderPlans();
        this.renderSettingsPlans();
        
        // Render feature comparison table
        this.renderFeatureComparison();
    }
    
    // Render plans in settings modal (compact version)
    renderSettingsPlans() {
        const container = document.getElementById('settingsSubscriptionPlans');
        if (!container || !this.plans.length) return;
        
        const currentPlanId = this.currentSubscription?.plan_id || 'free';
        
        let html = this.plans.map(plan => {
            const isCurrent = plan.id === currentPlanId;
            const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]');
            
            return `
                <div class="border-2 ${isCurrent ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-600'} rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-800 dark:text-white">${plan.name}</h4>
                        ${isCurrent ? '<span class="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">Current</span>' : ''}
                    </div>
                    <p class="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                        $${plan.price_monthly}<span class="text-sm font-normal text-gray-600 dark:text-gray-400">/mo</span>
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">${plan.description || ''}</p>
                    ${!isCurrent ? `
                        <button onclick="window.app.subscriptionManager.selectPlan('${plan.id}')" class="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-sm">
                            Choose ${plan.name}
                        </button>
                    ` : `
                        <button class="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg font-semibold cursor-not-allowed text-sm" disabled>
                            Current Plan
                        </button>
                    `}
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        
        // Refresh Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    // Render feature comparison table
    renderFeatureComparison() {
        const tableBody = document.getElementById('featureComparisonTable');
        if (!tableBody || !this.plans.length) return;
        
        // Extract limits from each plan
        const planLimits = {};
        this.plans.forEach(plan => {
            planLimits[plan.id] = typeof plan.limits_json === 'string' 
                ? JSON.parse(plan.limits_json) 
                : plan.limits_json;
        });
        
        // Define features to compare
        const features = [
            { name: 'Tasks', key: 'tasks' },
            { name: 'Teams', key: 'teams' },
            { name: 'Team Members', key: 'team_members' },
            { name: 'Storage', key: 'storage_mb', suffix: 'MB' },
            { name: 'Advanced Analytics', key: 'analytics' },
            { name: 'Priority Support', key: 'priority_support' },
            { name: 'API Access', key: 'api_access' },
            { name: 'Custom Workflows', key: 'custom_workflows' },
            { name: 'SSO', key: 'sso' },
            { name: '24/7 Support', key: 'support_247' },
        ];
        
        let html = '';
        features.forEach(feature => {
            html += '<tr>';
            html += `<td class="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">${feature.name}</td>`;
            
            ['free', 'pro', 'business', 'enterprise'].forEach(planId => {
                const limits = planLimits[planId] || {};
                const value = limits[feature.key];
                
                html += '<td class="px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">';
                
                if (value === undefined) {
                    // Check if it's a premium feature mentioned in plan features
                    const plan = this.plans.find(p => p.id === planId);
                    const features = Array.isArray(plan?.features) ? plan.features : JSON.parse(plan?.features || '[]');
                    const hasFeature = features.some(f => f.toLowerCase().includes(feature.name.toLowerCase()));
                    
                    html += hasFeature 
                        ? '<i data-feather="check" class="w-5 h-5 text-green-500 mx-auto"></i>' 
                        : '<i data-feather="x" class="w-5 h-5 text-gray-400 mx-auto"></i>';
                } else if (value === -1) {
                    html += '<span class="font-semibold text-green-600">Unlimited</span>';
                } else if (value === true) {
                    html += '<i data-feather="check" class="w-5 h-5 text-green-500 mx-auto"></i>';
                } else if (value === false) {
                    html += '<i data-feather="x" class="w-5 h-5 text-gray-400 mx-auto"></i>';
                } else {
                    const suffix = feature.suffix || '';
                    html += `<span class="font-medium">${value}${suffix ? ' ' + suffix : ''}</span>`;
                }
                
                html += '</td>';
            });
            
            html += '</tr>';
        });
        
        tableBody.innerHTML = html;
        
        // Refresh Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Check if user can perform action
    async checkLimit(action) {
        try {
            const response = await fetch(`${API_URL}/api/subscriptions/check-limit`, {
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
                const response = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
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

