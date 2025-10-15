#!/usr/bin/env bash
set -o errexit

echo "🔧 Installing system dependencies..."
apt-get update
apt-get install -y libreoffice python3-pip

echo "📦 Installing Node.js dependencies..."
npm install

echo "🐍 Installing Python dependencies..."
pip3 install -r requirements.txt

echo "✅ Build complete!"
