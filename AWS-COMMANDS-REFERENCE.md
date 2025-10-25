# AWS Full-Stack Deployment - Complete Command Reference

**N8tive.io Project Manager**  
**Date:** October 25, 2025  
**Author:** Setup Documentation

---

## Table of Contents

1. [Git Commands](#1-git-commands)
2. [SSH & Remote Access](#2-ssh--remote-access)
3. [MySQL Database](#3-mysql-database)
4. [Node.js & NPM](#4-nodejs--npm)
5. [PM2 Process Manager](#5-pm2-process-manager)
6. [Nginx Web Server](#6-nginx-web-server)
7. [Linux System Commands](#7-linux-system-commands)
8. [API Testing (curl)](#8-api-testing-curl)
9. [GitHub Actions](#9-github-actions)
10. [AWS Specific](#10-aws-specific)
11. [Deployment Scripts](#11-deployment-scripts)
12. [Quick Reference](#12-quick-reference)

---

## 1. Git Commands

### Basic Operations

#### `git status`
Shows the current state of your working directory and staging area. Displays modified files, staged files, and untracked files.

```bash
git status
```

#### `git add -A`
Stages ALL changes (new, modified, deleted files) for commit.  
`-A` = `--all` (everything in the entire working tree)

```bash
git add -A
git add <file>  # Stage specific file
```

#### `git commit -m "Message"`
Creates a commit with the staged changes and a descriptive message.  
`-m` allows you to write the message inline.

```bash
git commit -m "Add new feature"
git commit --amend  # Modify last commit
```

#### `git push origin main`
Uploads your local commits to the remote repository (GitHub).  
`origin` = remote name, `main` = branch name.

```bash
git push origin main
git push --force origin main  # ⚠️ Force push (use with caution)
```

#### `git pull origin main`
Downloads and merges changes from remote repository to local.  
Fetches + merges in one command.

```bash
git pull origin main
git pull --no-rebase origin main  # Merge strategy
```

### Remote Management

#### `git remote -v`
Lists all configured remote repositories and their URLs.  
`-v` = verbose (shows fetch and push URLs)

```bash
git remote -v
git remote add <name> <url>       # Add new remote
git remote set-url <name> <url>   # Change remote URL
git remote remove <name>          # Remove remote
```

### Commit History

#### `git log`
Shows commit history.

```bash
git log
git log -1 --oneline              # Last commit, compact format
git log --oneline --graph         # Visual branch graph
git log --author="name"           # Filter by author
```

---

## 2. SSH & Remote Access

### Connecting to EC2

#### `ssh -i <key-file> <user>@<host>`
Securely connects to remote server via SSH.  
`-i` = identity file (private key)

```bash
ssh -i n8tiveio-backend-key.pem ec2-user@54.158.1.37
```

#### Remote Command Execution
Executes a single command on remote server and exits.

```bash
ssh -i key.pem ec2-user@54.158.1.37 "pm2 status"
ssh -i key.pem user@host "cd ~/app && git pull"
```

#### `exit`
Exits SSH session and returns to local terminal.

```bash
exit
logout  # Alternative
```

### File Permissions

#### `chmod 400 <file>`
Sets file permissions to read-only for owner.  
Required for SSH private keys for security.  
`4` = read, `0` = no permissions for group/others

```bash
chmod 400 n8tiveio-backend-key.pem
chmod 600 <file>  # Read/write for owner only
chmod 755 <file>  # Owner: rwx, Others: rx
```

---

## 3. MySQL Database

### Connection

#### `mysql -h <host> -u <username> -p`
Connects to MySQL database server.  
`-h` = hostname/IP, `-u` = username, `-p` = prompt for password

```bash
mysql -h n8tiveio-db.rds.amazonaws.com -u admin -p
mysql -h localhost -u root -p
mysql -h host -P 3306 -u user -p  # Custom port
```

### Database Operations (SQL)

#### Database Management
```sql
SHOW DATABASES;
-- Lists all databases on the server

CREATE DATABASE database_name;
-- Creates a new database

USE database_name;
-- Switches to specified database

DROP DATABASE database_name;
-- Deletes a database (⚠️ irreversible)
```

#### Table Management
```sql
SHOW TABLES;
-- Lists all tables in current database

DESCRIBE table_name;
-- Shows structure of a table (columns, types, keys)

SHOW CREATE TABLE table_name;
-- Shows CREATE TABLE statement
```

#### Data Queries
```sql
SELECT * FROM table_name;
-- Retrieves all rows and columns from a table

SELECT * FROM table_name LIMIT 10;
-- Retrieves first 10 rows only

SELECT column1, column2 FROM table_name WHERE condition;
-- Retrieves specific columns with filter

SELECT COUNT(*) FROM table_name;
-- Counts total rows
```

#### Data Manipulation
```sql
INSERT INTO table_name (col1, col2) VALUES ('val1', 'val2');
-- Adds a new row to the table

UPDATE table_name SET column = value WHERE condition;
-- Modifies existing rows

DELETE FROM table_name WHERE condition;
-- Removes rows from table

TRUNCATE TABLE table_name;
-- Removes all rows (faster than DELETE)
```

#### User Management
```sql
CREATE USER 'username'@'host' IDENTIFIED BY 'password';
-- Creates a new database user

GRANT ALL PRIVILEGES ON database.* TO 'user'@'host';
-- Grants permissions

FLUSH PRIVILEGES;
-- Reloads privilege tables

SHOW GRANTS FOR 'user'@'host';
-- Shows user permissions
```

#### Utility Commands
```sql
SOURCE file.sql;
-- Executes SQL commands from a file

quit;
exit;
-- Exits MySQL console
```

### Running SQL Files

#### Execute SQL file from command line
```bash
mysql -h host -u user -p < database.sql
mysql -h host -u user -p database_name < file.sql
```

---

## 4. Node.js & NPM

### Package Management

#### `npm install`
Installs all dependencies listed in package.json.  
Creates node_modules folder.

```bash
npm install
npm i  # Shorthand
npm ci  # Clean install (uses package-lock.json)
```

#### `npm install <package>`
Installs a specific package and adds to package.json.

```bash
npm install express
npm install --save express          # Add to dependencies
npm install --save-dev nodemon      # Add to devDependencies
npm install express@4.17.1          # Specific version
```

#### `npm install -g <package>`
Installs package globally (system-wide).  
`-g` = global flag

```bash
npm install -g pm2
npm install -g nodemon
npm list -g --depth=0  # List global packages
```

#### `npm uninstall <package>`
Removes a package.

```bash
npm uninstall express
npm uninstall -g pm2  # Remove global package
```

### Running Scripts

#### `npm start`
Runs the "start" script defined in package.json.  
Usually starts the application.

```bash
npm start
```

#### `npm run dev`
Runs the "dev" script (usually nodemon for auto-restart).

```bash
npm run dev
npm run <script-name>  # Run any custom script
```

### Package Information

#### View package info
```bash
npm list                # List installed packages
npm outdated            # Show outdated packages
npm update              # Update packages
npm audit               # Check for vulnerabilities
npm audit fix           # Fix vulnerabilities
```

### Package.json Scripts Example
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "build": "webpack"
  }
}
```

---

## 5. PM2 Process Manager

### Process Management

#### `pm2 start <file> --name <name>`
Starts a Node.js application as a daemon.  
`--name` gives it a custom name for easier management.

```bash
pm2 start server.js --name n8tive-backend
pm2 start app.js --name api --instances 4  # Cluster mode
pm2 start ecosystem.config.js              # Use config file
```

#### `pm2 restart <name>`
Restarts a running process (0 downtime).  
Reloads code changes.

```bash
pm2 restart n8tive-backend
pm2 restart all                # Restart all processes
pm2 reload n8tive-backend      # 0-downtime reload
```

#### `pm2 stop <name>`
Stops a running process (keeps in PM2 list).

```bash
pm2 stop n8tive-backend
pm2 stop all
```

#### `pm2 delete <name>`
Removes process from PM2 list completely.

```bash
pm2 delete n8tive-backend
pm2 delete all
```

### Monitoring

#### `pm2 status`
Shows status of all PM2-managed processes.  
Displays: name, status, CPU, memory

```bash
pm2 status
pm2 list  # Alias
pm2 ls    # Alias
```

#### `pm2 logs <name>`
Shows real-time logs for a process.  
Ctrl+C to exit.

```bash
pm2 logs n8tive-backend
pm2 logs n8tive-backend --lines 30       # Last 30 lines
pm2 logs n8tive-backend --nostream       # Don't tail
pm2 logs --err                           # Error logs only
pm2 logs --out                           # Output logs only
```

#### `pm2 monit`
Opens real-time monitoring dashboard.  
Shows CPU, memory, logs.

```bash
pm2 monit
```

### Log Management

#### `pm2 flush`
Clears all log files.

```bash
pm2 flush
pm2 flush n8tive-backend  # Flush specific process
```

### Persistence

#### `pm2 save`
Saves current process list for startup.

```bash
pm2 save
```

#### `pm2 startup`
Generates startup script to auto-start PM2 on boot.  
Run the command it outputs.

```bash
pm2 startup
pm2 unstartup  # Remove startup script
```

### Advanced Commands

#### Process information
```bash
pm2 describe n8tive-backend      # Detailed process info
pm2 show n8tive-backend          # Alias
pm2 info n8tive-backend          # Alias
```

#### Resource management
```bash
pm2 reset n8tive-backend         # Reset process metadata
pm2 scale api 4                  # Scale to 4 instances
```

---

## 6. Nginx Web Server

### Service Management

#### `sudo systemctl start nginx`
Starts the Nginx web server.

```bash
sudo systemctl start nginx
```

#### `sudo systemctl stop nginx`
Stops the Nginx web server.

```bash
sudo systemctl stop nginx
```

#### `sudo systemctl restart nginx`
Stops then starts Nginx (brief downtime).

```bash
sudo systemctl restart nginx
```

#### `sudo systemctl reload nginx`
Reloads configuration without dropping connections.  
Preferred for config changes.

```bash
sudo systemctl reload nginx
```

#### `sudo systemctl enable nginx`
Configures Nginx to start automatically on boot.

```bash
sudo systemctl enable nginx
sudo systemctl disable nginx  # Disable auto-start
```

#### `sudo systemctl status nginx`
Shows current status of Nginx service.  
Displays: running/stopped, recent logs.

```bash
sudo systemctl status nginx
sudo systemctl is-active nginx  # Returns "active" or "inactive"
```

### Configuration

#### `sudo nginx -t`
Tests Nginx configuration for syntax errors.  
Always run before reloading!

```bash
sudo nginx -t
sudo nginx -T  # Show full config
```

#### Configuration file locations
```bash
# Main configuration
sudo nano /etc/nginx/nginx.conf

# Site configurations
sudo nano /etc/nginx/conf.d/site.conf
sudo nano /etc/nginx/sites-available/site.conf

# View all configs
cat /etc/nginx/conf.d/*.conf
```

### Logs

#### Access logs
Shows HTTP requests to your server.

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -n 50 /var/log/nginx/access.log
```

#### Error logs
Shows Nginx errors and issues.

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -n 50 /var/log/nginx/error.log
sudo cat /var/log/nginx/error.log | grep "error"
```

### Installation

#### Amazon Linux
```bash
sudo yum install -y nginx
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install -y nginx
```

---

## 7. Linux System Commands

### File Operations

#### `ls` - List files
Lists files and directories in current directory.

```bash
ls
ls -l               # Long format (permissions, size, date)
ls -la              # Long format + hidden files
ls -lh              # Human-readable sizes (KB, MB, GB)
ls -lt              # Sort by modification time
ls -lS              # Sort by size
```

#### `cd` - Change directory
Changes current directory.

```bash
cd <directory>
cd ~                # Go to home directory
cd ..               # Go up one level
cd -                # Go to previous directory
cd /path/to/dir     # Absolute path
```

#### `pwd` - Print working directory
Shows current directory full path.

```bash
pwd
```

#### `mkdir` - Make directory
Creates a new directory.

```bash
mkdir <directory>
mkdir -p path/to/nested/dir    # Create parent dirs
```

#### `cp` - Copy
Copies file or directory.

```bash
cp source.txt destination.txt
cp -r dir1 dir2                # Copy directory recursively
cp -v source dest              # Verbose (show progress)
```

#### `mv` - Move/Rename
Moves or renames file/directory.

```bash
mv oldname.txt newname.txt     # Rename
mv file.txt /path/to/dest/     # Move
mv -v source dest              # Verbose
```

#### `rm` - Remove
Removes (deletes) a file.

```bash
rm file.txt
rm -f file.txt                 # Force (no confirmation)
rm -rf directory/              # Remove directory recursively
rm -i file.txt                 # Interactive (prompt before delete)
```

#### `cat` - Concatenate/Display
Displays entire file content.

```bash
cat file.txt
cat file1.txt file2.txt        # Display multiple files
cat > file.txt                 # Create/overwrite file (Ctrl+D to save)
cat >> file.txt                # Append to file
```

#### `head` - Show first lines
Shows first lines of file.

```bash
head file.txt                  # First 10 lines (default)
head -n 20 file.txt            # First 20 lines
```

#### `tail` - Show last lines
Shows last lines of file.

```bash
tail file.txt                  # Last 10 lines (default)
tail -n 50 file.txt            # Last 50 lines
tail -f file.txt               # Follow file (show new lines)
```

#### `nano` - Text editor
Opens file in nano text editor.  
Ctrl+X to exit, Y to save.

```bash
nano file.txt
nano +25 file.txt              # Open at line 25
```

#### `chmod` - Change permissions
Changes file permissions.

```bash
chmod +x script.sh             # Make executable
chmod 755 file.txt             # Owner: rwx, Others: rx
chmod 644 file.txt             # Owner: rw, Others: r
chmod -R 755 directory/        # Recursive
```

**Permission numbers:**
- 7 = rwx (read, write, execute)
- 6 = rw- (read, write)
- 5 = r-x (read, execute)
- 4 = r-- (read only)

#### `chown` - Change ownership
Changes file ownership.

```bash
sudo chown user:group file.txt
sudo chown -R nginx:nginx /var/www/html/
sudo chown user file.txt       # Change owner only
```

### File Viewing

#### `less` - Page through file
View file with pagination.

```bash
less file.txt
# Space = next page, b = previous page, q = quit
```

#### `grep` - Search text
Searches for patterns in files.

```bash
grep "search term" file.txt
grep -r "term" directory/      # Recursive search
grep -i "term" file.txt        # Case-insensitive
grep -n "term" file.txt        # Show line numbers
grep -v "term" file.txt        # Invert match (exclude)
```

### System Information

#### `whoami`
Shows current username.

```bash
whoami
```

#### `hostname`
Shows system hostname.

```bash
hostname
hostname -I                    # Show IP addresses
```

#### `uname -a`
Shows system information (OS, kernel version, etc.).

```bash
uname -a
uname -r                       # Kernel version only
```

#### `df -h`
Shows disk space usage.  
`-h` = human-readable (GB, MB)

```bash
df -h
df -h /                        # Specific filesystem
```

#### `free -h`
Shows memory usage.

```bash
free -h
free -m                        # In megabytes
```

#### `top`
Shows real-time process and resource usage.  
`q` to quit.

```bash
top
htop                           # Enhanced version (if installed)
```

#### `ps` - Process status
Lists running processes.

```bash
ps aux
ps aux | grep node             # Find specific process
ps -ef                         # All processes, full format
```

### Package Management (Amazon Linux/RHEL)

#### `yum` - Package manager
Manages software packages.

```bash
sudo yum update                # Update all packages
sudo yum install <package>     # Install package
sudo yum install -y <package>  # Install without prompts
sudo yum remove <package>      # Remove package
sudo yum search <keyword>      # Search for packages
yum list installed             # List installed packages
```

### Service Management

#### `systemctl` - Service control
Manages system services.

```bash
sudo systemctl start <service>
sudo systemctl stop <service>
sudo systemctl restart <service>
sudo systemctl reload <service>
sudo systemctl enable <service>    # Auto-start on boot
sudo systemctl disable <service>   # Disable auto-start
sudo systemctl status <service>    # Check status
```

### Environment Variables

#### Managing environment variables
```bash
export VAR_NAME=value          # Set variable
echo $VAR_NAME                 # Display value
printenv                       # Show all variables
env                            # Show all variables
source .env                    # Load from file
unset VAR_NAME                 # Remove variable
```

### Compression

#### `tar` - Archive files
Creates/extracts archives.

```bash
tar -czf archive.tar.gz files/ # Create compressed archive
tar -xzf archive.tar.gz        # Extract archive
tar -tzf archive.tar.gz        # List contents
```

#### `zip/unzip`
Creates/extracts ZIP files.

```bash
zip -r archive.zip files/      # Create ZIP
unzip archive.zip              # Extract ZIP
unzip -l archive.zip           # List contents
```

---

## 8. API Testing (curl)

### Basic Requests

#### `curl <url>`
Makes GET request and displays response.

```bash
curl http://54.158.1.37/api/health
```

#### Request types
```bash
curl -I <url>                  # Headers only (HEAD request)
curl -s <url>                  # Silent mode (no progress bar)
curl -v <url>                  # Verbose (show details)
curl -L <url>                  # Follow redirects
```

### HTTP Methods

#### Explicit HTTP methods
```bash
curl -X GET <url>              # GET request
curl -X POST <url>             # POST request
curl -X PUT <url>              # PUT request
curl -X DELETE <url>           # DELETE request
curl -X PATCH <url>            # PATCH request
```

### Sending Data

#### JSON data
```bash
curl -X POST <url> \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'

# Multi-line JSON
curl -X POST http://54.158.1.37/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "password": "test123"
  }'
```

#### Form data
```bash
curl -X POST <url> \
  -d "username=test" \
  -d "password=test123"

curl -X POST <url> \
  -F "file=@/path/to/file.txt" \
  -F "name=value"
```

### Authentication

#### Headers
```bash
# Bearer token
curl -H "Authorization: Bearer <token>" <url>

# Basic auth
curl -u username:password <url>

# Custom headers
curl -H "X-Custom-Header: value" <url>
```

### Advanced Options

#### Output and formatting
```bash
curl -o output.json <url>              # Save to file
curl <url> > output.txt                # Redirect output
curl -s <url> | jq                     # Format JSON with jq
curl -w "%{http_code}" <url>           # Show status code
```

#### Timeouts and retries
```bash
curl --connect-timeout 5 <url>         # Connection timeout
curl --max-time 10 <url>               # Total timeout
curl --retry 3 <url>                   # Retry failed requests
```

#### Cookies
```bash
curl -b cookies.txt <url>              # Send cookies
curl -c cookies.txt <url>              # Save cookies
```

### Testing Examples

#### Health checks
```bash
curl http://54.158.1.37/health
curl http://54.158.1.37:3000/api/auth/verify
```

#### With JSON formatting
```bash
curl -s http://54.158.1.37/health | jq
curl -s http://54.158.1.37/api/tasks | jq
```

#### Check headers
```bash
curl -I http://54.158.1.37/
```

#### EC2 metadata (from within EC2)
```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
curl http://169.254.169.254/latest/meta-data/instance-id
```

---

## 9. GitHub Actions

### Workflow YAML Structure

```yaml
name: Deploy to AWS EC2
# Name displayed in Actions tab

on:
  push:
    branches: [ main ]
  # Triggers when pushing to main branch

jobs:
  deploy:
    runs-on: ubuntu-latest
    # Runs on GitHub's Ubuntu server
    
    steps:
    - name: Deploy Frontend & Backend to EC2
      uses: appleboy/ssh-action@master
      # Uses SSH action to connect to EC2
      
      with:
        host: 54.158.1.37
        # EC2 public IP
        
        username: ec2-user
        # SSH username
        
        key: ${{ secrets.EC2_SSH_KEY }}
        # SSH private key from GitHub Secrets
        
        script: |
          # Commands run on EC2
          cd ~/Project-Manager
          git pull origin main
          cd backend
          npm install
          pm2 restart n8tive-backend
          cd ..
          ./deploy-frontend.sh
```

### Common Triggers

```yaml
# Push to specific branch
on:
  push:
    branches: [ main, develop ]

# Pull request
on:
  pull_request:
    branches: [ main ]

# Manual trigger
on:
  workflow_dispatch:

# Scheduled (cron)
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

# Multiple events
on: [push, pull_request]
```

### Using Secrets

#### Accessing secrets in workflows
```yaml
${{ secrets.SECRET_NAME }}
${{ secrets.EC2_SSH_KEY }}
${{ secrets.DATABASE_PASSWORD }}
```

#### Managing secrets
1. Go to GitHub repo
2. Settings → Secrets and variables → Actions
3. New repository secret
4. Add name and value
5. Use in workflow with `${{ secrets.NAME }}`

### Common Actions

```yaml
# Checkout code
- uses: actions/checkout@v3

# Setup Node.js
- uses: actions/setup-node@v3
  with:
    node-version: '18'

# Cache dependencies
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# SSH action
- uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    script: |
      echo "Commands here"
```

### Viewing Actions

- GitHub Repo → **Actions** tab
- Click workflow run to see details
- View logs for each step
- Download artifacts if configured

---

## 10. AWS Specific

### EC2 Instance

#### Connection
```bash
# SSH into EC2
ssh -i n8tiveio-backend-key.pem ec2-user@54.158.1.37

# Public IP: 54.158.1.37
# Instance type: t2.micro (Free Tier)
# OS: Amazon Linux 2023
```

#### EC2 Metadata (from within instance)
```bash
# Get public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Get instance ID
curl http://169.254.169.254/latest/meta-data/instance-id

# Get hostname
curl http://169.254.169.254/latest/meta-data/hostname

# Get availability zone
curl http://169.254.169.254/latest/meta-data/placement/availability-zone

# Get instance type
curl http://169.254.169.254/latest/meta-data/instance-type

# Get security groups
curl http://169.254.169.254/latest/meta-data/security-groups
```

### RDS (MySQL Database)

#### Connection details
```
Endpoint: n8tiveio-project-manager-db.cc7cwc2em3sj.us-east-1.rds.amazonaws.com
Port: 3306
Engine: MySQL 8.0
Username: admin
Database: n8tive_project_manager
Instance: db.t3.micro (Free Tier)
```

#### Connection command
```bash
mysql -h n8tiveio-project-manager-db.cc7cwc2em3sj.us-east-1.rds.amazonaws.com \
      -P 3306 \
      -u admin \
      -p
```

### Security Groups

#### EC2 Security Group Rules

**Inbound Rules:**
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Backend API (testing) |

**Outbound Rules:**
- All traffic allowed (default)

#### RDS Security Group Rules

**Inbound Rules:**
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| MySQL | TCP | 3306 | EC2 Security Group | Database access |

### AWS CLI Commands

#### EC2 commands
```bash
# List instances
aws ec2 describe-instances

# Get instance details
aws ec2 describe-instances --instance-ids i-1234567890abcdef0

# Start instance
aws ec2 start-instances --instance-ids i-1234567890abcdef0

# Stop instance
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# Get public IP
aws ec2 describe-instances \
  --instance-ids i-1234567890abcdef0 \
  --query 'Reservations[0].Instances[0].PublicIpAddress'
```

#### RDS commands
```bash
# List databases
aws rds describe-db-instances

# Get RDS details
aws rds describe-db-instances \
  --db-instance-identifier n8tiveio-project-manager-db
```

---

## 11. Deployment Scripts

### setup-nginx.sh
One-time Nginx setup on EC2.

```bash
#!/bin/bash
# Initial Nginx Setup for EC2 - Run this ONCE

echo "🔧 Setting up Nginx on EC2..."

# Install Nginx
echo "📦 Installing Nginx..."
sudo yum install -y nginx

# Start and enable Nginx
echo "🚀 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Open HTTP port in firewall (if firewalld is running)
if sudo systemctl is-active --quiet firewalld; then
    echo "🔥 Configuring firewall..."
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --reload
fi

# Create web directory
echo "📂 Creating web directory..."
sudo mkdir -p /var/www/html/Project-Manager

# Set SELinux permissions (if SELinux is enabled)
if command -v getenforce &> /dev/null && [ "$(getenforce)" != "Disabled" ]; then
    echo "🔐 Configuring SELinux..."
    sudo setsebool -P httpd_can_network_connect 1
    sudo chcon -Rt httpd_sys_content_t /var/www/html/Project-Manager
fi

echo "✅ Nginx setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure EC2 Security Group allows HTTP (port 80)"
echo "2. Run deployment: ./deploy-frontend.sh"
echo "3. Visit: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
```

### deploy-frontend.sh
Deploys frontend files to Nginx.

```bash
#!/bin/bash
# Frontend Deployment Script for EC2

echo "🚀 Deploying N8tive.io Project Manager Frontend..."

# Create web directory if it doesn't exist
sudo mkdir -p /var/www/html/Project-Manager

# Copy frontend files
echo "📂 Copying frontend files..."
sudo cp index.html /var/www/html/Project-Manager/
sudo cp script.js /var/www/html/Project-Manager/
sudo cp style.css /var/www/html/Project-Manager/
sudo cp config.js /var/www/html/Project-Manager/
sudo cp README.md /var/www/html/Project-Manager/ 2>/dev/null || true

# Copy components directory if it exists and has files
if [ -d "components" ] && [ "$(ls -A components 2>/dev/null)" ]; then
    echo "📦 Copying components..."
    sudo cp -r components /var/www/html/Project-Manager/
else
    echo "ℹ️  No components directory or empty, skipping..."
    sudo mkdir -p /var/www/html/Project-Manager/components
fi

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R nginx:nginx /var/www/html/Project-Manager
sudo chmod -R 755 /var/www/html/Project-Manager

# Copy and configure Nginx
echo "⚙️ Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/conf.d/n8tive-project-manager.conf

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "♻️ Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Frontend deployment complete!"
echo "🌐 Visit: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
```

### Nginx Configuration (nginx.conf)

```nginx
server {
    listen 80;
    server_name _;

    # Frontend - Serve static files
    root /var/www/html/Project-Manager;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss application/json;
}
```

---

## 12. Quick Reference

### Most Used Commands Today

| Task | Command |
|------|---------|
| **Push to GitHub** | `git add -A && git commit -m "message" && git push origin main` |
| **SSH to EC2** | `ssh -i key.pem ec2-user@54.158.1.37` |
| **Check PM2 status** | `pm2 status` |
| **View PM2 logs** | `pm2 logs n8tive-backend --lines 30` |
| **Restart backend** | `pm2 restart n8tive-backend` |
| **Test API** | `curl http://54.158.1.37/api/health` |
| **Check Nginx** | `sudo systemctl status nginx` |
| **Reload Nginx** | `sudo nginx -t && sudo systemctl reload nginx` |
| **Connect to RDS** | `mysql -h <rds-endpoint> -u admin -p` |
| **View Actions** | Visit GitHub repo → Actions tab |
| **Deploy frontend** | `./deploy-frontend.sh` |

### Environment Variables (.env)

```bash
# Backend environment variables
NODE_ENV=production
PORT=3000

# Database
DB_HOST=n8tiveio-project-manager-db.cc7cwc2em3sj.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_password_here
DB_NAME=n8tive_project_manager
DB_PORT=3306

# Authentication
JWT_SECRET=your_jwt_secret_here

# CORS
ALLOWED_ORIGINS=*
```

### File Locations on EC2

```
/home/ec2-user/
├── Project-Manager/              # Git repository
│   ├── index.html                # Frontend files
│   ├── script.js
│   ├── style.css
│   ├── config.js
│   ├── nginx.conf
│   ├── setup-nginx.sh
│   ├── deploy-frontend.sh
│   └── backend/                  # Backend files
│       ├── server.js
│       ├── package.json
│       ├── .env
│       ├── database.sql
│       ├── config/
│       ├── middleware/
│       └── routes/

/var/www/html/
└── Project-Manager/              # Nginx web root
    ├── index.html                # Served by Nginx
    ├── script.js
    ├── style.css
    ├── config.js
    └── components/

/etc/nginx/
├── nginx.conf                    # Main config
└── conf.d/
    └── n8tive-project-manager.conf  # Site config

~/.pm2/
├── logs/
│   ├── n8tive-backend-out.log    # Application logs
│   └── n8tive-backend-error.log  # Error logs
└── pids/                         # Process IDs
```

### URLs and Endpoints

| Service | URL |
|---------|-----|
| **Frontend** | http://54.158.1.37 |
| **Backend API** | http://54.158.1.37/api |
| **Health Check** | http://54.158.1.37/health |
| **API Verify** | http://54.158.1.37/api/auth/verify |
| **GitHub Repo** | https://github.com/Jonjos95/Project-Manager |
| **GitHub Actions** | https://github.com/Jonjos95/Project-Manager/actions |

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

#### Tasks (Requires Authentication)
- `GET /api/tasks` - Get all user tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/activity/log` - Get activity log

### Troubleshooting Commands

#### Backend issues
```bash
# Check if backend is running
pm2 status

# View backend logs
pm2 logs n8tive-backend

# Restart backend
pm2 restart n8tive-backend

# Test backend directly
curl http://localhost:3000/health
```

#### Frontend issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### Database issues
```bash
# Test connection
mysql -h <rds-endpoint> -u admin -p

# Check if database exists
mysql -h <host> -u admin -p -e "SHOW DATABASES;"

# Check tables
mysql -h <host> -u admin -p n8tive_project_manager -e "SHOW TABLES;"
```

#### Network issues
```bash
# Test port connectivity
nc -zv 54.158.1.37 80
nc -zv <rds-endpoint> 3306

# Test DNS resolution
nslookup <rds-endpoint>

# Check open ports
sudo netstat -tlnp
sudo ss -tlnp
```

---

## Development Workflow

### Making Changes

1. **Edit files in Cursor**
   - Make your code changes
   - Test locally if possible

2. **Commit changes**
   ```bash
   git add -A
   git commit -m "Descriptive message"
   ```

3. **Push to GitHub**
   ```bash
   git push origin main
   ```

4. **Auto-deployment happens**
   - GitHub Actions triggers
   - Code is pulled on EC2
   - Backend restarts (PM2)
   - Frontend updates (Nginx)
   - Takes ~30-60 seconds

5. **Verify deployment**
   ```bash
   curl http://54.158.1.37/
   ```

### Local Development

```bash
# Test frontend locally (uses AWS backend)
open index.html

# Or run local server
python3 -m http.server 8080
# Visit: http://localhost:8080

# Backend points to AWS RDS
# Frontend config.js detects environment automatically
```

---

## Security Best Practices

### SSH Keys
- ✅ Keep private keys secure (400 permissions)
- ✅ Never commit keys to Git
- ✅ Use different keys for different environments
- ✅ Rotate keys periodically

### Database
- ✅ RDS not publicly accessible
- ✅ Strong passwords (stored in .env)
- ✅ Security group restricts access
- ✅ Automated backups enabled

### Application
- ✅ JWT authentication for API
- ✅ Password hashing (bcrypt)
- ✅ Row-level security in database
- ✅ Environment variables for secrets

### AWS
- ✅ Minimal security group rules
- ✅ Regular security updates
- ✅ GitHub Secrets for sensitive data
- ✅ Monitor CloudWatch logs

---

## Backup and Recovery

### Database Backup (RDS)
```bash
# Manual snapshot (AWS Console)
RDS → Databases → Select instance → Actions → Take snapshot

# Automated backups
- Enabled by default on RDS
- 7-day retention
- Daily snapshots
```

### Code Backup
```bash
# Git repository is the source of truth
# Hosted on GitHub

# Local backup
git clone https://github.com/Jonjos95/Project-Manager.git backup/
```

### PM2 Logs Backup
```bash
# Copy logs before flushing
cp ~/.pm2/logs/n8tive-backend-out.log ~/backups/
pm2 flush
```

---

## Monitoring

### Application Monitoring

```bash
# PM2 status
pm2 status

# Real-time monitoring
pm2 monit

# View logs
pm2 logs n8tive-backend
```

### Server Monitoring

```bash
# CPU and memory
top
htop

# Disk space
df -h

# Network connections
sudo netstat -tlnp

# System logs
sudo journalctl -xe
sudo tail -f /var/log/messages
```

### Nginx Monitoring

```bash
# Access logs (who's visiting)
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Check connections
sudo netstat -an | grep :80
```

---

## Cost Optimization (AWS Free Tier)

### Current Usage
- **EC2:** t2.micro (750 hours/month free)
- **RDS:** db.t3.micro (750 hours/month free)
- **Storage:** 20GB RDS + 30GB EBS (free)
- **Data Transfer:** 15GB/month out (free)

### Staying within Free Tier
- ✅ Keep EC2 running (1 instance only)
- ✅ Don't upgrade instance types
- ✅ Monitor data transfer
- ✅ Stop instances when not needed
- ⚠️ Free tier expires after 12 months

### Cost Monitoring
```bash
# AWS Console → Billing → Free Tier Usage
# Check monthly to avoid charges
```

---

## Additional Resources

### Documentation
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Repository Files
- `README.md` - Project overview
- `AWS-DEPLOYMENT.md` - AWS setup guide
- `FRONTEND-DEPLOYMENT.md` - Frontend hosting guide
- `QUICKSTART.md` - Quick backend setup
- `backend/README.md` - Backend API documentation

---

**Last Updated:** October 25, 2025  
**Version:** 1.0  
**Project:** N8tive.io Project Manager

---

*This document contains all commands and configurations used during the AWS deployment setup. Keep this for reference when managing your application.*

