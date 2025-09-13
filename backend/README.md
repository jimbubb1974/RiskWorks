# RiskWorks Backend

FastAPI-based backend service for the RiskWorks risk management platform.

## 🏗️ Architecture

- **Framework**: FastAPI with automatic API documentation
- **Database**: SQLAlchemy 2.0 with SQLite (local) / PostgreSQL (cloud)
- **Authentication**: JWT-based authentication with password hashing
- **Migrations**: Alembic for database schema management
- **API**: RESTful API with comprehensive endpoints

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- pip (Python package manager)

### Installation

1. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**

   Create a `.env` file in the backend directory:

   ```env
   DATABASE_URL=sqlite:///./risk_platform.db
   SECRET_KEY=your-secret-key-here
   ENVIRONMENT=development
   ```

4. **Run database migrations**

   ```bash
   alembic upgrade head
   ```

5. **Start the development server**

   ```bash
   python run.py
   ```

The API will be available at `http://localhost:8000` with interactive documentation at `http://localhost:8000/docs`.

## 📁 Project Structure

```
backend/
├── app/
│   ├── core/           # Configuration and security
│   │   ├── config.py   # Environment configuration
│   │   └── security.py # JWT and password hashing
│   ├── models/         # SQLAlchemy database models
│   │   ├── base.py     # Base model class
│   │   ├── user.py     # User model
│   │   ├── risk.py     # Risk model
│   │   ├── action_item.py # Action item model
│   │   ├── snapshot.py # Snapshot model
│   │   └── audit_log.py # Audit log model
│   ├── schemas/        # Pydantic schemas for API
│   │   ├── user.py     # User schemas
│   │   ├── risk.py     # Risk schemas
│   │   ├── action_item.py # Action item schemas
│   │   ├── snapshot.py # Snapshot schemas
│   │   └── audit.py    # Audit log schemas
│   ├── routers/        # API endpoint routers
│   │   ├── auth.py     # Authentication endpoints
│   │   ├── users.py    # User management endpoints
│   │   ├── risks.py    # Risk management endpoints
│   │   ├── action_items.py # Action item endpoints
│   │   ├── snapshots.py # Snapshot endpoints
│   │   ├── audit.py    # Audit log endpoints
│   │   ├── system.py   # System health endpoints
│   │   └── config_manager.py # Configuration endpoints
│   ├── services/       # Business logic layer
│   │   ├── auth.py     # Authentication services
│   │   ├── risk.py     # Risk management services
│   │   ├── action_items.py # Action item services
│   │   ├── snapshot.py # Snapshot services
│   │   └── audit.py    # Audit logging services
│   ├── database.py     # Database connection and session management
│   └── main.py         # FastAPI application entry point
├── alembic/            # Database migrations
│   ├── versions/       # Migration files
│   ├── env.py          # Alembic environment configuration
│   └── script.py.mako  # Migration template
├── requirements.txt    # Python dependencies
├── run.py             # Development server script
└── README.md          # This file
```

## 🔧 Configuration

### Environment Variables

| Variable       | Description                          | Default                        | Required |
| -------------- | ------------------------------------ | ------------------------------ | -------- |
| `DATABASE_URL` | Database connection string           | `sqlite:///./risk_platform.db` | Yes      |
| `SECRET_KEY`   | JWT secret key                       | -                              | Yes      |
| `ENVIRONMENT`  | Environment (development/production) | `development`                  | No       |
| `CORS_ORIGINS` | Allowed CORS origins                 | `["http://localhost:5173"]`    | No       |

### Database Configuration

**Local Development (SQLite)**

```env
DATABASE_URL=sqlite:///./risk_platform.db
```

**Cloud Production (PostgreSQL)**

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## 📊 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Users

- `GET /users/` - List all users
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Risks

- `GET /risks/` - List all risks
- `POST /risks/` - Create new risk
- `GET /risks/{id}` - Get risk details
- `PUT /risks/{id}` - Update risk
- `DELETE /risks/{id}` - Delete risk

### Action Items

- `GET /action-items/` - List all action items
- `POST /action-items/` - Create new action item
- `GET /action-items/{id}` - Get action item details
- `PUT /action-items/{id}` - Update action item
- `DELETE /action-items/{id}` - Delete action item

### Snapshots

- `GET /snapshots/` - List all snapshots
- `POST /snapshots/` - Create new snapshot
- `GET /snapshots/{id}` - Get snapshot details
- `DELETE /snapshots/{id}` - Delete snapshot
- `POST /snapshots/{id}/restore` - Restore snapshot

### Audit Logs

- `GET /audit/logs` - Get audit logs with filtering
- `GET /audit/risks/{id}/trail` - Get risk audit trail
- `GET /audit/action-items/{id}/trail` - Get action item audit trail
- `GET /audit/risks/{id}/trend` - Get risk trend data

### System

- `GET /system/health` - Health check
- `GET /system/info` - System information

## 🔐 Authentication & Security

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Login**: Send credentials to `/auth/login`
2. **Token**: Receive JWT token in response
3. **Authorization**: Include token in `Authorization: Bearer <token>` header
4. **Logout**: Send token to `/auth/logout` to invalidate

### Password Security

- Passwords are hashed using bcrypt
- Minimum password requirements enforced
- Password reset functionality available

### CORS Configuration

CORS is configured to allow requests from:

- `http://localhost:5173` (local frontend)
- `https://riskworks.netlify.app` (production frontend)

## 🗄️ Database

### Models

**User Model**

- ID, email, hashed password
- Role-based permissions
- Created/updated timestamps

**Risk Model**

- Risk details (name, description, probability, impact)
- Calculated risk score and level
- Status tracking
- Audit trail integration

**Action Item Model**

- Mitigation actions linked to risks
- Status and priority tracking
- Due dates and assignments

**Audit Log Model**

- Complete change tracking
- User attribution
- Timestamp and IP logging
- Change details (before/after values)

### Migrations

Database schema changes are managed with Alembic:

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=app

# Run specific test file
python -m pytest tests/test_auth.py
```

### Test Structure

```
tests/
├── test_auth.py        # Authentication tests
├── test_users.py       # User management tests
├── test_risks.py       # Risk management tests
├── test_action_items.py # Action item tests
├── test_audit.py       # Audit logging tests
└── conftest.py         # Test configuration
```

## 🚀 Deployment

### Local Development

```bash
python run.py
```

### Production Deployment

1. **Set environment variables**
2. **Run database migrations**
3. **Start with production WSGI server**

```bash
# Using Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Using Uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔍 Monitoring & Logging

### Health Checks

- `GET /system/health` - Basic health check
- `GET /system/info` - Detailed system information

### Logging

- Structured logging with timestamps
- Request/response logging
- Error tracking and reporting
- Audit trail for all changes

## 🛠️ Development

### Code Style

- Follow PEP 8 guidelines
- Use type hints throughout
- Document all functions and classes
- Write comprehensive tests

### Adding New Features

1. Create database model in `app/models/`
2. Create Pydantic schemas in `app/schemas/`
3. Implement business logic in `app/services/`
4. Create API endpoints in `app/routers/`
5. Add database migration
6. Write tests
7. Update documentation

## 📝 API Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**

- Check `DATABASE_URL` environment variable
- Ensure database is running and accessible
- Verify connection string format

**Authentication Issues**

- Verify `SECRET_KEY` is set
- Check token expiration
- Ensure proper CORS configuration

**Migration Errors**

- Check database permissions
- Verify migration files are valid
- Run migrations in correct order

### Debug Mode

Enable debug mode by setting:

```env
ENVIRONMENT=development
```

This enables:

- Detailed error messages
- SQL query logging
- Development-specific features

---

Built with ❤️ using FastAPI
