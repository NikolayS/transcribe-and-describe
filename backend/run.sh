#!/bin/bash

# Script to run the backend server

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with your OPENAI_API_KEY"
    echo "You can copy .env.example: cp .env.example .env"
    exit 1
fi

# Install dependencies if needed
pip install -q -r requirements.txt

# Run the server
echo "Starting backend server on http://localhost:8000"
python main.py

