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
sudo cp README.md /var/www/html/Project-Manager/
sudo cp -r components /var/www/html/Project-Manager/

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

