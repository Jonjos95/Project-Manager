# AWS Free Tier Deployment Guide

Complete step-by-step guide to deploy N8tive.io Project Manager on AWS Free Tier.

## 📋 What You'll Set Up

- **AWS RDS (MySQL)** - Managed database
- **AWS EC2** - Backend API server
- **AWS S3 + CloudFront** - Frontend hosting with CDN
- **Total Cost**: ~$0-5/month (Free Tier for 12 months)

## 🎯 Prerequisites

- AWS Account (sign up at aws.amazon.com)
- Credit card (required for AWS, won't be charged on free tier)
- Basic terminal/command line knowledge

---

## Part 1: AWS RDS (MySQL Database)

### Step 1: Create RDS Instance

1. **Login to AWS Console** → Search for "RDS"

2. **Click "Create database"**

3. **Configuration**:
   - Choose: **Standard Create**
   - Engine: **MySQL**
   - Version: **MySQL 8.0.x** (latest)
   - Templates: **Free tier** ✅

4. **Settings**:
   - DB instance identifier: `n8tive-project-manager-db`
   - Master username: `admin`
   - Master password: `YourSecurePassword123!` (save this!)
   - Confirm password

5. **Instance Configuration**:
   - DB instance class: **db.t3.micro** (Free tier eligible)
   - Storage: **20 GB** (Free tier includes 20GB)
   - Storage autoscaling: ✅ Enable

6. **Connectivity**:
   - Public access: **Yes** (we'll secure it with security groups)
   - VPC security group: Create new → `n8tive-db-sg`

7. **Additional configuration**:
   - Initial database name: `n8tive_project_manager`
   - Backup retention: **7 days**
   - Enable automated backups: ✅ Yes

8. **Click "Create database"** (takes ~5-10 minutes)

### Step 2: Configure Security Group

1. While RDS is creating, go to **EC2 → Security Groups**
2. Find `n8tive-db-sg`
3. Click **Inbound rules → Edit inbound rules**
4. Add rule:
   - Type: **MySQL/Aurora**
   - Port: **3306**
   - Source: **My IP** (for testing) or **Custom** (your EC2 security group later)
5. Save rules

### Step 3: Get RDS Endpoint

1. Go back to **RDS → Databases**
2. Click your database
3. Copy the **Endpoint** (looks like: `n8tive-project-manager-db.xxxxx.region.rds.amazonaws.com`)
4. Save this - you'll need it!

### Step 4: Initialize Database

From your local machine:

```bash
# Install MySQL client if you don't have it
# macOS: brew install mysql-client
# Linux: sudo apt install mysql-client
# Windows: Download from mysql.com

# Connect to RDS
mysql -h your-rds-endpoint.rds.amazonaws.com -P 3306 -u admin -p

# Enter your password when prompted

# Create tables (copy paste from backend/database.sql)
```

Or use MySQL Workbench GUI to connect and run `database.sql`.

---

## Part 2: AWS EC2 (Backend API Server)

### Step 1: Launch EC2 Instance

1. **AWS Console → EC2 → Launch Instance**

2. **Name**: `n8tive-backend-server`

3. **Application and OS Images**:
   - **Amazon Linux 2023** (Free tier eligible) ✅
   - AMI: Amazon Linux 2023 AMI

4. **Instance type**:
   - **t2.micro** or **t3.micro** (Free tier eligible) ✅

5. **Key pair**:
   - Create new key pair
   - Name: `n8tive-backend-key`
   - Type: **RSA**
   - Format: **.pem** (Mac/Linux) or **.ppk** (Windows)
   - Download and **save securely**!

6. **Network settings**:
   - Create security group: `n8tive-backend-sg`
   - Allow SSH (port 22) from **My IP**
   - Add rule: **Custom TCP → Port 3000** from **Anywhere** (or your IP)

7. **Storage**: **8 GB** (Free tier includes 30GB)

8. **Launch instance**

### Step 2: Connect to EC2

```bash
# macOS/Linux
chmod 400 n8tive-backend-key.pem
ssh -i "n8tive-backend-key.pem" ec2-user@your-ec2-public-ip

# Windows: Use PuTTY with your .ppk file
```

### Step 3: Install Node.js and Dependencies

```bash
# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo yum install -y git
```

### Step 4: Deploy Backend Code

```bash
# Clone your repository
git clone https://github.com/Jonjos95/Project-Manager.git
cd Project-Manager/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

Paste this (update with your RDS endpoint):

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=n8tive_project_manager
DB_PORT=3306
JWT_SECRET=generate-a-random-string-here-use-uuidgenerator
ALLOWED_ORIGINS=http://your-cloudfront-url.com,https://your-domain.com
```

Save with `Ctrl+X`, `Y`, `Enter`

### Step 5: Start Backend Server

```bash
# Test it works
npm start

# If successful, press Ctrl+C and start with PM2
pm2 start server.js --name n8tive-backend

# Make PM2 start on boot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs
```

### Step 6: Test Backend API

```bash
# From your local machine
curl http://your-ec2-public-ip:3000

# Should return:
# {"success":true,"message":"N8tive.io Project Manager API","version":"1.0.0"}
```

---

## Part 3: AWS S3 + CloudFront (Frontend)

### Step 1: Create S3 Bucket

1. **AWS Console → S3 → Create bucket**

2. **Bucket name**: `n8tive-project-manager` (must be globally unique)

3. **Region**: Same as your EC2/RDS

4. **Block Public Access**: ✅ **Uncheck** "Block all public access"
   - Check the acknowledgment

5. **Bucket Versioning**: Enable (recommended)

6. **Create bucket**

### Step 2: Enable Static Website Hosting

1. Click your bucket → **Properties** tab
2. Scroll to **Static website hosting** → Edit
3. Enable: **Enable**
4. Index document: `index.html`
5. Error document: `index.html`
6. Save changes
7. Note the **Bucket website endpoint** URL

### Step 3: Set Bucket Policy

1. **Permissions** tab → **Bucket Policy** → Edit
2. Paste this (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

3. Save changes

### Step 4: Update Frontend Configuration

On your local machine, create `config.js`:

```javascript
// config.js
const API_CONFIG = {
    apiUrl: 'http://your-ec2-public-ip:3000/api'
};
```

Update `script.js` to use this config (I'll help you with this in the next step).

### Step 5: Upload Frontend

```bash
# From your project root
cd "/Users/jon/dev/Project Manager"

# Upload to S3 (install AWS CLI first)
aws s3 sync . s3://your-bucket-name/ --exclude "backend/*" --exclude "node_modules/*" --exclude ".git/*"
```

Or use AWS Console:
1. Go to S3 bucket
2. Click **Upload**
3. Drag and drop: `index.html`, `script.js`, `style.css`, `components/`
4. Click **Upload**

### Step 6: Create CloudFront Distribution (Optional but Recommended)

1. **AWS Console → CloudFront → Create distribution**
2. **Origin domain**: Select your S3 bucket
3. **Viewer protocol policy**: Redirect HTTP to HTTPS
4. **Default root object**: `index.html`
5. **Create distribution**
6. Wait 10-15 minutes for deployment
7. Use the **CloudFront URL** (like `d1234abcd.cloudfront.net`) to access your site

---

## Part 4: Connect Frontend to Backend

I'll update your `script.js` to use the API. Update this at the top of script.js:

```javascript
// API Configuration
const API_URL = 'http://your-ec2-public-ip:3000/api';
```

Then replace localStorage authentication with API calls (I'll create this code for you next).

---

## 💰 Cost Breakdown (Free Tier)

### First 12 Months (Free Tier):
- **RDS (db.t3.micro)**: 750 hours/month = FREE
- **EC2 (t2.micro)**: 750 hours/month = FREE
- **S3**: 5GB storage + 20,000 GET requests = FREE
- **CloudFront**: 50GB data transfer = FREE
- **Total**: $0/month ✅

### After Free Tier:
- **RDS**: ~$15-20/month
- **EC2**: ~$8-10/month
- **S3**: ~$1-2/month
- **CloudFront**: ~$1-3/month
- **Total**: ~$25-35/month

---

## 🔒 Security Best Practices

1. **RDS Security Group**: Only allow your EC2 security group
2. **Change default passwords**: Use strong passwords
3. **Enable HTTPS**: Use AWS Certificate Manager (free SSL)
4. **Regular backups**: RDS automated backups enabled
5. **Update JWT_SECRET**: Use a strong random string
6. **Monitor costs**: Set up AWS Budget alerts

---

## 🎯 Next Steps

1. ✅ Set up custom domain (Route 53 or your domain provider)
2. ✅ Enable HTTPS with AWS Certificate Manager
3. ✅ Set up CloudWatch monitoring
4. ✅ Configure automatic backups
5. ✅ Set up staging environment

---

## 🐛 Troubleshooting

### Can't connect to RDS from local
- Check security group allows your IP
- Check RDS is publicly accessible
- Verify endpoint and port

### Backend not responding
```bash
ssh into EC2
pm2 logs
pm2 restart n8tive-backend
```

### Frontend shows CORS error
- Add your CloudFront/S3 URL to `ALLOWED_ORIGINS` in backend .env
- Restart backend: `pm2 restart n8tive-backend`

---

## 📞 Need Help?

Check AWS documentation or create an issue in the GitHub repo!

---

**🎉 Congratulations! Your app is now running on AWS!**

Access your app at: `https://your-cloudfront-url.cloudfront.net`

