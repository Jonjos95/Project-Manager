-- Migration Script: Add Email Column to Users Table (Fixed)
-- Run this if you have an existing database without the email column

USE n8tive_project_manager;

-- Add email column (will fail if it already exists, which is fine)
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE AFTER username;

-- Add index on email
ALTER TABLE users ADD INDEX idx_email (email);

-- For existing users without email, set a placeholder
UPDATE users 
SET email = CONCAT(username, '@example.com')
WHERE email IS NULL OR email = '';

-- Verify the changes
SELECT id, username, email, name, created_at FROM users;

-- Show updated table structure
DESCRIBE users;

