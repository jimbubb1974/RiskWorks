# 🔍 Netlify Deployment Verification Guide

## Current Issue

The frontend is still making requests to `localhost:8000` despite multiple deployments that should have fixed this.

## What I Just Fixed

### 1. Hardcoded Production API URL

- Updated `frontend/src/services/api.ts` to use `https://riskworks.onrender.com` in production
- Added fallback logic: `import.meta.env.PROD ? "https://riskworks.onrender.com" : "http://localhost:8000"`

### 2. Added Debug Logging

- Added console logging to show which API URL is being used
- This will help us verify the configuration

## How to Verify the Fix

### Step 1: Wait for New Deployment

- **Commit:** `110a947` - "Hardcode production API URL and add debug logging"
- **Expected time:** 2-3 minutes
- **Check Netlify dashboard** for deployment status

### Step 2: Test the Frontend

1. **Visit:** https://68bc47a45692b986d4178d95--riskworks.netlify.app/
2. **Open Developer Tools** (`F12`)
3. **Go to Console tab**
4. **Look for debug message:** "API Configuration: { VITE_API_URL: ..., PROD: true, API_BASE_URL: 'https://riskworks.onrender.com' }"

### Step 3: Test Login

1. **Try to log in**
2. **Check Network tab** - login request should go to `riskworks.onrender.com`
3. **Should work without CORS errors**

## Troubleshooting Steps

### If Still Getting localhost:8000:

#### Option 1: Check Deployment Status

1. Go to Netlify dashboard
2. Verify the latest deployment (`110a947`) is "Published" (green)
3. If it's still building, wait for it to complete

#### Option 2: Force Cache Clear

1. **Hard refresh:** `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear browser cache completely**
3. **Try incognito/private mode**

#### Option 3: Check Console Debug Output

1. **Open Developer Tools** (`F12`)
2. **Go to Console tab**
3. **Look for the debug message** - it should show:
   ```
   API Configuration: {
     VITE_API_URL: undefined,
     PROD: true,
     API_BASE_URL: "https://riskworks.onrender.com"
   }
   ```

#### Option 4: Verify Correct Deployment

1. **Check the HTML source** of the page
2. **Look for the JavaScript file names** - they should have new hashes
3. **Compare with previous deployment** - file names should be different

## Expected Results

After the new deployment:

✅ **Console shows:** `API_BASE_URL: "https://riskworks.onrender.com"`  
✅ **Network requests go to:** `riskworks.onrender.com`  
✅ **No CORS errors**  
✅ **Login works**

## If Still Not Working

If you still see `localhost:8000` after the new deployment:

1. **Check which deployment is actually live** - there might be multiple sites
2. **Verify the correct Netlify URL** - make sure you're accessing the right one
3. **Check if there are any build errors** in the Netlify logs
4. **Let me know what the console debug output shows**

## Timeline

- **New deployment:** 2-3 minutes
- **Testing:** 1-2 minutes
- **Total:** 3-5 minutes

**Wait for the new deployment to complete, then test and let me know what you see in the console!**
