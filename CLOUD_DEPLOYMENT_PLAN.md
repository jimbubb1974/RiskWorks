## RiskWorks Cloud Deployment Plan

### Current State (Done)

- **Database (Neon PostgreSQL)**
  - Connected via `psycopg` driver with SSL and channel binding
  - Migrations applied on Neon (`alembic upgrade head`)
  - Seed data created: 1 user (`test@example.com` / `password123`), 12 sample risks
- **Backend (FastAPI)**
  - Uses `settings.effective_database_url`; Alembic is configured to use the same effective URL
  - Health/status endpoints: `/health`, `/system/status`, `/system/config`
  - Requirements updated: `psycopg[binary]>=3.1` (persisted), `pg8000` optional
- **Environment Switching**
  - `.env.cloud` contains `CLOUD_DATABASE_URL` (Neon) and `CLOUD_PROVIDER=cloud`
  - `python backend/simple_env_switch.py cloud` switches active `.env`
- **Frontend**
  - Risks page supports card/table view toggle
  - Risk detail page redesigned (form-like, modern)
  - Settings page shows DB target (Neon/Local) and host

### What Remains to Deploy the App (Backend + Frontend)

#### 1) Secrets and Configuration

- **Set secrets** (do not commit):
  - `SECRET_KEY` (strong, random)
  - `CLOUD_DATABASE_URL` (Neon, psycopg, `sslmode=require&channel_binding=require`)
  - Optionally: `CLOUD_BACKEND_URL`, `CLOUD_FRONTEND_URL`
- **Environment**
  - `ENVIRONMENT=production`
  - `DATABASE_TYPE=postgresql`
  - `CLOUD_PROVIDER=cloud`

#### 2) Choose a Backend Host (Prototype-friendly)

- **Render** or **Railway** (simple) or **Fly.io** (global)
- Provide these env vars on the host:
  - `SECRET_KEY`, `CLOUD_DATABASE_URL`, `ENVIRONMENT`, `DATABASE_TYPE=postgresql`, `CLOUD_PROVIDER=cloud`
- **Start command** (typical):
  - `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Migrations**: run on deploy
  - Option A (manual step): `alembic upgrade head`
  - Option B (release command/hook): run migrations before starting the app

#### 3) CORS and URLs

- If hosting the frontend separately, set:
  - `CLOUD_FRONTEND_URL=https://your-frontend.example`
  - Add this to allowed origins (already handled by settings when cloud URL present)

#### 4) Frontend Hosting (Prototype)

- **Netlify**, **Vercel**, or **Render Static**
  - Build command: `npm ci && npm run build`
  - Output: `dist/`
  - Set API base in frontend if needed (or keep `VITE_API_URL` to backend URL)
  - Ensure `VITE_API_URL` points to your cloud backend when building for production

#### 5) Operational Basics

- **Health checks**: use `/health`
- **Connection pooling**: Neon free tiers have connection limits; consider small pool sizes
  - Example SQLAlchemy engine kwargs (if ever needed): small pool size, recycle time
- **Logging**: keep default INFO; enable SQL logs only when diagnosing
- **Backups**: Neon handles point-in-time recovery; note project settings

### Concrete Next Steps (Suggested Order)

1. **Rotate Neon password** (since it appeared in logs/chat), update `.env.cloud` `CLOUD_DATABASE_URL`.
2. **Pick a backend host** (Render/Railway). Create service, add env vars, set start command.
3. **Run migrations on the host** (`alembic upgrade head`).
4. **Deploy frontend** (Netlify/Vercel). Set `VITE_API_URL` to cloud backend URL at build time.
5. **Test end-to-end**: login, list risks, view/edit, verify CORS.
6. Optional hardening: HTTPS only, stricter CORS, rate limits, error tracking.

### Useful Commands (Local)

- Switch to cloud env (Neon):
  - `python backend/simple_env_switch.py cloud`
- Verify engine:
  - `python -c "from app.database import get_engine; print(get_engine().url)"`
- Migrations:
  - `cd backend && alembic upgrade head`
- Seed data:
  - `cd backend && python create_test_user.py && python create_sample_risks.py`

### Notes

- Keep `psycopg[binary]` in `backend/requirements.txt`.
- Avoid provider-specific features to remain portable across hosts.
- For staging, Neon branches are useful (ephemeral DBs for previews).
