# 🚀 Campus Connect Deployment Guide

## ✅ Current Status
- **API**: Complete with Firebase Auth + Prisma
- **Database**: Configured for PostgreSQL (Supabase)
- **Environment**: Production-ready
- **Build**: Zero TypeScript errors

## 🎯 Quick Deploy Options

### Option 1: Render.com (Recommended)
1. Go to [render.com](https://render.com)
2. Click "New Web Service"
3. Connect GitHub repository
4. Use `render.yaml` configuration
5. Set environment variables

### Option 2: Vercel.com
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Configure build settings:
   - Root: `apps/api`
   - Build: `pnpm build`
   - Start: `pnpm start`

## 🔧 Environment Variables Required

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Redis (Upstash)
REDIS_URL=redis://default:[PASSWORD]@[REDIS-URL]:6379

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT=/path/to/firebase-service-account.json

# AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@campusconnect.com

# App Config
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-app-domain.com
```

## 🧪 Test Endpoints After Deployment

### Health Check
```bash
curl https://your-app.onrender.com/api/health
```

### Universities
```bash
curl https://your-app.onrender.com/api/universities
```

### Register User
```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mit.edu","universityId":"[UNIVERSITY_ID]","displayName":"Test User"}'
```

## 📱 Mobile App Integration

Update your mobile app to use the production API:
```typescript
const API_URL = "https://your-app.onrender.com"
```

## 🔍 Monitoring

- **Render Dashboard**: Monitor logs and performance
- **Health Endpoint**: `/api/health` for status checks
- **Error Handling**: Check logs for authentication issues

## 🎉 Next Steps

1. **Deploy API** - Choose your platform
2. **Test Endpoints** - Verify all functionality
3. **Update Mobile App** - Point to production API
4. **Monitor Performance** - Check logs and metrics

## 🆘 Troubleshooting

### Common Issues:
- **Database Connection**: Check DATABASE_URL format
- **Firebase Auth**: Verify service account path
- **Redis Connection**: Ensure REDIS_URL is correct
- **CORS Errors**: Update CLIENT_URL environment variable

### Support:
- Check Render/Vercel logs
- Verify environment variables
- Test with local database first
