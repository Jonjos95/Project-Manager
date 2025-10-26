// Subscription Management Routes
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Stripe integration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get all available subscription plans
router.get('/plans', async (req, res) => {
    try {
        const [plans] = await db.query(
            'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly ASC'
        );
        
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// Get current user's subscription
router.get('/my-subscription', authenticateToken, async (req, res) => {
    try {
        const [subscriptions] = await db.query(`
            SELECT 
                us.*,
                sp.name as plan_name,
                sp.description as plan_description,
                sp.price_monthly,
                sp.price_yearly,
                sp.features,
                sp.limits_json
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = ?
            ORDER BY us.created_at DESC
            LIMIT 1
        `, [req.user.id]);
        
        if (subscriptions.length === 0) {
            // Create default free subscription
            await db.query(
                'INSERT INTO user_subscriptions (user_id, plan_id, status) VALUES (?, ?, ?)',
                [req.user.id, 'free', 'active']
            );
            
            const [newSub] = await db.query(`
                SELECT 
                    us.*,
                    sp.name as plan_name,
                    sp.description as plan_description,
                    sp.price_monthly,
                    sp.price_yearly,
                    sp.features,
                    sp.limits_json
                FROM user_subscriptions us
                JOIN subscription_plans sp ON us.plan_id = sp.id
                WHERE us.user_id = ?
            `, [req.user.id]);
            
            return res.json(newSub[0]);
        }
        
        res.json(subscriptions[0]);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

// Check if user can perform action (usage limits)
router.post('/check-limit', authenticateToken, async (req, res) => {
    try {
        const { action } = req.body; // 'create_task', 'create_team', etc.
        
        // Get user's current plan limits
        const [subscription] = await db.query(`
            SELECT sp.limits_json
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = ? AND us.status = 'active'
            ORDER BY us.created_at DESC
            LIMIT 1
        `, [req.user.id]);
        
        if (subscription.length === 0) {
            return res.json({ allowed: false, reason: 'No active subscription' });
        }
        
        const limits = JSON.parse(subscription[0].limits_json);
        
        // Check specific limits based on action
        let allowed = true;
        let reason = '';
        
        if (action === 'create_task') {
            if (limits.tasks !== -1) {
                const [taskCount] = await db.query(
                    'SELECT COUNT(*) as count FROM tasks WHERE user_id = ?',
                    [req.user.id]
                );
                if (taskCount[0].count >= limits.tasks) {
                    allowed = false;
                    reason = `You've reached your limit of ${limits.tasks} tasks. Upgrade to create more.`;
                }
            }
        } else if (action === 'create_team') {
            if (limits.teams !== -1) {
                const [teamCount] = await db.query(
                    'SELECT COUNT(*) as count FROM teams WHERE owner_id = ?',
                    [req.user.id]
                );
                if (teamCount[0].count >= limits.teams) {
                    allowed = false;
                    reason = `You've reached your limit of ${limits.teams} teams. Upgrade to create more.`;
                }
            }
        }
        
        res.json({ allowed, reason, limits });
    } catch (error) {
        console.error('Error checking limits:', error);
        res.status(500).json({ error: 'Failed to check limits' });
    }
});

// Create Stripe Checkout Session (for upgrading/subscribing)
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
    try {
        const { planId, billingCycle } = req.body;
        
        // TODO: Implement Stripe checkout
        // const session = await stripe.checkout.sessions.create({
        //     customer: req.user.stripeCustomerId,
        //     payment_method_types: ['card'],
        //     line_items: [{
        //         price: billingCycle === 'yearly' ? priceIdYearly : priceIdMonthly,
        //         quantity: 1,
        //     }],
        //     mode: 'subscription',
        //     success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        //     cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        // });
        
        res.json({ 
            message: 'Stripe integration pending',
            planId,
            billingCycle,
            // sessionId: session.id 
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Create Stripe Customer Portal Session (for managing subscription)
router.post('/create-portal-session', authenticateToken, async (req, res) => {
    try {
        // TODO: Implement Stripe customer portal
        // const session = await stripe.billingPortal.sessions.create({
        //     customer: req.user.stripeCustomerId,
        //     return_url: `${process.env.FRONTEND_URL}/subscription`,
        // });
        
        res.json({ 
            message: 'Stripe portal integration pending',
            // url: session.url 
        });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
    try {
        const { immediately } = req.body;
        
        await db.query(`
            UPDATE user_subscriptions
            SET cancel_at_period_end = ?, status = ?
            WHERE user_id = ? AND status = 'active'
        `, [!immediately, immediately ? 'canceled' : 'active', req.user.id]);
        
        res.json({ 
            success: true,
            message: immediately ? 'Subscription canceled immediately' : 'Subscription will cancel at period end'
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Get payment history
router.get('/payment-history', authenticateToken, async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT * FROM payment_history
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [req.user.id]);
        
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// Stripe Webhooks (for handling payment events)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        // TODO: Verify and handle Stripe webhooks
        // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        
        // Handle different event types
        // switch (event.type) {
        //     case 'customer.subscription.created':
        //     case 'customer.subscription.updated':
        //         // Update subscription in database
        //         break;
        //     case 'customer.subscription.deleted':
        //         // Cancel subscription in database
        //         break;
        //     case 'invoice.payment_succeeded':
        //         // Record payment
        //         break;
        //     case 'invoice.payment_failed':
        //         // Handle failed payment
        //         break;
        // }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook verification failed' });
    }
});

module.exports = router;

