# 💳 Subscription Model Implementation Guide
## N8tive.io Project Manager

This guide walks you through implementing a complete subscription/payment system using Stripe.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Stripe Account Setup](#stripe-account-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Integration](#frontend-integration)
6. [Testing](#testing)
7. [Going Live](#going-live)

---

## 🎯 Overview

### **Subscription Tiers:**
- **Free**: 10 tasks, 1 team, basic features
- **Pro**: Unlimited tasks, 5 teams, $9.99/month
- **Business**: Unlimited everything, advanced features, $29.99/month
- **Enterprise**: Custom, dedicated support, $99.99/month

### **Tech Stack:**
- **Payment Processor**: Stripe
- **Backend**: Node.js + Express + MySQL
- **Frontend**: Vanilla JavaScript
- **Webhooks**: Stripe Webhook Events

---

## 🗄️ Database Setup

### **Step 1: Run Migration**
```bash
cd backend
mysql -u your_username -p your_database < subscriptions-schema.sql
```

This creates:
- `subscription_plans` - Available plans
- `user_subscriptions` - User's active subscriptions
- `payment_history` - Payment records
- `usage_tracking` - Usage metrics for limits

### **Step 2: Verify Tables**
```sql
SHOW TABLES;
SELECT * FROM subscription_plans;
```

---

## 🔑 Stripe Account Setup

### **Step 1: Create Stripe Account**
1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete verification (for live payments)

### **Step 2: Get API Keys**
1. Dashboard → Developers → API Keys
2. Copy **Publishable Key** (starts with `pk_`)
3. Copy **Secret Key** (starts with `sk_`)
4. Use **Test Mode** keys for development

### **Step 3: Create Products in Stripe**
1. Dashboard → Products → Add Product
2. Create products for each plan:
   - **Pro Plan** - $9.99/month
   - **Business Plan** - $29.99/month
   - **Enterprise Plan** - $99.99/month
3. Copy the **Price IDs** (starts with `price_`)

### **Step 4: Update Database with Price IDs**
```sql
UPDATE subscription_plans 
SET stripe_price_id_monthly = 'price_xxxxx' 
WHERE id = 'pro';

UPDATE subscription_plans 
SET stripe_price_id_yearly = 'price_yyyyy' 
WHERE id = 'pro';

-- Repeat for business and enterprise
```

### **Step 5: Set up Webhooks**
1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/subscriptions/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy **Webhook Secret** (starts with `whsec_`)

---

## ⚙️ Backend Configuration

### **Step 1: Install Stripe SDK**
```bash
cd backend
npm install stripe
```

### **Step 2: Update `.env`**
```env
# Existing variables...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
FRONTEND_URL=http://54.158.1.37
```

### **Step 3: Uncomment Stripe Code**
Open `backend/routes/subscriptions.js` and uncomment:
```javascript
// Line 6: Uncomment
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Lines 75-88: Uncomment Stripe checkout creation
// Lines 100-105: Uncomment Stripe portal creation  
// Lines 153-183: Uncomment webhook handling
```

### **Step 4: Add Route to Server**
Edit `backend/server.js`:
```javascript
// Add after existing routes
app.use('/api/subscriptions', require('./routes/subscriptions'));
```

### **Step 5: Restart Backend**
```bash
pm2 restart n8tive-backend
```

---

## 🎨 Frontend Integration

### **Step 1: Add Stripe.js**
Edit `index.html`, add before closing `</head>`:
```html
<!-- Stripe.js -->
<script src="https://js.stripe.com/v3/"></script>
```

### **Step 2: Load Subscription Component**
Edit `index.html`, add before `script.js`:
```html
<script src="components/subscription-manager.js?v=1.0"></script>
```

### **Step 3: Initialize in App**
Edit `script.js`:
```javascript
constructor() {
    // ... existing code ...
    this.subscription = null; // Add this line
}

async initializeAfterLogin(user) {
    // ... existing code ...
    
    // Initialize subscription manager
    this.subscription = new SubscriptionManager(this.auth);
    await this.subscription.init();
    
    // ... rest of code ...
}
```

### **Step 4: Add Subscription Page to Navigation**
Edit `index.html` sidebar, add after Reports button:
```html
<button data-view="subscription" class="nav-btn w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Subscription">
    <i data-feather="credit-card" class="w-6 h-6"></i>
    <span class="nav-text">Subscription</span>
</button>
```

### **Step 5: Create Subscription View**
Edit `index.html`, add after Reports View:
```html
<!-- Subscription View -->
<div id="subscriptionView" class="view-content hidden">
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Subscription & Billing</h2>
        <p class="text-gray-600 dark:text-gray-400">Manage your subscription and view billing history</p>
    </div>
    
    <!-- Current Plan Card -->
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8 mb-6">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-1">Current Plan</h3>
                <p id="currentPlanName" class="text-3xl font-bold text-purple-600">Loading...</p>
            </div>
            <div class="text-right">
                <span id="currentPlanPrice" class="text-2xl font-bold text-gray-800 dark:text-white">$0</span>
                <span class="text-gray-600 dark:text-gray-400">/month</span>
            </div>
        </div>
        <div class="flex gap-4 mt-6">
            <button onclick="window.app.subscription.showPricingModal()" class="px-6 py-3 bg-white dark:bg-gray-800 text-purple-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                View All Plans
            </button>
            <button onclick="alert('Manage billing coming soon!')" class="px-6 py-3 border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-lg font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                Manage Billing
            </button>
        </div>
    </div>
    
    <!-- Usage Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks</h4>
                <i data-feather="list" class="w-5 h-5 text-purple-600"></i>
            </div>
            <p id="usageTasks" class="text-2xl font-bold text-gray-800 dark:text-white">0 / ∞</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400">Teams</h4>
                <i data-feather="users" class="w-5 h-5 text-blue-600"></i>
            </div>
            <p id="usageTeams" class="text-2xl font-bold text-gray-800 dark:text-white">0 / ∞</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400">Storage</h4>
                <i data-feather="hard-drive" class="w-5 h-5 text-green-600"></i>
            </div>
            <p id="usageStorage" class="text-2xl font-bold text-gray-800 dark:text-white">0 MB / ∞</p>
        </div>
    </div>
</div>
```

### **Step 6: Add Usage Checks**
When creating tasks, add this check:
```javascript
async handleAddTask(e) {
    e.preventDefault();
    
    // Check subscription limits
    const canCreate = await window.app.subscription.checkLimit('create_task');
    if (!canCreate) {
        return; // Upgrade prompt will be shown automatically
    }
    
    // ... rest of task creation code ...
}
```

---

## 🧪 Testing

### **Test Mode (Stripe Test Keys)**
Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Any future date for expiry**
- **Any 3 digits for CVC**

### **Test Flow:**
1. ✅ Create account
2. ✅ Try to create 11th task (should prompt upgrade)
3. ✅ Click "Upgrade" → See pricing
4. ✅ Select Pro plan
5. ✅ Enter test card `4242 4242 4242 4242`
6. ✅ Complete checkout
7. ✅ Webhook should update subscription
8. ✅ Verify unlimited task creation

---

## 🚀 Going Live

### **Step 1: Switch to Live Keys**
1. Stripe Dashboard → Toggle to "Live Mode"
2. Get live API keys
3. Update `.env` with live keys
4. Restart backend

### **Step 2: Update Webhook**
1. Create live webhook endpoint
2. Update webhook secret in `.env`

### **Step 3: Enable Payment Methods**
1. Stripe Dashboard → Settings → Payment Methods
2. Enable: Credit Cards, Apple Pay, Google Pay

### **Step 4: Set up Tax Collection** (optional)
1. Stripe Dashboard → Settings → Tax
2. Enable Stripe Tax for automatic tax calculation

### **Step 5: Add Legal Pages**
- Terms of Service
- Privacy Policy
- Refund Policy

---

## 📊 Analytics & Monitoring

### **Stripe Dashboard Metrics:**
- Monthly Recurring Revenue (MRR)
- Churn rate
- Failed payments
- Customer lifetime value

### **Database Queries:**
```sql
-- Active subscriptions by plan
SELECT plan_id, COUNT(*) as count 
FROM user_subscriptions 
WHERE status = 'active' 
GROUP BY plan_id;

-- Revenue this month
SELECT SUM(amount) as revenue 
FROM payment_history 
WHERE status = 'succeeded' 
  AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH);
```

---

## 🛠️ Common Operations

### **Grant Trial Period:**
```sql
UPDATE user_subscriptions 
SET trial_end = DATE_ADD(NOW(), INTERVAL 14 DAY),
    status = 'trialing'
WHERE user_id = 'user_id_here';
```

### **Apply Coupon:**
Use Stripe Dashboard → Coupons → Create
Then apply during checkout.

### **Refund Payment:**
```javascript
await stripe.refunds.create({
  payment_intent: 'pi_xxxxx',
});
```

---

## 🔒 Security Checklist

- ✅ Never expose secret keys in frontend
- ✅ Validate webhooks with signature
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Log all subscription changes
- ✅ Monitor for suspicious activity
- ✅ Enable 2FA on Stripe account

---

## 📞 Support & Resources

- **Stripe Docs**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Stripe Discord**: https://discord.gg/stripe

---

## 🎉 Next Steps

1. ✅ Run database migration
2. ✅ Set up Stripe account
3. ✅ Install dependencies
4. ✅ Configure environment variables
5. ✅ Add frontend integration
6. ✅ Test with test cards
7. ✅ Go live!

**Need help?** Check the troubleshooting section or contact support.

