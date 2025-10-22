#!/bin/bash

# Script to run the frontend development server

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Dependencies not found. Installing..."
    npm install
fi

# Run the development server
echo "Starting frontend server on http://localhost:3000"
npm run dev

