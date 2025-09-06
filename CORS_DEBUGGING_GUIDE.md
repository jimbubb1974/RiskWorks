# 🔍 CORS Debugging Guide

## Current Status

- ✅ **Backend CORS configured** - Both Netlify URLs are in the allowed origins
- ✅ **API URL fixed** - Frontend correctly using `https://riskworks.onrender.com`
- ❌ **Browser still showing CORS error** - Likely a caching issue

## Debug Steps

### Step 1: Check Backend CORS Configuration

The backend debug endpoint shows CORS origins are correctly configured:

```json
{
  "cors_origins": [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://68bc47a45692b986d4178d95--riskworks.netlify.app",
    "https://riskworks.netlify.app"
  ],
  "environment": "production",
  "is_cloud": true
}
```

### Step 2: Clear All Browser Caches

#### Option A: Hard Refresh

1. **Open the frontend:** https://riskworks.netlify.app
2. **Hard refresh:** `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
3. **Try logging in**

#### Option B: Clear Browser Cache Completely

1. **Open Developer Tools** (`F12`)
2. **Right-click the refresh button** (while DevTools is open)
3. **Select "Empty Cache and Hard Reload"**
4. **Try logging in**

#### Option C: Incognito/Private Mode

1. **Open a new incognito/private window**
2. **Navigate to:** https://riskworks.netlify.app
3. **Try logging in**

### Step 3: Check Network Tab

1. **Open Developer Tools** (`F12`)
2. **Go to Network tab**
3. **Try to log in**
4. **Look for the login request:**
   - **URL:** Should be `https://riskworks.onrender.com/auth/login`
   - **Status:** Should be 200 (not CORS error)
   - **Response Headers:** Should include `Access-Control-Allow-Origin`

### Step 4: Check Console for Debug Info

Look for the API configuration debug message:

```
API Configuration: {
  VITE_API_URL: "https://riskworks.onrender.com",
  PROD: true,
  API_BASE_URL: "https://riskworks.onrender.com"
}
```

## Expected Results

### If CORS is Working:

- ✅ **No CORS errors in console**
- ✅ **Login request shows 200 status**
- ✅ **Response headers include CORS headers**
- ✅ **Login functionality works**

### If Still Getting CORS Errors:

- ❌ **Check if you're using the correct URL**
- ❌ **Try a different browser**
- ❌ **Check if there are multiple Netlify sites**

## Troubleshooting

### Issue: Still getting CORS errors after clearing cache

**Solution:** The browser might be aggressively caching the CORS preflight response. Try:

1. **Different browser** (Chrome, Firefox, Edge)
2. **Mobile browser** (different user agent)
3. **Wait 5-10 minutes** for cache to expire

### Issue: Different Netlify URL

**Solution:** Make sure you're using the correct URL:

- **Primary:** https://riskworks.netlify.app
- **Backup:** https://68bc47a45692b986d4178d95--riskworks.netlify.app

### Issue: Backend not responding

**Solution:** Check if the backend is running:

- **Health check:** https://riskworks.onrender.com/health
- **Debug CORS:** https://riskworks.onrender.com/debug/cors

## Next Steps

1. **Try the debugging steps above**
2. **Let me know what you see in the Network tab**
3. **Check if the login request shows CORS headers**
4. **Try a different browser if needed**

The backend CORS is correctly configured, so this should be a browser caching issue that can be resolved with the steps above.
