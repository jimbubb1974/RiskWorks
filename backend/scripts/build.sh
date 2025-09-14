#!/usr/bin/env bash
# Build script for Render deployment

echo "🔧 Installing dependencies..."
pip install -r requirements.txt

echo "🗄️ Running database migrations..."
python -m alembic upgrade head

echo "✅ Build complete!"

