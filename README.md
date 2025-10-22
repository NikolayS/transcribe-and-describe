# Video transcribe and describe

A web application that processes videos to extract and transcribe audio using OpenAI Whisper, and describe video frames using GPT-4 Vision.

## Features

- **Video upload**: Drag-and-drop or browse to upload videos (MP4, AVI, MOV, MKV, WebM)
- **Audio transcription**: Automatic transcription with timestamps using OpenAI Whisper
- **Frame analysis**: AI-powered frame descriptions using GPT-4 Vision
- **Real-time progress**: Track processing status with live updates
- **Modern UI**: Clean, responsive interface with beautiful gradients

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- FFmpeg installed on your system
- OpenAI API key

### Installing FFmpeg

**macOS (using Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

## Setup

### 1. Clone or navigate to the repository

```bash
cd transcribe-and-describe
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Frontend setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## Running the application

You'll need two terminal windows.

### Terminal 1: Start the backend

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
python main.py
```

The backend API will start on http://localhost:8000

### Terminal 2: Start the frontend

```bash
cd frontend
npm run dev
```

The frontend will start on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Drag and drop a video file or click to browse
3. Wait for processing to complete
4. View transcription and frame descriptions in the results tabs

## API endpoints

- `POST /upload` - Upload a video file for processing
- `GET /status/{job_id}` - Get processing status
- `GET /result/{job_id}` - Get processing results
- `DELETE /job/{job_id}` - Delete a job and its results

## Configuration

### Video processing settings

Edit `backend/video_processor.py`:

```python
self.frames_per_second = 0.5  # Extract 1 frame every 2 seconds
self.max_frames = 30  # Maximum frames to process
```

### Upload limits

Edit `backend/main.py`:

```python
max_size = 500 * 1024 * 1024  # Maximum file size in bytes
```

## Architecture

- **Backend**: FastAPI (Python) - Handles video uploads, processing, and API
- **Frontend**: React + Vite - Modern web interface
- **Video processing**: FFmpeg - Audio and frame extraction
- **Transcription**: OpenAI Whisper API
- **Frame analysis**: OpenAI GPT-4 Vision API

## Cost considerations

This application uses OpenAI's paid APIs:
- **Whisper**: ~$0.006 per minute of audio
- **GPT-4 Vision**: ~$0.01 per image

A 5-minute video with 30 frames would cost approximately:
- Audio transcription: $0.03
- Frame descriptions: $0.30
- **Total**: ~$0.33

## Troubleshooting

**FFmpeg not found:**
- Ensure FFmpeg is installed and available in your PATH
- Test with: `ffmpeg -version`

**OpenAI API errors:**
- Verify your API key is correct in `.env`
- Check your API usage and billing at https://platform.openai.com/

**Port already in use:**
- Backend: Change port in `backend/main.py` (line: `uvicorn.run(app, host="0.0.0.0", port=8000)`)
- Frontend: Change port in `frontend/vite.config.js` (line: `port: 3000`)

## License

MIT

