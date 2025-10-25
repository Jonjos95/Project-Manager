-- Migration Script: Add Email Column to Users Table
-- Run this if you have an existing database without the email column
-- Date: 2025-10-25

USE n8tive_project_manager;

-- Check if email column exists (this will fail if it doesn't, which is fine)
-- SELECT email FROM users LIMIT 1;

-- Add email column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE AFTER username;

-- Add index on email
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_email (email);

-- For existing users without email, set a placeholder
-- You should update these with real emails manually
UPDATE users 
SET email = CONCAT(username, '@example.com')
WHERE email IS NULL OR email = '';

-- Verify the changes
SELECT id, username, email, name, created_at FROM users;

-- Show updated table structure
DESCRIBE users;

