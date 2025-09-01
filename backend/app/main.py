from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth as auth_router
from .routers import risks as risks_router
from .routers import users as users_router
from .routers import system as system_router

# Import models to ensure they are registered with SQLAlchemy
from . import models


def create_app() -> FastAPI:
	app = FastAPI(title="Risk Platform API", version="0.1.0")

	# CORS - allow local frontend during development
	origins = [
		"http://localhost:5173",
		"http://127.0.0.1:5173",
	]
	app.add_middleware(
		CORSMiddleware,
		allow_origins=origins,
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	# Routers
	app.include_router(auth_router.router)
	app.include_router(risks_router.router)
	app.include_router(users_router.router)
	app.include_router(system_router.router)

	@app.get("/health")
	async def health_check() -> dict:
		return {"status": "ok"}

	return app


app = create_app()


