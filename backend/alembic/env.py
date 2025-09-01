from __future__ import with_statement

from logging.config import fileConfig
import sys
from pathlib import Path

from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure the backend package root is on sys.path so imports like `from app...` work
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import Base
from app.models import user as user_model  # noqa: F401 - ensure model is imported for metadata
from app.core.config import settings


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
	fileConfig(config.config_file_name)

# Override sqlalchemy.url from our app settings so Alembic uses the same DB
if settings.database_url:
	config.set_main_option("sqlalchemy.url", settings.database_url)

# add your model's MetaData object here
target_metadata = Base.metadata


def run_migrations_offline() -> None:
	url = config.get_main_option("sqlalchemy.url")
	context.configure(
		url=url,
		target_metadata=target_metadata,
		literal_binds=True,
		dialect_opts={"paramstyle": "named"},
	)

	with context.begin_transaction():
		context.run_migrations()


def run_migrations_online() -> None:
	connectable = engine_from_config(
		config.get_section(config.config_ini_section, {}),
		prefix="sqlalchemy.",
		poolclass=pool.NullPool,
	)

	with connectable.connect() as connection:
		context.configure(connection=connection, target_metadata=target_metadata)

		with context.begin_transaction():
			context.run_migrations()


if context.is_offline_mode():
	run_migrations_offline()
else:
	run_migrations_online()


