# Cheezka - Deployment & Production Guide

## Pre-Deployment Checklist

### Security
- [ ] Change JWT_SECRET to a strong, random value
- [ ] Update MONGODB_URI to production database
- [ ] Set NODE_ENV=production
- [ ] Remove console.log statements in production code
- [ ] Enable HTTPS/TLS
- [ ] Setup rate limiting
- [ ] Configure CORS for production domain only
- [ ] Use environment secrets manager

### Backend Configuration
- [ ] Create .env.production file
- [ ] Setup production MongoDB instance
- [ ] Configure SMTP for email notifications
- [ ] Setup file upload storage (AWS S3, etc.)
- [ ] Enable request logging and monitoring
- [ ] Setup error tracking (Sentry, etc.)
- [ ] Configure backup strategy for database

### Frontend Configuration
- [ ] Update VITE_API_BASE_URL to production API
- [ ] Build frontend (npm run build)
- [ ] Test build locally (npm run preview)
- [ ] Enable gzip compression
- [ ] Setup CDN for static assets
- [ ] Configure analytics

### Deployment Infrastructure
- [ ] Choose hosting provider (Heroku, AWS, DigitalOcean, etc.)
- [ ] Setup database hosting (MongoDB Atlas, etc.)
- [ ] Configure CI/CD pipeline
- [ ] Setup monitoring and alerts
- [ ] Configure backup and disaster recovery
- [ ] Setup load balancing (if needed)

## Deployment Options

### Option 1: Heroku (Easiest for Small Projects)

#### Backend
```bash
# Login to Heroku
heroku login

# Create app
heroku create cheezka-server

# Add MongoDB Atlas
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### Frontend
```bash
# Create Heroku app
heroku create cheezka-client

# Update vite.config.js for production builds
# Deploy
git push heroku main
```

### Option 2: Docker + Cloud Run (Scalable)

#### Create Docker files

**Server Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
EXPOSE 5000
CMD ["node", "index.js"]
```

**Client Dockerfile:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Deploy to Cloud Run
```bash
# Build and push server
gcloud builds submit --tag gcr.io/PROJECT_ID/cheezka-server server/
gcloud run deploy cheezka-server --image gcr.io/PROJECT_ID/cheezka-server

# Build and push client
gcloud builds submit --tag gcr.io/PROJECT_ID/cheezka-client client/
gcloud run deploy cheezka-client --image gcr.io/PROJECT_ID/cheezka-client
```

### Option 3: AWS EC2 + RDS

#### Setup EC2 Instance
```bash
# SSH into instance
ssh -i key.pem ec2-user@your-instance

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo.git
cd Cheezka

# Install dependencies
cd server && npm install
cd ../client && npm install && npm run build

# Setup environment
nano server/.env  # Add production values

# Start server with PM2
npm install -g pm2
pm2 start server/index.js --name "cheezka-api"
pm2 startup
pm2 save
```

## Environment Variables for Production

### Backend (.env.production)
```
PORT=5000
NODE_ENV=production

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cheezka

JWT_SECRET=your-very-long-random-secret-key-minimum-32-chars
JWT_EXPIRE=7d

SMTP_SERVICE=gmail
SMTP_EMAIL=notifications@yourcompany.com
SMTP_PASSWORD=your-app-specific-password

CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Production Optimizations

### Backend Optimizations
1. **Enable compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Implement caching**
   - Cache menu items (rarely change)
   - Cache user data
   - Use Redis for session storage

3. **Database optimization**
   - Add indexes on frequently queried fields
   - Use pagination for large result sets
   - Implement database connection pooling

4. **API optimization**
   - Add rate limiting
   - Implement request validation
   - Use async/await properly
   - Monitor slow queries

### Frontend Optimizations
1. **Build optimization**
   - Minification (automatic with Vite)
   - Code splitting by routes
   - Lazy load components
   - Tree-shaking unused code

2. **Runtime optimization**
   - Lazy load images
   - Implement service workers
   - Cache API responses
   - Use React.memo for expensive components

## Monitoring & Logging

### Backend Monitoring
```bash
# Using PM2
pm2 monit                    # Monitor all processes
pm2 logs cheezka-api        # View logs
pm2 describe cheezka-api    # Process details
```

### Error Tracking (Sentry)
```bash
npm install @sentry/node

# In index.js
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "your-sentry-dsn" });
app.use(Sentry.Handlers.requestHandler());
```

### Logging Strategy
- **Error logs**: All errors with stack traces
- **Access logs**: Using Morgan
- **Application logs**: Key events and state changes
- **Database logs**: Slow queries

## SSL/TLS Certificate

### Let's Encrypt (Free)
```bash
# Using Certbot
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renew
sudo certbot renew --dry-run
```

## Database Backups

### MongoDB Atlas (Cloud)
- Automatic daily backups (included)
- Manual on-demand backups available
- Restore to specific point in time

### Self-hosted MongoDB
```bash
# Manual backup
mongodump --uri "mongodb://..." --out ./backup

# Restore
mongorestore ./backup

# Automated backup script
0 2 * * * /usr/local/bin/mongodump --uri "..." --out /backups/$(date +\%Y\%m\%d)
```

## Scaling Strategies

### Phase 1: Single Server (Current)
- Single Node.js process
- Single MongoDB instance
- Frontend static files

### Phase 2: Load Balancing
- Multiple Node.js instances (PM2 cluster mode)
- Nginx as reverse proxy
- Session store (Redis)

### Phase 3: Microservices (Future)
- Separate services for orders, users, menu
- Message queue (RabbitMQ)
- API Gateway
- Database per service

## Performance Targets

### API Response Times
- Fast: < 100ms
- Acceptable: 100-500ms
- Slow: > 500ms

### Frontend Metrics
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

### Database
- Query response: < 50ms
- Connection: < 10ms
- Index usage: Check with explain()

## Maintenance Tasks

### Daily
- Monitor server health
- Check error logs
- Review failed API calls

### Weekly
- Database integrity check
- Backup verification
- Performance metrics review

### Monthly
- Security updates
- Dependency updates
- Cost analysis
- User feedback review

## Rollback Procedure

### In case of deployment failure:
```bash
# View deployment history
git log --oneline

# Rollback to previous version
git revert COMMIT_HASH
git push origin main

# Restart application
pm2 restart cheezka-api
```

## CI/CD Pipeline Example (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run build
      - run: npm run deploy
```

## Support & Troubleshooting

### Common Issues

1. **Database connection timeout**
   - Check MongoDB Atlas network access
   - Verify IP whitelist
   - Check connection string

2. **API calls failing**
   - Check CORS configuration
   - Verify API base URL
   - Check authentication token

3. **Slow performance**
   - Check database indexes
   - Monitor server resources
   - Review slow queries

4. **Deployment failure**
   - Check logs
   - Verify environment variables
   - Rollback to previous version

---

**Last Updated**: April 23, 2024
**Status**: Ready for Production Deployment

