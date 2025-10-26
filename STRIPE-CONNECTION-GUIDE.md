# 🔐 How to Connect Your Stripe Account
## N8tive.io Project Manager

---

## 📋 Quick Setup (5 minutes)

### **Step 1: Create/Login to Stripe**

1. Go to **[stripe.com](https://stripe.com)**
2. Click **"Sign up"** or **"Sign in"**
3. Complete the registration:
   - Email address
   - Full name  
   - Country (must match your bank)
   - Create password
4. **Verify your email** (check inbox)

---

### **Step 2: Get Your Test API Keys**

> ⚠️ **Important**: Start with TEST mode keys! Switch to live keys only when ready for production.

1. **Login to Stripe Dashboard**: [dashboard.stripe.com](https://dashboard.stripe.com)

2. **Enable Test Mode**:
   - Look at top-right corner
   - Toggle switch should say **"Test mode"** (blue/purple)
   - If it says "Live mode", click it to switch

3. **Navigate to API Keys**:
   - Left sidebar → **Developers**
   - Click **"API keys"**

4. **Copy Your Keys**:
   You'll see two keys:

   **Publishable key** (starts with `pk_test_`)
   ```
   pk_test_51JXxxx...xxxxx
   ```
   Click "Reveal test key" if hidden, then copy it.

   **Secret key** (starts with `sk_test_`)
   ```
   sk_test_51JXxxx...xxxxx
   ```
   Click "Reveal test key", then copy it.

---

### **Step 3: Add Keys to Your Backend**

#### **Option A: Using SSH (Recommended)**

```bash
# SSH into your EC2 instance
ssh -i ~/dev/n8tiveio-backend-key.pem ec2-user@54.158.1.37

# Navigate to backend directory
cd ~/Project-Manager/backend

# Edit .env file
nano .env

# Add these lines at the bottom:
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
FRONTEND_URL=http://54.158.1.37

# Save and exit: Ctrl+X, then Y, then Enter
```

#### **Option B: Using Cursor (Local Development)**

1. Open `/Users/jon/dev/Project Manager/backend/.env` in Cursor
2. Add these lines:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
FRONTEND_URL=http://54.158.1.37
```
3. Save the file
4. Deploy to AWS:
```bash
cd ~/dev/Project\ Manager/backend
scp -i ~/dev/n8tiveio-backend-key.pem .env ec2-user@54.158.1.37:~/Project-Manager/backend/.env
```

---

### **Step 4: Create Products in Stripe**

1. **Go to**: Dashboard → **Products** → **Add Product**

2. **Create Pro Plan**:
   - Name: `Pro Plan`
   - Description: `Unlimited tasks, 5 teams, advanced features`
   - Pricing model: **Recurring**
   - Price: `$9.99` USD
   - Billing period: **Monthly**
   - Click **Save product**
   - **Copy the Price ID** (starts with `price_`)

3. **Create Business Plan**:
   - Name: `Business Plan`
   - Price: `$29.99` USD
   - Click **Save product**
   - **Copy the Price ID**

4. **Create Enterprise Plan**:
   - Name: `Enterprise Plan`
   - Price: `$99.99` USD
   - Click **Save product**
   - **Copy the Price ID**

---

### **Step 5: Update Database with Price IDs**

```bash
# SSH into your EC2
ssh -i ~/dev/n8tiveio-backend-key.pem ec2-user@54.158.1.37

# Connect to MySQL
mysql -u admin -p -h n8tiveio-project-manager-db.cc7cwc2em3sj.us-east-1.rds.amazonaws.com n8tiveio-project-manager-db

# Update with your Stripe Price IDs
UPDATE subscription_plans 
SET stripe_price_id_monthly = 'price_YOUR_PRO_PRICE_ID_HERE' 
WHERE id = 'pro';

UPDATE subscription_plans 
SET stripe_price_id_monthly = 'price_YOUR_BUSINESS_PRICE_ID_HERE' 
WHERE id = 'business';

UPDATE subscription_plans 
SET stripe_price_id_monthly = 'price_YOUR_ENTERPRISE_PRICE_ID_HERE' 
WHERE id = 'enterprise';

# Exit MySQL
EXIT;
```

---

### **Step 6: Set Up Webhook**

Webhooks allow Stripe to notify your app about payment events.

1. **Go to**: Dashboard → **Developers** → **Webhooks**

2. **Click**: **Add endpoint**

3. **Enter Endpoint URL**:
   ```
   http://54.158.1.37/api/subscriptions/webhook
   ```
   
   (Or use your custom domain if you have one)

4. **Select Events to Listen to**:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `checkout.session.completed`

5. **Click**: **Add endpoint**

6. **Copy Webhook Secret**:
   - After creating, click on the webhook
   - Click **"Reveal"** under "Signing secret"
   - Copy the secret (starts with `whsec_`)
   - Add it to your `.env` file:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

### **Step 7: Install Stripe in Backend**

```bash
# SSH into EC2
ssh -i ~/dev/n8tiveio-backend-key.pem ec2-user@54.158.1.37

# Navigate to backend
cd ~/Project-Manager/backend

# Install Stripe
npm install stripe

# Restart backend
pm2 restart n8tive-backend

# Check logs
pm2 logs n8tive-backend
```

---

### **Step 8: Enable Stripe in Code**

#### **Edit subscriptions.js**:

```bash
# On EC2
cd ~/Project-Manager/backend/routes
nano subscriptions.js
```

**Uncomment these lines**:

**Line 6** - Stripe initialization:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

**Lines 75-88** - Checkout session:
```javascript
const session = await stripe.checkout.sessions.create({
    customer: req.user.stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [{
        price: billingCycle === 'yearly' ? priceIdYearly : priceIdMonthly,
        quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
});
```

**Lines 100-105** - Customer portal:
```javascript
const session = await stripe.billingPortal.sessions.create({
    customer: req.user.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/subscription`,
});
```

**Lines 153-183** - Webhook handling:
```javascript
const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

// Handle events...
```

Save and restart:
```bash
# Ctrl+X, Y, Enter
pm2 restart n8tive-backend
```

---

### **Step 9: Test with Test Cards**

Use these test card numbers in **Test Mode**:

| Card Number | Result |
|------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0025 0000 3155` | 🔐 Requires 3D Secure |

- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

---

## ✅ Verification Checklist

Test each step:

- [ ] Created Stripe account
- [ ] Copied test API keys
- [ ] Added keys to `.env` file
- [ ] Created products in Stripe
- [ ] Updated database with price IDs
- [ ] Set up webhook endpoint
- [ ] Installed Stripe npm package
- [ ] Uncommented Stripe code
- [ ] Restarted backend
- [ ] Tested with test card `4242 4242 4242 4242`
- [ ] Webhook received events (check Stripe Dashboard → Webhooks)

---

## 🐛 Troubleshooting

### **"Invalid API Key" Error**
- ✅ Check you're using **Test** keys in test mode
- ✅ Keys should start with `sk_test_` and `pk_test_`
- ✅ No extra spaces in `.env` file
- ✅ Restart backend after adding keys

### **"Product not found"**
- ✅ Verify price IDs in database match Stripe
- ✅ Check you're in Test Mode in both Stripe and app
- ✅ Run the UPDATE queries again

### **Webhook Not Working**
- ✅ Endpoint URL is correct
- ✅ Webhook secret is in `.env`
- ✅ Backend is running (`pm2 status`)
- ✅ Port 80 is open on EC2 security group
- ✅ Check webhook logs in Stripe Dashboard

### **Can't Connect to Database**
```bash
# Test connection
mysql -u admin -p -h n8tiveio-project-manager-db.cc7cwc2em3sj.us-east-1.rds.amazonaws.com

# If fails, check:
# - RDS security group allows EC2 IP
# - Database password is correct
# - RDS is in same VPC as EC2
```

---

## 🚀 Going Live (Production)

When you're ready for real payments:

1. **Complete Stripe Verification**:
   - Dashboard → Settings → Account details
   - Provide business information
   - Add bank account for payouts

2. **Switch to Live Mode**:
   - Toggle "Test mode" OFF (top right)
   - Get new live keys (start with `sk_live_` and `pk_live_`)

3. **Update `.env` with Live Keys**:
   ```env
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
   STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   ```

4. **Create Live Webhook**:
   - Create new webhook for live mode
   - Update `STRIPE_WEBHOOK_SECRET` with live secret

5. **Restart Backend**:
   ```bash
   pm2 restart n8tive-backend
   ```

6. **Test with Real Card** (small amount)

---

## 📞 Need Help?

- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Discord**: [discord.gg/stripe](https://discord.gg/stripe)

---

## 💡 Quick Reference

### **Your Stripe Dashboard URLs**:
- Main Dashboard: https://dashboard.stripe.com
- API Keys: https://dashboard.stripe.com/test/apikeys
- Products: https://dashboard.stripe.com/test/products
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Payments: https://dashboard.stripe.com/test/payments
- Customers: https://dashboard.stripe.com/test/customers

### **Test Card Reference**:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
```

---

**You're all set!** 🎉

Your Stripe account is now connected to N8tive.io Project Manager!

