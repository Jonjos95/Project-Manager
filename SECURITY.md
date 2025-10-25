# Security Guidelines

## 🔒 Production Deployment Security

This repository is configured for secure production deployment. **No sensitive information is committed to version control.**

---

## Required Configuration

### 1. GitHub Secrets

Add these secrets to your GitHub repository:

**Repository Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `EC2_HOST` | Your EC2 public IP or domain | `1.2.3.4` or `api.yourdomain.com` |
| `EC2_USERNAME` | EC2 SSH username | `ec2-user` (Amazon Linux) |
| `EC2_SSH_KEY` | Private SSH key content | Contents of your `.pem` file |

### 2. Production Frontend Configuration

Create `config.production.js` (excluded from Git):

```javascript
const PRODUCTION_CONFIG = {
    host: 'YOUR_PRODUCTION_IP_OR_DOMAIN',
    apiUrl: '/api',
    fileApiUrl: 'https://your-api-domain.com/api'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRODUCTION_CONFIG;
}
```

### 3. Backend Environment Variables

Create `backend/.env` on your server (excluded from Git):

```bash
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_secure_password
DB_NAME=your_database_name
DB_PORT=3306

# Authentication
JWT_SECRET=your_random_jwt_secret_here

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Generate secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Files Excluded from Git

The following are automatically ignored (see `.gitignore`):

- `config.production.js` - Frontend production config
- `*.env` - All environment files
- `*.pem`, `*.key` - SSH keys and certificates
- `.aws/` - AWS credentials

**Never commit these files!**

---

## Deployment Process

1. **Local Development:**
   - Use `http://localhost:3000`
   - No production config needed

2. **Production Deployment:**
   - Push to `main` branch
   - GitHub Actions automatically deploys
   - Uses secrets from GitHub (not in code)

---

## Security Checklist

### Before Going Live:

- [ ] All GitHub Secrets configured
- [ ] `config.production.js` created on server (not in Git)
- [ ] Backend `.env` file created on server (not in Git)
- [ ] Strong database password set
- [ ] JWT secret is random and secure
- [ ] SSH keys have proper permissions (chmod 400)
- [ ] EC2 security groups restrict access
- [ ] RDS is not publicly accessible
- [ ] CORS configured for your domain only
- [ ] HTTPS/SSL configured (recommended)
- [ ] Regular backups enabled

### Ongoing Security:

- [ ] Rotate JWT secrets periodically
- [ ] Update dependencies regularly (`npm audit fix`)
- [ ] Monitor CloudWatch logs for suspicious activity
- [ ] Keep system packages updated
- [ ] Review AWS Security Group rules
- [ ] Use IAM roles instead of root credentials

---

## Incident Response

If sensitive information is accidentally committed:

1. **Immediately rotate all exposed credentials**
2. **Remove from Git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch SENSITIVE_FILE" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (coordinate with team first)
4. **Update all secrets** in GitHub and on server

---

## Development vs Production

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Development** | Local files | localhost:3000 | Local MySQL |
| **Production** | AWS EC2 (Nginx) | AWS EC2 (Node.js) | AWS RDS |

---

## Additional Resources

- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Remember: Security is not a one-time setup. Review and update regularly!**

