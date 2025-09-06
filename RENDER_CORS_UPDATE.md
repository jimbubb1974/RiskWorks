# 🔧 Render CORS Configuration Update

## Issue

The frontend deployed at `https://68bc47a45692b986d4178d95--riskworks.netlify.app/` cannot connect to the backend due to CORS policy blocking requests from the Netlify domain.

## Solution

Update the Render environment variables to allow CORS requests from the Netlify frontend.

## Steps to Fix

### 1. Go to Render Dashboard

- Visit: https://render.com/dashboard
- Find your `riskworks` service
- Click on it to open the service details

### 2. Update Environment Variables

In the Render service settings, add/update these environment variables:

```
ENVIRONMENT=production
CLOUD_FRONTEND_URL=https://68bc47a45692b986d4178d95--riskworks.netlify.app
```

### 3. Redeploy

- After updating the environment variables, Render will automatically redeploy
- Wait for the deployment to complete

### 4. Test

- Visit: https://68bc47a45692b986d4178d95--riskworks.netlify.app/
- Try to log in
- The CORS error should be resolved

## What This Does

1. **Sets environment to production** - This triggers the CORS configuration to include the Netlify URL
2. **Adds Netlify URL to CORS origins** - The backend will now accept requests from your frontend
3. **Enables full-stack communication** - Frontend can now successfully communicate with backend

## Expected Result

After this update:

- ✅ Frontend can connect to backend
- ✅ Login functionality works
- ✅ All API calls succeed
- ✅ Full-stack application is functional

## Verification

You can verify the CORS configuration is working by:

1. Opening browser dev tools
2. Going to the Network tab
3. Attempting to log in
4. The login request should succeed (200 status) instead of failing with CORS error
