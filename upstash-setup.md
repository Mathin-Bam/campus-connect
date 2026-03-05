# Upstash Redis Setup Guide

## 🚀 Quick Setup for Campus Connect

### 1. Create Upstash Account
1. Go to [upstash.com](https://upstash.com)
2. Sign up with GitHub
3. Verify your email

### 2. Create Redis Database
1. Click "Create Database"
2. Database name: `campus-connect-redis`
3. Region: Choose same as Supabase if possible
4. Enable TLS: Yes (recommended)
5. Click "Create"

### 3. Get Redis Connection Details
1. Click on your database
2. Go to "Details" tab
3. Copy the "REST URL" or "Redis URL"
4. Format: `redis://default:[PASSWORD]@[HOST]:[PORT]`

### 4. Environment Variables for Vercel
```
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
```

### 5. Free Tier Limits
- 10,000 commands per day
- 256MB max memory
- Perfect for development and small apps

### 6. Test Connection
Your Socket.io Redis adapter should now work with Upstash!
