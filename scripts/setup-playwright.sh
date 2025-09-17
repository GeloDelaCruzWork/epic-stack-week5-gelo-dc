#!/bin/bash

echo "🎭 Setting up Playwright for E2E Testing"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing project dependencies..."
npm install

# Install Playwright browsers
echo ""
echo "🌐 Installing Playwright browsers (Chromium)..."
npm run test:e2e:install

# Verify Playwright installation
echo ""
echo "🔍 Verifying Playwright installation..."
npx playwright --version

# Run a simple test to verify everything works
echo ""
echo "🧪 Running a simple test to verify setup..."
echo "   (This will open the Playwright UI)"
echo ""
echo "Press Ctrl+C to exit after verification"
npm run test:e2e:dev

echo ""
echo "✨ Playwright setup complete!"
echo ""
echo "Next steps:"
echo "1. Read PLAYWRIGHT-ONBOARDING.md for detailed instructions"
echo "2. Run 'npm run test:e2e:dev' to start testing"
echo "3. Check out existing tests in tests/e2e/ directory"