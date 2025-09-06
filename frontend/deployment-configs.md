# Deployment Configuration Guide

## Environment Files for Different Platforms

### Netlify (.env.netlify)

```
VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=https://riskworks.netlify.app
VITE_DEPLOYMENT_PLATFORM=netlify
```

### Vercel (.env.vercel)

```
VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=https://riskworks.vercel.app
VITE_DEPLOYMENT_PLATFORM=vercel
```

### Local (.env.local)

```
VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEPLOYMENT_PLATFORM=local
```

## Switching Process

1. **Create the appropriate .env file** for your target platform
2. **Rename it to .env** before building
3. **Deploy** - the app will automatically use the correct URLs

## Platform-Specific Build Commands

### Netlify

```bash
cp .env.netlify .env
npm run build
```

### Vercel

```bash
cp .env.vercel .env
npm run build
```

### Local

```bash
cp .env.local .env
npm run dev
```
