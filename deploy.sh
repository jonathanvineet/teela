#!/bin/bash

echo "🚀 Deploying TEELA to Vercel..."
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "📝 Checking Vercel authentication..."
vercel whoami || vercel login

echo ""
echo "🔨 Building and deploying..."
echo ""

# Deploy to Vercel
# Use --prod for production deployment
# Remove --prod for preview deployment
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Your deployment URLs:"
vercel ls

echo ""
echo "🎉 TEELA is now live on Vercel!"
