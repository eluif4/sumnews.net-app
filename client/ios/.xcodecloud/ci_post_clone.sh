#!/bin/sh

echo "⚙️ Installing Node..."
brew install node@18
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"

echo "📦 Installing NPM packages..."
npm ci

echo "🛠 Building Vue app..."
npm run build

echo "🔄 Syncing Capacitor..."
npx cap sync ios

echo "📦 Installing CocoaPods..."
cd ios/App
pod install