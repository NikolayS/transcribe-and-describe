FROM python:3.11-slim

# Install FFmpeg and other system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend code and requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the backend code
COPY backend/ ./backend/

# Expose port
EXPOSE 10000

# Change to backend directory and start the application
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]

