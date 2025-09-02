from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .core.config import settings


class Base(DeclarativeBase):
	pass


def get_database_connect_args():
	"""Get database connection arguments based on database type"""
	if settings.database_type == "sqlite":
		return {"check_same_thread": False}
	return {}


def create_database_engine():
	"""Create database engine based on current configuration"""
	try:
		if settings.database_type == "postgresql":
			# Prefer a pure-Python driver to avoid compilation issues.
			# Normalize URL to use pg8000 driver if not specified.
			try:
				import pg8000  # noqa: F401
			except ImportError:
				print("Warning: PostgreSQL support not available. Install with: pip install pg8000")
				print("Falling back to SQLite...")
				return create_engine(
					"sqlite:///./risk_platform.db",
					connect_args={"check_same_thread": False}
				)

			# Ensure SQLAlchemy URL specifies pg8000 driver
			db_url = settings.effective_database_url
			if db_url.startswith("postgresql://") and "+" not in db_url:
				db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
				
			return create_engine(
				db_url,
				connect_args=get_database_connect_args()
			)
		
		# Default path (SQLite or explicit driver URLs)
		return create_engine(
			settings.effective_database_url,
			connect_args=get_database_connect_args()
		)
	except Exception as e:
		# Fallback to SQLite if there's an issue
		print(f"Warning: Could not create {settings.database_type} engine: {e}")
		print("Falling back to SQLite...")
		return create_engine(
			"sqlite:///./risk_platform.db",
			connect_args={"check_same_thread": False}
		)


# Create engine lazily to avoid import issues
_engine = None
_SessionLocal = None


def get_engine():
	"""Get or create database engine"""
	global _engine
	if _engine is None:
		_engine = create_database_engine()
	return _engine


def get_session_local():
	"""Get or create session local"""
	global _SessionLocal
	if _SessionLocal is None:
		_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
	return _SessionLocal


def get_db():
	from sqlalchemy.orm import Session
	db: Session = get_session_local()()
	try:
		yield db
	finally:
		db.close()


