from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth as auth_router
from .routers import risks as risks_router
from .routers import users as users_router
from .routers import system as system_router
from .routers import action_items as action_items_router
from .routers import config_manager as config_router
from .core.config import settings

# Import models to ensure they are registered with SQLAlchemy
from . import models


def create_app() -> FastAPI:
	app = FastAPI(title="Risk Platform API", version="0.1.0")

	# CORS - allow origins based on configuration
	print(f"DEBUG: CORS origins configured: {settings.cors_origins}")
	print(f"DEBUG: Environment: {settings.environment}")
	print(f"DEBUG: Is cloud: {settings.is_cloud}")
	
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


