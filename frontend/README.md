# RiskWorks Frontend

Modern React frontend for the RiskWorks risk management platform.

## 🏗️ Architecture

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with modern UI components
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router for client-side navigation
- **Charts**: Chart.js for interactive data visualization
- **Export**: PDFMake, XLSX, and DocX for multi-format exports

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create a `.env.local` file in the frontend directory:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_FRONTEND_URL=http://localhost:5173
   VITE_DEPLOYMENT_PLATFORM=local
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## 🎯 Key Features

### Risk Management

- **Risk Creation & Editing**: Comprehensive forms with validation
- **Risk Visualization**: Interactive charts and matrices
- **Risk Trends**: Historical analysis with Chart.js
- **Risk Scoring**: Automatic calculation and categorization

### Audit & Compliance

- **Audit Logs**: Complete change tracking
- **User Activity**: Monitor user actions
- **Change History**: Before/after value tracking
- **Export Capabilities**: Multi-format audit reports

### Reports & Analytics

- **Risk Reports**: PDF, Excel, Word exports
- **Audit Reports**: Comprehensive audit history
- **Trend Analysis**: Visual risk score trends
- **Custom Filtering**: Advanced report filtering

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

### Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Page components
├── services/          # API client services
├── types/             # TypeScript type definitions
├── context/           # React context providers
├── hooks/             # Custom React hooks
└── App.tsx            # Main application component
```

## 🚀 Deployment

The frontend is configured for deployment on:

- **Netlify** (primary)
- **Vercel** (alternative)

Environment switching scripts are available for easy deployment configuration.

---

Built with ❤️ using React and TypeScript
