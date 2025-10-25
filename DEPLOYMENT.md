# Deployment Guide

## Overview

This application uses GitHub Actions for automated deployment to AWS infrastructure.

---

## Prerequisites

1. **AWS Account**
   - EC2 instance (t2.micro or larger)
   - RDS MySQL database
   - Security Groups configured

2. **GitHub Repository**
   - Forked or cloned this repository
   - Admin access to configure secrets

3. **Local Development**
   - Node.js 18+ installed
   - MySQL (for local development)
   - Git configured

---

## Initial Setup

### 1. Configure GitHub Secrets

Go to: **Repository Settings → Secrets and variables → Actions**

Add the following secrets (see SECURITY.md for details):
- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_SSH_KEY`

### 2. Server Setup

SSH into your EC2 instance and run:

```bash
# Install dependencies
sudo yum update -y
sudo yum install -y git nodejs nginx mysql

# Install PM2 globally
sudo npm install -g pm2

# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/Project-Manager.git
cd Project-Manager

# Setup backend
cd backend
npm install
cp env.template .env
nano .env  # Fill in your database credentials

# Setup Nginx
cd ..
chmod +x setup-nginx.sh
./setup-nginx.sh

# Start backend with PM2
cd backend
pm2 start server.js --name n8tive-backend
pm2 save
pm2 startup  # Follow the instructions

# Deploy frontend
cd ..
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

### 3. Database Setup

Connect to your RDS instance:

```bash
mysql -h YOUR_RDS_ENDPOINT -u admin -p
```

Run the database schema:

```sql
SOURCE database.sql;
```

---

## Deployment Workflow

### Automatic Deployment

Every push to `main` branch triggers automatic deployment:

```bash
git add -A
git commit -m "Your changes"
git push origin main
```

GitHub Actions will:
1. Connect to EC2 via SSH
2. Pull latest code
3. Install dependencies
4. Restart backend (PM2)
5. Deploy frontend (Nginx)

### Manual Deployment

If you need to deploy manually:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_HOST

# Update code
cd ~/Project-Manager
git pull origin main

# Update backend
cd backend
npm install
pm2 restart n8tive-backend

# Update frontend
cd ..
./deploy-frontend.sh
```

---

## Monitoring

### Check Application Status

```bash
# Backend status
pm2 status
pm2 logs n8tive-backend

# Nginx status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Database connection
mysql -h YOUR_RDS_ENDPOINT -u admin -p -e "SHOW DATABASES;"
```

### Health Checks

```bash
# Backend API
curl http://YOUR_HOST/api/health

# Frontend
curl http://YOUR_HOST/
```

---

## Troubleshooting

### Backend Not Running

```bash
pm2 logs n8tive-backend  # Check logs
pm2 restart n8tive-backend  # Restart
```

### Frontend Not Loading

```bash
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

### Database Connection Failed

- Check RDS security group allows EC2
- Verify credentials in `backend/.env`
- Ensure RDS is running

---

## Rollback

If deployment fails, revert to previous version:

```bash
# On EC2
cd ~/Project-Manager
git log --oneline  # Find previous commit hash
git reset --hard COMMIT_HASH
pm2 restart n8tive-backend
./deploy-frontend.sh
```

---

## Scaling

### Horizontal Scaling (Multiple EC2 Instances)

1. Set up load balancer (ALB)
2. Deploy application to multiple EC2 instances
3. Configure RDS for multiple connections
4. Use shared session storage (Redis)

### Vertical Scaling (Larger Instance)

1. Stop application
2. Resize EC2 instance type
3. Start application

---

## Maintenance

### Database Backups

RDS automatic backups are enabled by default (7-day retention).

Manual backup:
```bash
# On local machine
mysqldump -h YOUR_RDS_ENDPOINT -u admin -p DATABASE_NAME > backup.sql
```

### SSL/HTTPS Setup

Use Let's Encrypt for free SSL:

```bash
# On EC2
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Updates

```bash
# Update system packages
sudo yum update -y

# Update Node.js dependencies
cd ~/Project-Manager/backend
npm audit fix
npm update
```

---

## Cost Optimization

- Use AWS Free Tier (t2.micro, db.t3.micro)
- Stop instances when not in use (development)
- Monitor data transfer limits
- Use RDS snapshots instead of continuous backups
- Consider Reserved Instances for production

---

## Support

For security issues, see `SECURITY.md`.

For development setup, see `README.md` and `backend/README.md`.

---

**Happy Deploying!** 🚀

