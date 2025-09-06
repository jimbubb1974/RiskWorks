# 🔧 Netlify API URL Configuration Fix

## Issue

The frontend deployed at `https://68bc47a45692b986d4178d95--riskworks.netlify.app/` is still trying to connect to `localhost:8000` instead of the Render backend `https://riskworks.onrender.com`.

## Root Cause

The `VITE_API_URL` environment variable wasn't being set properly during the Netlify build process.

## Solution Applied

### 1. Updated `netlify.toml`

Added the environment variable directly in the Netlify configuration:

```toml
[build.environment]
  NODE_VERSION = "22"
  VITE_API_URL = "https://riskworks.onrender.com"
```

### 2. Updated `frontend/build.sh`

Modified the build script to use the Netlify environment variable:

```bash
# Set production API URL (use Netlify env var or fallback)
export VITE_API_URL=${VITE_API_URL:-"https://riskworks.onrender.com"}
echo "Using API URL: $VITE_API_URL"
```

### 3. Committed and Pushed Changes

- Committed the configuration changes
- Pushed to GitHub to trigger Netlify rebuild

## Expected Result

After Netlify rebuilds (should take 2-3 minutes):

1. ✅ Frontend will use `https://riskworks.onrender.com` as API URL
2. ✅ No more CORS errors
3. ✅ Login functionality will work
4. ✅ Full-stack application will be functional

## Verification

To verify the fix worked:

1. **Check Netlify build logs** - Look for "Using API URL: https://riskworks.onrender.com"
2. **Test the frontend** - Visit the Netlify URL and try to log in
3. **Check browser console** - Should see requests going to `riskworks.onrender.com` instead of `localhost:8000`

## Timeline

- **Build time:** 2-3 minutes
- **Deployment time:** 1-2 minutes
- **Total:** 3-5 minutes

## Next Steps

1. Wait for Netlify to complete the rebuild
2. Test the frontend at: https://68bc47a45692b986d4178d95--riskworks.netlify.app/
3. Try logging in - should work without CORS errors
4. Test all application features

## If Still Not Working

If the issue persists after the rebuild:

1. Check Netlify build logs for errors
2. Verify the environment variable is being set
3. Clear browser cache and try again
4. Check if there are any build warnings or errors
