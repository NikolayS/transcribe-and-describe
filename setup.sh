#!/bin/bash

echo "=== Video transcribe and describe - Setup ==="
echo ""

# Check for FFmpeg
echo "Checking for FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found!"
    echo "Please install FFmpeg:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu: sudo apt install ffmpeg"
    exit 1
fi
echo "✓ FFmpeg found"

# Check for Python
echo "Checking for Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found!"
    echo "Please install Python 3.8 or higher"
    exit 1
fi
echo "✓ Python found: $(python3 --version)"

# Check for Node.js
echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js 16 or higher"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Setup backend
echo ""
echo "=== Setting up backend ==="
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your OPENAI_API_KEY"
else
    echo "✓ .env file already exists"
fi

cd ..

# Setup frontend
echo ""
echo "=== Setting up frontend ==="
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
else
    echo "✓ Node dependencies already installed"
fi

cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "1. Add your OpenAI API key to backend/.env"
echo "2. Run the backend: cd backend && ./run.sh"
echo "3. Run the frontend (in a new terminal): cd frontend && ./run.sh"
echo ""
echo "Then open http://localhost:3000 in your browser"

