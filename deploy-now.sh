#!/bin/bash

# Manual deployment script to AWS EC2
# Usage: ./deploy-now.sh

set -e

echo "🚀 Manual Deployment to AWS EC2"
echo "================================"
echo ""

# Get EC2 details
echo "📋 Enter your AWS details:"
read -p "EC2 Host (IP or hostname): " EC2_HOST
read -p "EC2 Username (default: ec2-user): " EC2_USER
EC2_USER=${EC2_USER:-ec2-user}
read -p "Path to SSH key (.pem file): " SSH_KEY

echo ""
echo "🔄 Deploying to $EC2_USER@$EC2_HOST..."
echo ""

# Deploy via SSH
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
    echo "📥 Pulling latest code from GitHub..."
    cd ~/Project-Manager
    git pull origin main
    
    echo "📦 Updating backend dependencies..."
    cd backend
    npm install
    pm2 restart n8tive-backend || echo "⚠️  Backend restart skipped"
    
    echo "🌐 Deploying frontend files..."
    cd ..
    chmod +x deploy-frontend.sh
    ./deploy-frontend.sh
    
    echo ""
    echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "🎉 Successfully deployed to AWS!"
echo "🌐 Visit: http://$EC2_HOST"
echo ""
echo "💡 Remember to hard refresh your browser: Cmd+Shift+R"

