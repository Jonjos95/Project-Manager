# Authentication Migration Guide

## ⚠️ IMPORTANT: Authentication Now Uses Cloud Database

Authentication has been **migrated from localStorage to MySQL database** via backend API.

---

## 🔄 What Changed

### Before (localStorage):
- ❌ Users stored in browser localStorage
- ❌ Passwords hashed client-side (weak security)
- ❌ No email field
- ❌ Data lost when clearing browser
- ❌ No centralized user management

### After (Cloud Database):
- ✅ Users stored in **MySQL database** (RDS)
- ✅ Passwords hashed with **bcrypt** (server-side)
- ✅ **Email required** for registration
- ✅ Persistent data across devices
- ✅ Proper authentication with **JWT tokens**
- ✅ Support for **username OR email** login

---

## 📋 Required Steps

### 1. Update Your Database Schema

#### **Option A: Fresh Install** (New Database)
```bash
# SSH into EC2
ssh -i n8tiveio-backend-key.pem ec2-user@54.158.1.37

# Connect to MySQL
mysql -h YOUR_RDS_ENDPOINT -u admin -p

# Run the updated schema
mysql -h YOUR_RDS_ENDPOINT -u admin -p < backend/database.sql
```

#### **Option B: Migrate Existing Database** (Already has users)
```bash
# SSH into EC2
ssh -i n8tiveio-backend-key.pem ec2-user@54.158.1.37

# Run migration script
mysql -h YOUR_RDS_ENDPOINT -u admin -p < backend/migrate-add-email.sql
```

This will:
- Add `email` column to `users` table
- Add index on `email`
- Set placeholder emails for existing users (username@example.com)

### 2. Update Existing Users' Emails

If you have existing users, update their emails manually:

```sql
USE n8tive_project_manager;

-- View current users
SELECT id, username, email, name FROM users;

-- Update specific user's email
UPDATE users 
SET email = 'real@email.com' 
WHERE username = 'username';
```

### 3. Restart Backend (if running)

```bash
# On EC2
pm2 restart n8tive-backend

# Check logs
pm2 logs n8tive-backend
```

### 4. Clear Old localStorage Data (Users Need To)

Users need to **re-register** as localStorage auth is incompatible:

```javascript
// Users can run this in browser console to clear old data:
localStorage.clear();
location.reload();
```

---

## 📝 New Database Schema

### Users Table (Updated)
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,      -- NEW!
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)                  -- NEW!
);
```

---

## 🔐 New Authentication Flow

### Registration
```
1. User fills form (name, email, username, password)
2. Frontend sends POST to /api/auth/register
3. Backend validates email format
4. Backend checks username/email uniqueness
5. Backend hashes password (bcrypt)
6. Backend stores user in MySQL
7. Backend returns JWT token
8. Frontend stores token in localStorage
9. User logged in automatically
```

### Login (Username or Email)
```
1. User enters username/email + password
2. Frontend sends POST to /api/auth/login
3. Backend finds user by username OR email
4. Backend verifies password (bcrypt.compare)
5. Backend returns JWT token
6. Frontend stores token
7. User logged in
```

### Session Persistence
```
1. Frontend checks localStorage for token on load
2. Frontend sends GET to /api/auth/verify with token
3. Backend validates JWT
4. If valid: user data returned
5. If invalid: logout and show login screen
```

---

## 🚀 API Endpoints

### POST `/api/auth/register`
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### POST `/api/auth/login`
**Request:**
```json
{
  "username": "johndoe",  // or "john@example.com"
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### GET `/api/auth/verify`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_1234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

---

## 🔧 Testing

### 1. Test Registration
```bash
curl -X POST http://54.158.1.37:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "username": "testuser",
    "password": "test123456"
  }'
```

### 2. Test Login (with username)
```bash
curl -X POST http://54.158.1.37:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123456"
  }'
```

### 3. Test Login (with email)
```bash
curl -X POST http://54.158.1.37:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "test123456"
  }'
```

### 4. Test Token Verification
```bash
# Save token from login response
TOKEN="your_jwt_token_here"

curl -X GET http://54.158.1.37:3000/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 Frontend Changes

### Files Modified:
1. **`components/auth-api.js`** (NEW) - Cloud-based authentication
2. **`backend/routes/auth.js`** - Added email validation
3. **`backend/database.sql`** - Added email field
4. **`index.html`** - Added email field to registration form
5. **`index.html`** - Updated login label to "Username or Email"

### Old File:
- **`components/auth.js`** - localStorage-based (deprecated)

---

## 🔒 Security Improvements

| Feature | Before (localStorage) | After (Database) |
|---------|----------------------|------------------|
| Password Storage | Client-side hash | bcrypt (10 rounds) |
| Token Type | None | JWT (7-day expiry) |
| Email Validation | None | Server-side validation |
| Session Management | localStorage only | Token verification |
| Cross-device | ❌ No | ✅ Yes |
| Centralized Control | ❌ No | ✅ Yes |
| Password Recovery | ❌ Impossible | ✅ Possible (future) |

---

## ⚠️ Breaking Changes

1. **Users must re-register**
   - Old localStorage data is incompatible
   - Cannot migrate localStorage users to database

2. **Backend must be running**
   - Frontend requires active backend API
   - No offline mode for auth

3. **Email is required**
   - Registration form now requires email
   - Email must be unique

---

## 🐛 Troubleshooting

### "Registration failed" / "Login failed"
- Check backend is running: `pm2 status`
- Check backend logs: `pm2 logs n8tive-backend`
- Verify database connection in backend/.env

### "Network error"
- Check API_URL in config.js
- Verify backend is accessible
- Check browser console for CORS errors

### "Email already taken"
- Email must be unique in database
- Use different email or login with existing account

### "Invalid credentials"
- Check username/email spelling
- Check password is correct
- Try password reset (if implemented)

---

## 📞 Support

For issues:
1. Check backend logs: `pm2 logs n8tive-backend`
2. Check MySQL: `mysql -h HOST -u admin -p`
3. Verify schema: `DESCRIBE users;`
4. Check API endpoints with curl

---

**Authentication is now production-ready with proper security!** 🔒🎉

