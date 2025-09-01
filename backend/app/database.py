from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .core.config import settings


class Base(DeclarativeBase):
	pass


engine = create_engine(settings.database_url, connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
	from sqlalchemy.orm import Session
	db: Session = SessionLocal()
	try:
		yield db
	finally:
		db.close()


