# N8tive.io Project Manager - Backend API

Backend API server for N8tive.io Project Manager with MySQL database, JWT authentication, and row-level security.

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up MySQL Database
```bash
# Start MySQL
mysql -u root -p

# Run the database schema
mysql -u root -p < database.sql

# Or copy and paste from database.sql into MySQL console
```

### 3. Configure Environment Variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and add your MySQL credentials
nano .env
```

Update these values:
```
DB_PASSWORD=your_mysql_password
JWT_SECRET=change-this-to-a-random-string
```

### 4. Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env.example          # Environment variables template
├── database.sql          # MySQL database schema
├── config/
│   └── database.js       # Database connection
├── middleware/
│   └── auth.js           # JWT authentication middleware
└── routes/
    ├── auth.js           # Authentication endpoints
    └── tasks.js          # Task CRUD endpoints
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Tasks (Requires Authentication)
- `GET /api/tasks` - Get all user tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/activity/log` - Get activity log

## 🔐 Authentication Flow

1. **Register**: `POST /api/auth/register`
   ```json
   {
     "name": "John Doe",
     "username": "johndoe",
     "password": "securepass123"
   }
   ```
   Returns JWT token

2. **Login**: `POST /api/auth/login`
   ```json
   {
     "username": "johndoe",
     "password": "securepass123"
   }
   ```
   Returns JWT token

3. **Use Token**: Add to requests
   ```
   Authorization: Bearer your-jwt-token-here
   ```

## 🛡️ Row-Level Security

All task operations automatically filter by `user_id`:
- Users can only see their own tasks
- Users can only modify/delete their own tasks
- Database foreign keys ensure data integrity

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | (required) |
| `DB_NAME` | Database name | n8tive_project_manager |
| `DB_PORT` | MySQL port | 3306 |
| `JWT_SECRET` | Secret for JWT tokens | (required) |
| `ALLOWED_ORIGINS` | CORS allowed origins | * |

## 🧪 Testing the API

### Using curl
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","username":"test","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Get tasks (use token from login)
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman or Thunder Client
1. Import the endpoints
2. Register a user
3. Login and copy the token
4. Add token to Authorization header for other requests

## 🚀 Deploy to AWS

See [AWS-DEPLOYMENT.md](../AWS-DEPLOYMENT.md) for complete AWS setup instructions.

## 📝 Notes

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Database connection uses connection pooling for performance
- All timestamps are stored in UTC
- File attachments stored as base64 in database (optional feature)

## 🐛 Troubleshooting

### Database Connection Failed
```
❌ Database connection failed: ECONNREFUSED
```
**Solution**: Make sure MySQL is running
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows
net start MySQL
```

### Access Denied Error
```
❌ ER_ACCESS_DENIED_ERROR
```
**Solution**: Check DB_USER and DB_PASSWORD in .env

### Database Not Found
```
❌ ER_BAD_DB_ERROR
```
**Solution**: Run database.sql to create the database

## 📚 Dependencies

- **express** - Web framework
- **mysql2** - MySQL client
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **express-validator** - Input validation

## 🔄 Development Tools

- **nodemon** - Auto-restart on file changes (dev only)

Install nodemon globally:
```bash
npm install -g nodemon
```

Then use:
```bash
npm run dev
```

## 🤖 Automated Deployment

This backend is configured with **GitHub Actions** for automatic deployment to AWS EC2.

Every push to `main` branch automatically:
1. Connects to EC2 via SSH
2. Pulls latest code
3. Installs dependencies
4. Restarts PM2 process

**No manual deployment needed!** 🚀

