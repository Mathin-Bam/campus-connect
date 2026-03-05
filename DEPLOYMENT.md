# Free Deployment Guide

## 🚀 Recommended Stack: Vercel + Supabase + Upstash

### Why this combo?
- **Vercel**: Free hosting for Node.js APIs, GitHub integration, CDN
- **Supabase**: Free PostgreSQL database with built-in auth and real-time
- **Upstash**: Free Redis with 10,000 commands/day
- **Total Cost**: $0/month for development/small projects

---

## 📋 Step-by-Step Deployment

### 1. Setup Supabase (Database)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose organization
   - Set project name: "campus-connect"
   - Set database password
   - Choose region closest to you

3. **Get Database URL**
   - Go to Settings → Database
   - Copy the "Connection string"
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

4. **Run Migrations**
   - Go to SQL Editor
   - Run your Prisma schema or use migrations

### 2. Setup Upstash (Redis)

1. **Create Upstash Account**
   - Go to [upstash.com](https://upstash.com)
   - Sign up with GitHub

2. **Create Redis Database**
   - Click "Create Database"
   - Choose region (same as Supabase if possible)
   - Copy the Redis URL

3. **Get Redis URL**
   - Format: `redis://default:[YOUR-PASSWORD]@[YOUR-REDIS-URL]`

### 3. Setup Vercel (API)

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
   Add all required variables:
   ```
   DATABASE_URL=your_supabase_connection_string
   REDIS_URL=your_upstash_redis_url
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   PORT=3001
   CLIENT_URL=https://your-app.vercel.app
   ```

### 4. Update API for Production

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

### PlanetScale + Upstash
- **PlanetScale**: Free MySQL database
- **Upstash**: Free Redis
- **Good for**: MySQL preference

### Neon + Upstash
- **Neon**: Free PostgreSQL with branching
- **Upstash**: Free Redis
- **Good for**: Modern Postgres features

### Railway Alternative: Northflank
- **Free Tier**: 100 hours/month
- **Services**: PostgreSQL, Redis, Node.js
- **Good for**: Railway-like experience

---

## 🎯 Quick Start Commands

```bash
# Deploy to Supabase
# Use Supabase dashboard for migrations

# Deploy to Upstash
# Use Upstash dashboard for Redis setup

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
| Supabase | 500MB DB, 2GB bandwidth | 50k API calls/month |
| Upstash | 10,000 commands/day | 256MB max memory |
| Render | 750 hours/month | 15min sleep timeout |
| Neon | 3GB DB, 1GB bandwidth | 1 branch limit |

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
2. **Database Migrations**: Use Supabase SQL Editor
3. **Redis Setup**: Use Upstash dashboard for connection details
4. **CORS**: Update origins for production domains
5. **Monitoring**: Both platforms provide logs and metrics
6. **Supabase Auth**: Consider using built-in auth instead of Firebase
