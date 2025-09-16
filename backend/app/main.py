from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth as auth_router
from .routers import risks as risks_router
from .routers import users as users_router
from .routers import system as system_router
from .routers import action_items as action_items_router
from .routers import config_manager as config_router
from .routers import snapshots as snapshots_router
from .routers import rbs as rbs_router
from .routers import audit as audit_router
from .core.config import settings

# Import models to ensure they are registered with SQLAlchemy
from . import models


def create_app() -> FastAPI:
	app = FastAPI(title="Risk Platform API", version="0.1.0")

	# CORS - allow origins based on configuration
	
	app.add_middleware(
		CORSMiddleware,
		allow_origins=settings.cors_origins,
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	# Routers
	app.include_router(auth_router.router)
	app.include_router(risks_router.router)
	app.include_router(users_router.router)
	app.include_router(system_router.router)
	app.include_router(action_items_router.router)
	app.include_router(config_router.router)
	app.include_router(snapshots_router.router)
	app.include_router(rbs_router.router)
	app.include_router(audit_router.router)

	# Serve built SPA if present (frontend/dist)
	# Expect dist placed at app/static/frontend
	static_root = os.path.join(os.path.dirname(__file__), "static", "frontend")
	index_file = os.path.join(static_root, "index.html")
	if os.path.exists(static_root) and os.path.exists(index_file):
		app.mount("/app", StaticFiles(directory=static_root), name="frontend")

		@app.get("/app/{full_path:path}", response_class=HTMLResponse)
		async def spa_fallback(full_path: str):
			with open(index_file, "r", encoding="utf-8") as f:
				return f.read()

	@app.get("/health")
	async def health_check() -> dict:
		return {"status": "ok"}
	
	@app.get("/debug/cors")
	async def debug_cors() -> dict:
		from .core.config import settings
		return {
			"cors_origins": settings.cors_origins,
			"environment": settings.environment,
			"is_cloud": settings.is_cloud
		}

	return app


app = create_app()


