# Free Deployment Guide

## 🚀 Recommended Stack: Vercel + Railway

### Why this combo?
- **Vercel**: Free hosting for Node.js APIs, GitHub integration, CDN
- **Railway**: Free PostgreSQL + Redis with persistent storage
- **Total Cost**: $0/month for development/small projects

---

## 📋 Step-by-Step Deployment

### 1. Setup Railway (Database + Redis)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create PostgreSQL Service**
   - Click "New Project" → "Provision PostgreSQL"
   - Note the connection URL from dashboard

3. **Create Redis Service**
   - Click "Add Service" → "Provision Redis"
   - Note the Redis URL from dashboard

4. **Environment Variables**
   ```bash
   DATABASE_URL="postgresql://postgres:password@host:port/railway"
   REDIS_URL="redis://host:port"
   ```

### 2. Setup Vercel (API)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Repository**
   - Click "New Project"
   - Select your monorepo
   - Vercel will auto-detect it's a monorepo

3. **Configure Build Settings**
   - Root Directory: `apps/api`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **Environment Variables**
   Add all required variables from Railway:
   ```
   DATABASE_URL=your_railway_db_url
   REDIS_URL=your_railway_redis_url
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   PORT=3001
   ```

### 3. Update API for Production

1. **Update CORS origins**
   ```typescript
   // In apps/api/src/index.ts
   cors: {
     origin: [
       'https://your-app.vercel.app',
       'exp://your-mobile-app'
     ],
     methods: ['GET', 'POST'],
   }
   ```

2. **Add production build script**
   ```json
   // In apps/api/package.json
   "build": "tsc && tsc-alias",
   "start": "node dist/index.js"
   ```

---

## 📱 Mobile App Deployment

### Option A: Expo EAS (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   eas build:configure
   ```

2. **Build for Production**
   ```bash
   eas build --platform all
   ```

3. **Deploy to Stores**
   - Use EAS Submit for App Store/Play Store deployment
   - Free for development builds

### Option B: Expo Go (Testing)

1. **Update app.json**
   ```json
   {
     "expo": {
       "name": "Your App",
       "slug": "your-app",
       "extra": {
         "apiUrl": "https://your-api.vercel.app"
       }
     }
   }
   ```

2. **Deploy**
   ```bash
   expo publish
   ```

---

## 🔧 Alternative Free Options

### Render.com
- **Free Tier**: 750 hours/month
- **Services**: PostgreSQL, Redis, Node.js
- **Limitation**: Sleeps after 15min inactivity

### Supabase + Vercel
- **Supabase**: Free PostgreSQL + Auth + Storage
- **Vercel**: API hosting
- **Good for**: Apps needing built-in auth

### PlanetScale + Vercel
- **PlanetScale**: Free MySQL database
- **Vercel**: API hosting
- **Good for**: MySQL preference

---

## 🎯 Quick Start Commands

```bash
# Deploy to Railway
railway login
railway init
railway up

# Deploy to Vercel
vercel --prod

# Build mobile app
cd apps/mobile
eas build --platform android
eas build --platform ios
```

---

## 📊 Free Tier Limits

| Service | Free Tier | Limitations |
|---------|------------|-------------|
| Vercel | 100GB bandwidth/month | 10s function timeout |
| Railway | $5 credit/month | Sleeps after inactivity |
| Render | 750 hours/month | 15min sleep timeout |
| Supabase | 500MB DB | 50k API calls/month |

---

## 🔄 CI/CD Setup

### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🚨 Important Notes

1. **Environment Variables**: Never commit `.env` files
2. **Database Migrations**: Run manually on Railway dashboard
3. **Health Checks**: Railway uses `/health` endpoint
4. **CORS**: Update origins for production domains
5. **Monitoring**: Both platforms provide logs and metrics
