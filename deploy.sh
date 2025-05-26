#!/bin/bash

# Firebase Hosting Deployment Script
# This script builds and deploys the React app to Firebase Hosting

set -e  # Exit on any error

echo "🚀 Starting Firebase Hosting deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ You're not logged in to Firebase. Please run: firebase login"
    exit 1
fi

# Check for required environment variables
if [ ! -f ".env.production" ] && [ -z "$VITE_SUPABASE_URL" ]; then
    echo "⚠️  Warning: No .env.production file found and VITE_SUPABASE_URL not set"
    echo "Please create .env.production with your environment variables or set them manually"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to Firebase
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "🎉 Deployment completed successfully!"
echo "Your app should be available at your Firebase Hosting URL" 