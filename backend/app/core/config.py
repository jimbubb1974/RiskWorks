from pydantic_settings import BaseSettings


class Settings(BaseSettings):
	database_url: str = "sqlite:///./risk_platform.db"
	secret_key: str = "dev-secret-change-in-production"
	algorithm: str = "HS256"
	access_token_expires_minutes: int = 60 * 24
	environment: str = "development"

	class Config:
		env_file = ".env"


settings = Settings()


