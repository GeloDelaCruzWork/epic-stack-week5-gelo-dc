@echo off
echo Setting up Playwright for E2E Testing
echo ========================================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Installing project dependencies...
call npm install

echo.
echo Installing Playwright browsers (Chromium)...
call npm run test:e2e:install

echo.
echo Verifying Playwright installation...
call npx playwright --version

echo.
echo Playwright setup complete!
echo.
echo Next steps:
echo 1. Read PLAYWRIGHT-ONBOARDING.md for detailed instructions
echo 2. Run 'npm run test:e2e:dev' to start testing
echo 3. Check out existing tests in tests/e2e/ directory
echo.
echo Press any key to run a test example in UI mode...
pause
call npm run test:e2e:dev