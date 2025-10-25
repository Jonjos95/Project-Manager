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

