# Environment Switching Guide

This guide explains how to switch between local development and cloud deployment configurations in the Risk Management Platform.

## 🌍 Overview

The platform now supports seamless switching between:

- **Local Development**: SQLite database, localhost services
- **Cloud Deployment**: PostgreSQL database, cloud-hosted services (Railway, Render, etc.)

## 🚀 Quick Start

### 1. Check Current Configuration

```bash
cd backend
python switch_env.py status
```

### 2. Switch to Local Development

```bash
python switch_env.py local
```

### 3. Switch to Cloud Deployment

```bash
# For Railway
python switch_env.py railway

# For Render
python switch_env.py render
```

## 📁 Configuration Files

### Backend Configuration

- **`backend/.env`**: Active environment configuration
- **`backend/env.example`**: Example configuration template
- **`backend/switch_env.py`**: Environment switching utility

### Frontend Configuration

- **`frontend/src/services/config.ts`**: Configuration service
- **`frontend/src/pages/Settings.tsx`**: Environment status display

## 🔧 Environment Variables

### Local Development (.env)

```bash
ENVIRONMENT=development
DATABASE_URL=sqlite:///./risk_platform.db
DATABASE_TYPE=sqlite
CLOUD_PROVIDER=local
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

### Cloud Deployment (.env)

```bash
ENVIRONMENT=production
DATABASE_TYPE=postgresql
CLOUD_PROVIDER=railway
CLOUD_DATABASE_URL=postgresql://user:pass@host:port/db
CLOUD_BACKEND_URL=https://your-api.railway.app
CLOUD_FRONTEND_URL=https://your-app.railway.app
```

## 🎯 Supported Cloud Providers

### Railway

- **Cost**: $5/month credit (covers small apps)
- **Features**: PostgreSQL included, Git-based deployment
- **Command**: `python switch_env.py railway`

### Render

- **Cost**: Free web service, PostgreSQL: free 90 days, then $7/month
- **Features**: Auto-deploy from GitHub, solid performance
- **Command**: `python switch_env.py render`

### Custom

- **Cost**: Varies
- **Features**: Full control, any cloud provider
- **Setup**: Edit `.env` file manually

## 🔄 Switching Process

### Local → Cloud

1. **Run switch command**: `python switch_env.py railway`
2. **Provide URLs**: Database and backend URLs when prompted
3. **Restart backend**: Configuration changes take effect immediately
4. **Verify**: Check Settings page for environment status

### Cloud → Local

1. **Run switch command**: `python switch_env.py local`
2. **Restart backend**: Returns to SQLite and localhost
3. **Verify**: Check Settings page for environment status

## 📊 Monitoring

### Backend Endpoints

- **`GET /system/config`**: Current configuration (authenticated)
- **`GET /system/status`**: System health and database status
- **`GET /system/ports`**: Port availability checking

### Frontend Display

- **Settings Page**: Environment configuration section
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Visual Indicators**: Environment badges and status colors

## 🛠️ Troubleshooting

### Common Issues

#### 1. Configuration Not Loading

```bash
# Check if .env file exists
ls -la backend/.env

# Create from example if missing
python switch_env.py create
```

#### 2. Database Connection Errors

```bash
# Verify database URL format
# PostgreSQL: postgresql://user:pass@host:port/db
# SQLite: sqlite:///./risk_platform.db
```

#### 3. CORS Issues

- Check `CORS_ORIGINS` in `.env`
- Ensure frontend URL is included
- Restart backend after changes

### Debug Commands

```bash
# Show current configuration
python switch_env.py status

# Check backend logs
tail -f backend/logs/app.log

# Test database connection
python -c "from app.database import engine; print(engine.url)"
```

## 🔒 Security Considerations

### Production Environment

- **Change SECRET_KEY**: Use strong, unique secret
- **Environment**: Set to `production`
- **CORS**: Restrict to production domains only
- **Database**: Use strong passwords, SSL connections

### Development Environment

- **SECRET_KEY**: Can use default for local development
- **CORS**: Allow localhost origins
- **Database**: SQLite is fine for development

## 📈 Migration Path

### Data Migration

1. **Export local data**: Use existing export features
2. **Switch to cloud**: Run `python switch_env.py railway`
3. **Import data**: Use import features with cloud database
4. **Verify**: Check data integrity

### Rollback Plan

1. **Switch back to local**: `python switch_env.py local`
2. **Restore local data**: Import from backup
3. **Verify**: Check local functionality

## 🎉 Benefits

### For Developers

- **Easy switching**: One command to change environments
- **Visual feedback**: Clear status in Settings page
- **Fallback support**: Graceful degradation if cloud unavailable

### For Deployment

- **Environment isolation**: Separate configs for dev/staging/prod
- **Cloud flexibility**: Support for multiple providers
- **Zero downtime**: Configuration changes without restart

## 🔮 Future Enhancements

### Planned Features

- **Environment profiles**: Save/load configuration sets
- **Auto-detection**: Detect cloud environment automatically
- **Health checks**: Validate cloud service availability
- **Backup automation**: Automatic data backup before switching

### Integration Ideas

- **CI/CD**: Automatic environment switching in pipelines
- **Monitoring**: Cloud service health monitoring
- **Alerts**: Notifications for configuration changes

---

## 📞 Support

If you encounter issues with environment switching:

1. **Check logs**: Backend and frontend console logs
2. **Verify config**: Use `python switch_env.py status`
3. **Test endpoints**: Check `/system/config` endpoint
4. **Review docs**: FastAPI docs at `/docs`

The environment switching feature makes it easy to develop locally and deploy to cloud with minimal configuration changes! 🚀
