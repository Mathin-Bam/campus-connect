# Supabase Setup Guide

## 🚀 Quick Setup for Campus Connect

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub
3. Click "New Project"
4. Organization: Your GitHub username
5. Project name: `campus-connect`
6. Database password: Create a strong password
7. Region: Choose closest to your users

### 2. Get Database URL
1. Go to Settings → Database
2. Scroll to "Connection string"
3. Copy the URI format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 3. Run Database Schema
1. Go to SQL Editor in Supabase
2. Click "New query"
3. Copy and paste your Prisma schema
4. Run the query to create all tables

### 4. Environment Variables for Vercel
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 5. Test Connection
Your API should now connect to Supabase PostgreSQL database!
