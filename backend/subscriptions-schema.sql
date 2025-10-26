-- Subscription Plans Schema for N8tive.io Project Manager
-- Run this after your existing database.sql

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    stripe_price_id_monthly VARCHAR(100),
    stripe_price_id_yearly VARCHAR(100),
    features JSON,
    limits_json JSON, -- { "tasks": 100, "teams": 5, "storage_mb": 1000 }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, limits_json) VALUES
('free', 'Free', 'Perfect for individuals getting started', 0.00, 0.00, 
    '["Up to 10 tasks", "1 team", "Basic analytics", "Email support"]',
    '{"tasks": 10, "teams": 1, "storage_mb": 100, "team_members": 3}'),
('pro', 'Pro', 'For professionals and small teams', 9.99, 99.99,
    '["Unlimited tasks", "5 teams", "Advanced analytics", "Priority support", "Custom workflows", "File attachments (1GB)"]',
    '{"tasks": -1, "teams": 5, "storage_mb": 1000, "team_members": 10}'),
('business', 'Business', 'For growing businesses', 29.99, 299.99,
    '["Everything in Pro", "Unlimited teams", "Advanced reporting", "API access", "24/7 support", "SSO", "File attachments (10GB)"]',
    '{"tasks": -1, "teams": -1, "storage_mb": 10000, "team_members": 50}'),
('enterprise', 'Enterprise', 'For large organizations', 99.99, 999.99,
    '["Everything in Business", "Unlimited everything", "Dedicated support", "Custom integrations", "SLA guarantee", "Unlimited storage"]',
    '{"tasks": -1, "teams": -1, "storage_mb": -1, "team_members": -1}');

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    status ENUM('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid') DEFAULT 'active',
    billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
    current_period_start TIMESTAMP NULL,
    current_period_end TIMESTAMP NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    trial_end TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    INDEX idx_user_id (user_id),
    INDEX idx_stripe_customer_id (stripe_customer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment History Table
CREATE TABLE IF NOT EXISTS payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    subscription_id INT,
    stripe_payment_intent_id VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('succeeded', 'pending', 'failed', 'refunded') DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usage Tracking Table (for metering/limits)
CREATE TABLE IF NOT EXISTS usage_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    metric VARCHAR(50) NOT NULL, -- 'tasks', 'teams', 'storage_mb', 'api_calls'
    count INT DEFAULT 0,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_metric (user_id, metric),
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add subscription column to users table if not exists
-- Note: This will fail if column already exists, but that's okay
ALTER TABLE users 
ADD COLUMN current_plan_id VARCHAR(50) DEFAULT 'free';

-- Add foreign key separately
ALTER TABLE users 
ADD CONSTRAINT fk_user_plan 
FOREIGN KEY (current_plan_id) REFERENCES subscription_plans(id);

-- Create default subscription for existing users
INSERT INTO user_subscriptions (user_id, plan_id, status)
SELECT id, 'free', 'active' FROM users 
WHERE id NOT IN (SELECT user_id FROM user_subscriptions);

