#!/bin/bash
# Build script for Netlify
echo "Starting build process..."

# Install dependencies
npm install

# Build with Vite (no TypeScript checking)
npx vite build

echo "Build completed successfully!"
