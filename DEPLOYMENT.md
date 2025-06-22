# Alpha Corp Waitlist API - EC2 Deployment Guide

This guide will help you deploy the Alpha Corp Waitlist API on an EC2 instance with nginx reverse proxy and SSL certificate.

## Prerequisites

1. **EC2 Instance**: Ubuntu 20.04 or 22.04 LTS
2. **Domain**: `api.alphacorp.global` (or your preferred subdomain)
3. **Security Group**: Allow ports 22 (SSH), 80 (HTTP), and 443 (HTTPS)

## Step 1: Launch EC2 Instance

1. Launch a new EC2 instance with Ubuntu 20.04 or 22.04 LTS
2. Configure security group to allow:
   - SSH (Port 22) from your IP
   - HTTP (Port 80) from anywhere
   - HTTPS (Port 443) from anywhere
3. Connect to your instance via SSH

## Step 2: Upload Application Files

```bash
# On your local machine, upload the waitlist folder to EC2
scp -r waitlist/ ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

## Step 3: Run Deployment Script

```bash
# SSH into your EC2 instance
ssh ubuntu@YOUR_EC2_IP

# Navigate to the waitlist directory
cd /home/ubuntu/waitlist

# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

## Step 4: Configure DNS

1. Go to your domain registrar's DNS settings
2. Add an A record:
   - **Name**: `api`
   - **Value**: Your EC2 instance's public IP address
   - **TTL**: 300 (or default)

## Step 5: Obtain SSL Certificate

```bash
# After DNS propagation (can take up to 24 hours), run:
sudo certbot --nginx -d api.alphacorp.global
```

## Step 6: Update Frontend Configuration

Update your frontend environment variable:

```typescript
// In your frontend code
const API_URL = 'https://api.alphacorp.global/api/waitlist';
```

## Step 7: Test the Deployment

```bash
# Test the health endpoint
curl https://api.alphacorp.global/health

# Test the waitlist endpoint
curl -X POST https://api.alphacorp.global/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Service Management

### Check Service Status
```bash
sudo systemctl status alphacorp-waitlist
sudo systemctl status nginx
```

### View Logs
```bash
# Application logs
sudo journalctl -u alphacorp-waitlist -f

# Nginx logs
sudo tail -f /var/log/nginx/api.alphacorp.global.error.log
sudo tail -f /var/log/nginx/api.alphacorp.global.access.log
```

### Restart Services
```bash
sudo systemctl restart alphacorp-waitlist
sudo systemctl restart nginx
```

### Update Application
```bash
# Stop the service
sudo systemctl stop alphacorp-waitlist

# Update files
cd /home/ubuntu/alphacorp-waitlist
git pull  # or copy new files

# Install dependencies
npm install --production

# Start the service
sudo systemctl start alphacorp-waitlist
```

## SSL Certificate Renewal

Certbot will automatically renew certificates. You can test renewal with:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### CORS Issues
- Check that your frontend domain is in the allowed origins
- Verify nginx CORS headers are properly configured
- Check browser console for specific CORS errors

### Connection Issues
- Verify security group allows ports 80 and 443
- Check if the application is running: `sudo systemctl status alphacorp-waitlist`
- Check nginx configuration: `sudo nginx -t`

### SSL Issues
- Ensure DNS is properly configured and propagated
- Check certificate validity: `sudo certbot certificates`
- Verify nginx SSL configuration

## Security Considerations

1. **Firewall**: UFW is configured to allow only necessary ports
2. **SSL**: TLS 1.2 and 1.3 only, with secure cipher suites
3. **Headers**: Security headers are configured in nginx
4. **Service**: Runs as ubuntu user with restricted permissions
5. **MongoDB**: Uses connection string with authentication

## Environment Variables

The following environment variables are configured in the systemd service:

- `NODE_ENV=production`
- `PORT=5000`
- `PRODUCTION_URL=https://api.alphacorp.global`
- `Vercel_URL=https://alphacorp.global`
- `MONGODB_URI=mongodb+srv://...`

## Monitoring

Consider setting up monitoring for:
- Application uptime
- Response times
- Error rates
- SSL certificate expiration
- Disk space usage

## Backup Strategy

1. **Application**: Version control with Git
2. **Database**: MongoDB Atlas provides automatic backups
3. **Configuration**: Backup nginx and systemd configuration files
4. **SSL Certificates**: Certbot handles automatic renewal 