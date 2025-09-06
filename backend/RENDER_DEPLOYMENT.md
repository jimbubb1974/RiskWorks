# Render Deployment Guide

## 🚀 Deploying RiskWorks Backend to Render

### Prerequisites

- GitHub repository with your code
- Render account (free tier available)
- Neon database (already configured ✅)

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Choose the repository: `RiskWorks`

### Step 3: Configure Service

- **Name**: `riskworks-backend`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt && python -m alembic upgrade head`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 4: Environment Variables

Set these environment variables in Render dashboard:

```
DATABASE_URL=postgresql+psycopg://neondb_owner:3VjDpOhvNbICGa8yloD9Km5QY862DDEd9UY1EPApdfY@ep-old-rain-adwlsd2p-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SECRET_KEY=4s8gK5-w4vbNWi15_UtKDVfwCvN4yQGN58RKqbza1iKkGSJp3_pX_Lf5s8TCGGIAmpn44svnWaWXdv4_uoh3gg
ENVIRONMENT=production
DATABASE_TYPE=postgresql
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRES_MINUTES=1440
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.onrender.com
CLOUD_PROVIDER=cloud
```

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Test the health endpoint: `https://your-service.onrender.com/health`

### Step 6: Update Frontend Configuration

Once deployed, update your frontend to use the new backend URL.

## 🔧 Troubleshooting

### Common Issues:

1. **Build fails**: Check Python version compatibility
2. **Database connection fails**: Verify DATABASE_URL format
3. **CORS errors**: Check FRONTEND_URL configuration

### Logs:

- View logs in Render dashboard
- Check build logs for dependency issues
- Monitor runtime logs for errors

## 📝 Notes

- Free tier has limitations (sleeps after inactivity)
- Consider upgrading for production use
- Monitor resource usage in dashboard

