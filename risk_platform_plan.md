# Risk Management Platform - Clean Development Plan

A pragmatic approach to building a risk management database with FastAPI + React, focusing on simplicity and incremental growth.

## Core Philosophy
- **Start simple, grow incrementally**
- **Native Python development (no Docker initially)**
- **Rock-solid authentication first**
- **API-first design with clear contracts**
- **Easy local→cloud transition**

---

## Technology Stack

### Backend
- **FastAPI** - Modern, fast, excellent auto-docs, simple auth
- **SQLAlchemy 2.0** - Modern ORM with async support
- **Pydantic** - Data validation and serialization
- **SQLite** → **PostgreSQL** migration path
- **Alembic** - Database migrations
- **python-multipart** - File upload support
- **python-jose** - JWT tokens (simple implementation)
- **passlib** - Password hashing

### Frontend
- **React 18 + TypeScript**
- **Vite** - Fast development server
- **Tailwind CSS + shadcn/ui** - Modern, clean UI
- **React Hook Form + Zod** - Form handling and validation
- **TanStack Query** - Server state management
- **Axios** - HTTP client

### Development Tools
- **SQLite Browser** - Visual database inspection
- **FastAPI automatic docs** - `/docs` endpoint
- **React DevTools** - Frontend debugging

---

## Project Structure

```
risk-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # DB connection
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── risk.py
│   │   │   └── base.py
│   │   ├── schemas/             # Pydantic models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   └── risk.py
│   │   ├── routers/             # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   └── risks.py
│   │   ├── services/            # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   └── risk.py
│   │   └── core/
│   │       ├── __init__.py
│   │       ├── config.py
│   │       └── security.py
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── run.py                   # Development server
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API calls
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── README.md
└── .env.example
```

---

## Phase 1: Foundation (Week 1-2)

### Backend Setup
1. **Basic FastAPI app** with automatic docs
2. **SQLite database** with SQLAlchemy
3. **User model** with password hashing
4. **Authentication endpoints** (`/auth/login`, `/auth/register`)
5. **Simple JWT implementation** (no refresh tokens initially)
6. **Protected route example**

### Frontend Setup
1. **Vite + React + TypeScript** scaffold
2. **Basic routing** (login, dashboard, risks list)
3. **Authentication context** and token storage
4. **Login/register forms**
5. **Protected route wrapper**

### Acceptance Criteria
- User can register and login
- Token persists across browser refresh
- Protected pages redirect to login
- FastAPI docs show all endpoints at `/docs`

---

## Phase 2: Core Risk Management (Week 3-4)

### Risk Model
```python
class Risk(Base):
    id: int (primary key)
    title: str
    description: str (optional)
    severity: int (1-5)
    probability: int (1-5)
    status: str (open/mitigated/closed)
    owner_id: int (foreign key to User)
    created_at: datetime
    updated_at: datetime
```

### API Endpoints
- `GET /risks` - List risks with filtering
- `POST /risks` - Create risk
- `GET /risks/{id}` - Get specific risk
- `PUT /risks/{id}` - Update risk
- `DELETE /risks/{id}` - Delete risk

### Frontend Features
- **Risk list page** with basic table
- **Create/edit risk form**
- **Simple filtering** by status and severity
- **Risk detail view**

### Acceptance Criteria
- CRUD operations work end-to-end
- Only authenticated users can access
- Risk owner defaults to current user
- Form validation works on frontend and backend

---

## Phase 3: Polish & Deployment Prep (Week 5-6)

### Enhancements
- **Search functionality** (title/description)
- **Risk scoring** (severity × probability)
- **Simple dashboard** with counts and charts
- **Data export** (CSV download)
- **Audit trail** (track changes)

### Deployment Configuration
- **Environment-based config** (`.env` files)
- **Database URL switching** (SQLite local → PostgreSQL cloud)
- **Static file serving** for production
- **CORS configuration** for different origins

### Deployment Strategy
- **Local Development**: SQLite + Python/React dev servers
- **Cloud MVP**: Railway or Render with managed PostgreSQL
- **Future Scale**: AWS/GCP when enterprise features needed
- **Migration tools** to move data between environments

---

## Authentication Strategy

### Simple and Secure
1. **Password hashing** with bcrypt via passlib
2. **JWT tokens** for API authentication
3. **HTTPOnly cookies** option for web sessions
4. **Token expiration** (24 hours initially)
5. **Login throttling** (simple in-memory counter)

### No Over-Engineering
- No refresh tokens initially
- No complex role system (just authenticated/not)
- No OAuth (can add later)
- No session storage complexity

---

## Database Strategy

### Development (SQLite)
```python
# database.py
DATABASE_URL = "sqlite:///./risk_platform.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
```

### Production (PostgreSQL)
```python
# Same code, different URL
DATABASE_URL = "postgresql://user:pass@localhost/risk_platform"
engine = create_engine(DATABASE_URL)
```

### Migration Path
- Alembic migrations work with both
- Data export/import scripts
- Environment variable switches database

---

## Key Dependencies

### Backend (`requirements.txt`)
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
alembic==1.13.0
pydantic==2.5.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
```

### Frontend (`package.json`)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.8.0",
    "axios": "^1.6.0",
    "react-router-dom": "^6.18.0"
  }
}
```

---

## Development Workflow

### Getting Started
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
alembic upgrade head
python run.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Daily Development
1. **Backend changes**: Edit code, FastAPI auto-reloads
2. **Database changes**: Create migration with Alembic
3. **Frontend changes**: Vite hot-reloads automatically
4. **API testing**: Use FastAPI docs at `http://localhost:8000/docs`

---

## Local to Cloud Transition Strategy

### Two-Environment Approach
```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./risk_platform.db"
    secret_key: str = "dev-secret-change-in-production"
    environment: str = "development"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Deployment Progression
1. **Local Development**: 
   - SQLite database
   - FastAPI + React dev servers
   - Rapid iteration and testing

2. **Cloud MVP (Railway/Render)**:
   - Managed PostgreSQL database
   - Production FastAPI + built React
   - Custom domain, HTTPS automatic
   - Cost: $0-10/month

3. **Enterprise Scale (AWS/GCP)**:
   - When you need advanced features
   - Container orchestration
   - Multiple environments (dev/staging/prod)

### Platform Recommendations

**Recommended: Railway**
- $5/month credit (covers small apps)
- PostgreSQL included
- Git-based deployment  
- Easy scaling path

**Alternative: Render**
- Free web service tier
- PostgreSQL: free 90 days, then $7/month
- Auto-deploy from GitHub
- Solid performance

### Data Migration & Backup
- **Export script**: Dump all data to JSON/CSV format
- **Import script**: Load data into new database (SQLite → PostgreSQL)
- **Backup strategy**: Database dumps + file storage backup
- **Environment switching**: Single configuration variable change

---

## Error Handling Strategy

### Backend
- **Pydantic validation** for request data
- **Custom HTTP exceptions** with clear messages
- **Global exception handler** for unexpected errors
- **Structured error responses**

### Frontend
- **React Error Boundaries** for component crashes
- **TanStack Query error handling** for API calls
- **Form validation** with Zod schemas
- **User-friendly error messages**

---

## Security Checklist

### Authentication
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with expiration
- ✅ No sensitive data in tokens
- ✅ HTTPS in production (deployment concern)

### API Security
- ✅ Input validation with Pydantic
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ CORS configuration
- ✅ Rate limiting (simple implementation)

### Data Security
- ✅ No plain text passwords
- ✅ Database file permissions (SQLite)
- ✅ Environment variables for secrets
- ✅ User data isolation (owner-based filtering)

---

## Future Growth Areas

### Phase 4+ Features
- **Multi-tenancy** (organizations/teams)
- **Custom fields** for risks
- **File attachments**
- **Risk categories and tags**
- **Advanced analytics and reporting**
- **Email notifications**
- **Risk templates**
- **Bulk operations**

### Technical Scaling
- **PostgreSQL** for production
- **Redis** for caching
- **Background tasks** with Celery
- **File storage** (S3 compatible)
- **Docker** for deployment
- **API versioning**
- **Automated testing**

---

## Success Metrics

### MVP Success
- User can register, login, and stay logged in
- CRUD operations work reliably
- Data persists between sessions
- No authentication edge cases or bugs

### Phase 2 Success
- 100+ risks can be managed efficiently
- Search and filtering work smoothly
- Forms provide clear validation feedback
- API responses are fast (<500ms)

### Phase 3 Success
- Easy transition between local and cloud
- Data export/import works reliably
- Basic analytics provide value
- System feels polished and professional

---

## Development Timeline

- **Week 1**: Backend auth + frontend auth
- **Week 2**: Risk CRUD API + React forms
- **Week 3**: Polish UX + search/filtering
- **Week 4**: Dashboard + data export
- **Week 5**: Cloud deployment + migration tools
- **Week 6**: Testing + documentation

**Total: 6 weeks to full MVP**

---

## AI Assistant Instructions

### Development Approach
- **One feature at a time**: Complete backend API, then frontend UI
- **Test as you go**: Use FastAPI docs to test endpoints immediately
- **Keep it simple**: Resist over-engineering, add complexity only when needed
- **Focus on user experience**: Every feature should solve a real problem

### Code Style
- **FastAPI**: Use dependency injection, async where beneficial
- **React**: Functional components with hooks
- **TypeScript**: Strict typing, define interfaces for all API responses
- **Error handling**: Always handle the unhappy path

### Troubleshooting
- **Authentication issues**: Check token format, expiration, and header format
- **Database issues**: Use SQLite browser to inspect data directly
- **CORS issues**: Configure FastAPI CORS middleware properly
- **Type issues**: Generate TypeScript types from Pydantic schemas

This plan prioritizes working software over perfect architecture. Build, test, iterate!