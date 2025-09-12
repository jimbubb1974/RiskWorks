# RiskWorks - Risk Management Platform

A modern, full-stack risk management application built with FastAPI and React. RiskWorks helps organizations identify, assess, and manage risks with an intuitive web interface and robust API.

## 🌟 Features

- **Risk Management**: Create, track, and manage risks with probability and impact assessments
- **User Management**: Multi-user system with role-based access control
- **Action Items**: Track mitigation actions and follow-ups
- **Risk Snapshots**: Historical tracking of risk changes over time
- **Reports**: Generate risk reports in multiple formats (PDF, Excel, Word)
- **Real-time Updates**: Modern React frontend with real-time data synchronization
- **Cloud Ready**: Deploy to cloud platforms with easy environment switching

## 🏗️ Architecture

### Backend (FastAPI)

- **Framework**: FastAPI with automatic API documentation
- **Database**: SQLAlchemy 2.0 with SQLite (local) / PostgreSQL (cloud via Neon.tech)
- **Authentication**: JWT-based authentication with password hashing
- **Migrations**: Alembic for database schema management
- **API**: RESTful API with comprehensive endpoints

### Frontend (React)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with modern UI components
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router for client-side navigation

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd RiskWorks
   ```

2. **Backend Setup**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python run.py
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Cloud Deployment

The application is configured for deployment on:

- **Frontend**: Netlify (primary) or Vercel
- **Backend**: Render.com
- **Database**: Neon.tech (PostgreSQL)

**Cloud URLs:**

- Frontend: https://riskworks.netlify.app
- Backend: https://riskworks.onrender.com
- Database: Neon PostgreSQL (managed cloud database)

## 📁 Project Structure

```
RiskWorks/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration and security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI application
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── run.py             # Development server
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── context/        # React context
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
├── netlify.toml            # Netlify deployment config
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

**Backend** (`.env` in backend directory):

```env
DATABASE_URL=sqlite:///./risk_platform.db
SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

**Frontend** (`.env.local` in frontend directory):

```env
VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEPLOYMENT_PLATFORM=local
```

### Environment Switching

The application includes scripts for easy environment switching:

```bash
# Switch to local development
python switch_to_local.py

# Switch to cloud deployment
python switch_to_cloud.py

# Switch frontend platform (Netlify/Vercel)
python switch_frontend_platform.py
```

## 📊 Risk Management Features

### Risk Assessment

- **Probability**: 1-5 scale rating
- **Impact**: 1-5 scale rating
- **Risk Score**: Automatically calculated (Probability × Impact)
- **Risk Level**: Categorized as Low, Medium, High, or Critical

### Risk Categories

- Operational
- Financial
- Strategic
- Compliance
- Technology
- Environmental

### Risk Status

- Open
- In Progress
- Mitigated
- Closed
- Accepted

## 🔐 Authentication & Authorization

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes and API endpoints
- User role management
- Session persistence across browser refreshes

## 📈 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Risks

- `GET /risks/` - List all risks
- `POST /risks/` - Create new risk
- `GET /risks/{id}` - Get risk details
- `PUT /risks/{id}` - Update risk
- `DELETE /risks/{id}` - Delete risk

### Users

- `GET /users/` - List users
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user

### System

- `GET /system/health` - Health check
- `GET /system/info` - System information

## 🛠️ Development

### Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Running Tests

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build

# Backend deployment
cd backend
# Deploy to your cloud platform
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the API documentation at `/docs` when running locally
- Review the codebase for implementation details
- Create an issue for bugs or feature requests

## 🔄 Version History

- **v0.1.0** - Initial release with core risk management features
- **v0.2.0** - Added action items and user management
- **v0.3.0** - Implemented risk snapshots and reporting
- **v0.4.0** - Cloud deployment configuration and environment switching

---

Built with ❤️ using FastAPI and React
