# 🔧 Render Service Troubleshooting

## Current Issue

- **URL:** https://riskworks.onrender.com/
- **Error:** 503 Server Unavailable
- **Status:** Service not responding

## Possible Causes

### 1. Free Tier Sleep (Most Likely)

Render's free tier automatically puts services to sleep after 15 minutes of inactivity.

**Solution:**

- Wait 1-2 minutes for the service to wake up
- Try accessing the URL again
- The first request after sleep takes longer to respond

### 2. Deployment Failure

The service might have failed to deploy with the new environment variables.

**Check:**

- Go to [dashboard.render.com](https://dashboard.render.com)
- Find your `riskworks` service
- Check the "Events" or "Logs" tab for deployment errors

### 3. Environment Variable Issues

The new environment variables might have caused a configuration error.

**Check:**

- Verify environment variables are correctly set
- Check if the service is using the correct environment group

## Immediate Actions

### Step 1: Check Render Dashboard

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Find your `riskworks` service
3. Check the service status
4. Look at recent events/logs

### Step 2: Wake Up the Service

1. If the service is sleeping, click "Manual Deploy" or "Restart"
2. Wait for the deployment to complete
3. Try accessing the URL again

### Step 3: Verify Environment Variables

1. Go to your service settings
2. Check that the environment group is assigned
3. Verify the variables are set correctly:
   - `ENVIRONMENT=production`
   - `CLOUD_FRONTEND_URL=https://68bc47a45692b986d4178d95--riskworks.netlify.app`

## Expected Timeline

- **Wake up from sleep:** 1-2 minutes
- **Full deployment:** 3-5 minutes
- **Service ready:** 5-7 minutes total

## Next Steps

1. Check the Render dashboard for service status
2. If sleeping, wake it up
3. If failed, check logs and redeploy
4. Once running, test the frontend connection

## Test Commands

Once the service is running, test with:

```bash
curl https://riskworks.onrender.com/health
```

Should return: `{"status":"ok"}`
