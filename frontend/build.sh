#!/bin/bash
# Build script for Netlify
echo "Starting build process..."

# Install dependencies
npm install

# Set production API URL (use Netlify env var or fallback)
export VITE_API_URL=${VITE_API_URL:-"https://riskworks.onrender.com"}

echo "Using API URL: $VITE_API_URL"
echo "Environment variables:"
env | grep VITE

# Create a .env.production file for Vite
echo "VITE_API_URL=$VITE_API_URL" > .env.production
echo "Created .env.production with: VITE_API_URL=$VITE_API_URL"

# Build with Vite (no TypeScript checking)
npx vite build --mode production

echo "Build completed successfully!"

