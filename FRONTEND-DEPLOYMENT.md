# Frontend Deployment on AWS EC2

This guide covers hosting the N8tive.io Project Manager frontend on the same EC2 instance as the backend using Nginx.

## Architecture

```
┌─────────────────────────────────────────┐
│         AWS EC2 Instance                │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Nginx (Port 80)               │    │
│  │  - Serves frontend files       │    │
│  │  - Proxies /api to backend     │    │
│  └────────────────────────────────┘    │
│              ↓                          │
│  ┌────────────────────────────────┐    │
│  │  Node.js Backend (Port 3000)   │    │
│  │  - API endpoints               │    │
│  │  - MySQL connection            │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## One-Time Setup (Already Done? Skip to Testing)

### 1. SSH into EC2

```bash
ssh -i n8tiveio-backend-key.pem ec2-user@54.158.1.37
cd ~/Project-Manager
```

### 2. Run Initial Nginx Setup

```bash
chmod +x setup-nginx.sh
./setup-nginx.sh
```

This installs Nginx, creates directories, and configures permissions.

### 3. Configure EC2 Security Group

In AWS Console:
1. Go to EC2 → Security Groups
2. Select your instance's security group
3. Add Inbound Rule:
   - **Type:** HTTP
   - **Port:** 80
   - **Source:** 0.0.0.0/0 (or your IP)

### 4. Deploy Frontend

```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

### 5. Test

Visit: **http://54.158.1.37**

---

## Automated Deployment

### GitHub Actions Workflow

Every `git push origin main` automatically:
1. Pulls latest code on EC2
2. Updates backend (npm install + PM2 restart)
3. Deploys frontend (copies files + reloads Nginx)

**Workflow file:** `.github/workflows/deploy.yml`

---

## Development Workflow

### Option 1: Code in Cursor → Push → Auto-Deploy

```bash
# Make changes in Cursor
git add -A
git commit -m "Your changes"
git push origin main

# Wait 30-60 seconds for auto-deployment
# Changes live at: http://54.158.1.37
```

### Option 2: Test Locally First

```bash
# Open index.html locally (uses AWS backend)
open index.html

# Or run local dev server
python3 -m http.server 8080
# Visit: http://localhost:8080
```

---

## File Structure

```
/var/www/html/Project-Manager/
├── index.html           # Main app
├── script.js            # App logic
├── style.css            # Styles
├── config.js            # API configuration
├── components/          # UI components
│   ├── navbar.js
│   ├── sidebar-item.js
│   ├── project-visualization.js
│   ├── dark-mode-toggle.js
│   └── footer.js
└── README.md
```

---

## API Configuration (config.js)

The app automatically detects environment:

| Environment | URL | API Used |
|-------------|-----|----------|
| **AWS Hosted** | `http://54.158.1.37` | `/api` (relative path) |
| **File Protocol** | `file:///...` | `http://54.158.1.37/api` |
| **Localhost** | `http://localhost:8080` | `http://localhost:3000/api` |

---

## Nginx Configuration

**Location:** `/etc/nginx/conf.d/n8tive-project-manager.conf`

- **Port 80** - Frontend files
- **Proxies** `/api` → `localhost:3000` (Node.js backend)
- **Gzip** compression enabled
- **Try files** for SPA routing

---

## Troubleshooting

### Frontend Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### API Requests Failing

```bash
# Check backend is running
pm2 status

# Check backend logs
pm2 logs n8tive-backend

# Restart backend
pm2 restart n8tive-backend
```

### Permission Denied Errors

```bash
# Fix file permissions
sudo chown -R nginx:nginx /var/www/html/Project-Manager
sudo chmod -R 755 /var/www/html/Project-Manager

# Fix SELinux (if enabled)
sudo setsebool -P httpd_can_network_connect 1
sudo chcon -Rt httpd_sys_content_t /var/www/html/Project-Manager
```

### Changes Not Showing

```bash
# Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or clear Nginx cache
sudo systemctl reload nginx
```

---

## Manual Deployment

If you need to deploy manually (without GitHub Actions):

```bash
# SSH into EC2
ssh -i n8tiveio-backend-key.pem ec2-user@54.158.1.37

# Pull latest code
cd ~/Project-Manager
git pull origin main

# Deploy
./deploy-frontend.sh
```

---

## URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://54.158.1.37 |
| **Backend API** | http://54.158.1.37/api |
| **Health Check** | http://54.158.1.37/health |
| **API Info** | http://54.158.1.37/api/auth/verify |

---

## Next Steps

### Optional Enhancements

1. **Custom Domain**
   - Register domain (e.g., n8tive.io)
   - Point DNS to EC2 IP
   - Update Nginx `server_name`

2. **SSL/HTTPS**
   - Install Certbot
   - Get free SSL cert from Let's Encrypt
   - Auto-redirect HTTP → HTTPS

3. **CloudFront CDN**
   - Add CloudFront in front of EC2
   - Cache static files globally
   - Reduce load on EC2

---

## Security Notes

- ✅ Frontend served over HTTP (upgrade to HTTPS recommended)
- ✅ Backend API protected with JWT authentication
- ✅ RDS database behind security group (not public)
- ✅ Row-level security in database
- ⚠️ EC2 SSH port 22 open (restrict to your IP)
- ⚠️ HTTP port 80 open to world (required for web access)

---

**Your frontend is now on AWS with automatic GitHub deployments!** 🚀

