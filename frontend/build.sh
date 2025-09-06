#!/bin/bash
# Build script for Netlify
echo "Starting build process..."

# Install dependencies
npm install

# Set production API URL
export VITE_API_URL=https://riskworks.onrender.com

# Build with Vite (no TypeScript checking)
npx vite build

echo "Build completed successfully!"

