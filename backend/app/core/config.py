from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
	# Environment
	environment: Literal["development", "staging", "production"] = "development"
	
	# Database Configuration
	database_url: str = "sqlite:///./risk_platform.db"
	database_type: Literal["sqlite", "postgresql"] = "sqlite"
	
	# Authentication
	secret_key: str = "dev-secret-change-in-production"
	algorithm: str = "HS256"
	access_token_expires_minutes: int = 60 * 24
	
	# Service URLs
	frontend_url: str = "http://localhost:5173"
	backend_url: str = "http://localhost:8000"
	
	# Cloud Configuration
	cloud_provider: Literal["local", "railway", "render", "aws", "custom"] = "local"
	cloud_database_url: str | None = None
	cloud_frontend_url: str | None = None
	cloud_backend_url: str | None = None
	
	class Config:
		env_file = ".env"
		case_sensitive = False

	@property
	def is_cloud(self) -> bool:
		"""Check if running in cloud environment"""
		return self.environment in ["staging", "production"] or self.cloud_provider != "local"
	
	@property
	def effective_database_url(self) -> str:
		"""Get the effective database URL based on environment"""
		if self.is_cloud and self.cloud_database_url:
			return self.cloud_database_url
		return self.database_url
	
	@property
	def effective_frontend_url(self) -> str:
		"""Get the effective frontend URL based on environment"""
		if self.is_cloud and self.cloud_frontend_url:
			return self.cloud_frontend_url
		return self.frontend_url
	
	@property
	def effective_backend_url(self) -> str:
		"""Get the effective backend URL based on environment"""
		if self.is_cloud and self.cloud_backend_url:
			return self.cloud_backend_url
		return self.backend_url
	
	@property
	def cors_origins(self) -> list[str]:
		"""Get CORS origins based on environment"""
		origins = [
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3000",
			"http://127.0.0.1:3000"
		]
		
		# Add cloud frontend URL if configured
		if self.is_cloud and self.cloud_frontend_url:
			origins.append(self.cloud_frontend_url)
		
		return origins


settings = Settings()


