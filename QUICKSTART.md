# 🚀 Quick Start Guide

Get N8tive.io Project Manager running in 5 minutes!

## 📋 Prerequisites

- **Node.js** 14+ ([Download](https://nodejs.org/))
- **MySQL** 5.7+ or 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Download](https://git-scm.com/downloads))

Check if installed:
```bash
node --version
npm --version
mysql --version
```

---

## ⚡ Option 1: Localhost Development (Recommended First)

### Step 1: Start MySQL

```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows
net start MySQL
```

### Step 2: Create Database

```bash
# Login to MySQL
mysql -u root -p

# Run these commands:
CREATE DATABASE n8tive_project_manager;
exit;

# OR run the full schema:
mysql -u root -p < backend/database.sql
```

### Step 3: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp env.template .env

# Edit .env and update these values:
# - DB_PASSWORD=your_mysql_password
# - JWT_SECRET=generate-a-random-string
nano .env  # or use your favorite editor

# Generate JWT secret (optional):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Start backend server
npm start

# Server should start on http://localhost:3000
```

Keep this terminal open!

### Step 4: Test Backend API

Open a new terminal:

```bash
# Test API is working
curl http://localhost:3000

# Should return:
# {"success":true,"message":"N8tive.io Project Manager API"...}
```

### Step 5: Update Frontend

The frontend is already configured to work with localhost by default!

Just open `index.html` in your browser or use a local server:

```bash
# Option A: Python
python3 -m http.server 8080

# Option B: Node.js (http-server)
npx http-server -p 8080

# Option C: PHP
php -S localhost:8080

# Option D: VS Code - Install "Live Server" extension and click "Go Live"
```

Open browser: `http://localhost:8080`

### Step 6: Create Account & Login

1. Open the app in your browser
2. Click "Create one" on the login screen
3. Register with your details
4. Start managing tasks!

---

## ☁️ Option 2: AWS Free Tier Deployment

See [AWS-DEPLOYMENT.md](AWS-DEPLOYMENT.md) for complete AWS setup guide.

**AWS Services Used:**
- ✅ RDS (MySQL) - Free tier: 750 hours/month
- ✅ EC2 (Backend) - Free tier: 750 hours/month
- ✅ S3 (Frontend) - Free tier: 5GB storage
- ✅ CloudFront (CDN) - Free tier: 50GB transfer

**Cost**: ~$0-5/month for first 12 months!

---

## 📁 Project Structure

```
Project Manager/
├── index.html              # Main HTML file
├── script.js               # Frontend JavaScript
├── style.css               # Styles
├── components/             # UI components
├── backend/                # Backend API
│   ├── server.js          # Main server
│   ├── package.json       # Dependencies
│   ├── database.sql       # MySQL schema
│   ├── config/            # Configuration
│   ├── routes/            # API endpoints
│   └── middleware/        # Auth middleware
├── AWS-DEPLOYMENT.md      # AWS deployment guide
└── README.md              # Documentation
```

---

## 🔧 Configuration

### Backend (.env)
```env
PORT=3000                              # API server port
DB_HOST=localhost                      # MySQL host
DB_USER=root                           # MySQL username
DB_PASSWORD=your_password              # MySQL password
DB_NAME=n8tive_project_manager        # Database name
JWT_SECRET=your_random_secret         # JWT secret key
ALLOWED_ORIGINS=http://localhost:8080  # Frontend URL
```

### Frontend (config.js) - Coming Next
Will be added to switch between localhost and AWS.

---

## 🧪 Test the API

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","username":"testuser","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

Copy the `token` from the response!

### Get Tasks
```bash
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"My First Task","description":"Test task","priority":"high","status":"todo"}'
```

---

## 🐛 Troubleshooting

### Backend won't start

**Error: "Database connection failed"**
```bash
# Check MySQL is running
# macOS:
brew services list

# Start MySQL:
brew services start mysql

# Check credentials in .env
```

**Error: "Cannot find module"**
```bash
cd backend
npm install
```

### Frontend CORS error

Update `ALLOWED_ORIGINS` in backend/.env to include your frontend URL:
```env
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

Then restart backend:
```bash
cd backend
npm start
```

### MySQL access denied

```bash
# Reset MySQL password or update .env with correct password
mysql -u root -p
# Enter current password

# Or update .env:
DB_PASSWORD=your_correct_password
```

---

## 📊 Development Tools

### Recommended VS Code Extensions
- **Live Server** - Quick frontend dev server
- **REST Client** or **Thunder Client** - Test API endpoints
- **MySQL** - Database management
- **ESLint** - Code linting

### Recommended Tools
- **Postman** - API testing
- **MySQL Workbench** - Database GUI
- **TablePlus** - Modern database client

---

## 🎯 Next Steps

1. ✅ Complete local setup
2. ✅ Test all features (login, tasks, etc.)
3. ✅ Review AWS deployment guide
4. ✅ Deploy to AWS Free Tier
5. ✅ Add custom domain
6. ✅ Enable HTTPS

---

## 📚 Additional Resources

- [Backend API Documentation](backend/README.md)
- [AWS Deployment Guide](AWS-DEPLOYMENT.md)
- [Main README](README.md)

---

## 💡 Tips

1. **Development**: Use `npm run dev` in backend for auto-restart on changes
2. **Production**: Use PM2 to keep server running
3. **Security**: Never commit `.env` files to git
4. **Testing**: Test on localhost before deploying to AWS
5. **Monitoring**: Set up CloudWatch on AWS for logs

---

## 🎉 Success!

If you can:
- ✅ Start the backend server
- ✅ Open the frontend in browser
- ✅ Create an account
- ✅ Add tasks

**You're all set!** 🚀

Next: Deploy to AWS and share with the world!

---

## 📞 Need Help?

- Check [backend/README.md](backend/README.md) for detailed API docs
- Check [AWS-DEPLOYMENT.md](AWS-DEPLOYMENT.md) for AWS help
- Review error messages in terminal
- Check browser console for frontend errors

**Happy coding!** 🎊

