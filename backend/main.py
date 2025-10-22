from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import uuid
import shutil
from pathlib import Path
from typing import List, Dict, Optional
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from video_processor import VideoProcessor

app = FastAPI(title="Video Transcribe and Describe API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = Path("/tmp/video-uploads")
RESULTS_DIR = Path("/tmp/video-results")
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

# Store for job status
jobs_status: Dict[str, Dict] = {}

video_processor = VideoProcessor()


@app.get("/")
def read_root():
    return {"message": "Video Transcribe and Describe API", "status": "running"}


@app.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """Upload a video file for processing"""
    
    # Validate file type
    if not file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid file type. Supported: mp4, avi, mov, mkv, webm")
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    file_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Initialize job status
    jobs_status[job_id] = {
        "status": "queued",
        "filename": file.filename,
        "progress": 0,
        "message": "Video uploaded, processing queued"
    }
    
    # Start processing in background
    background_tasks.add_task(process_video_task, job_id, file_path)
    
    return {
        "job_id": job_id,
        "message": "Video uploaded successfully",
        "status": "queued"
    }


async def process_video_task(job_id: str, video_path: Path):
    """Background task to process video"""
    try:
        jobs_status[job_id]["status"] = "processing"
        jobs_status[job_id]["message"] = "Extracting audio and frames"
        jobs_status[job_id]["progress"] = 10
        
        # Process video
        result = await video_processor.process_video(
            video_path,
            job_id,
            progress_callback=lambda p, m: update_progress(job_id, p, m)
        )
        
        # Save results
        result_path = RESULTS_DIR / f"{job_id}.json"
        with result_path.open("w") as f:
            json.dump(result, f, indent=2)
        
        jobs_status[job_id]["status"] = "completed"
        jobs_status[job_id]["progress"] = 100
        jobs_status[job_id]["message"] = "Processing completed"
        jobs_status[job_id]["result"] = result
        
    except Exception as e:
        jobs_status[job_id]["status"] = "failed"
        jobs_status[job_id]["message"] = f"Processing failed: {str(e)}"
        jobs_status[job_id]["progress"] = 0
    finally:
        # Clean up uploaded file
        if video_path.exists():
            video_path.unlink()


def update_progress(job_id: str, progress: int, message: str):
    """Update job progress"""
    if job_id in jobs_status:
        jobs_status[job_id]["progress"] = progress
        jobs_status[job_id]["message"] = message


@app.get("/status/{job_id}")
def get_status(job_id: str):
    """Get processing status for a job"""
    if job_id not in jobs_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return jobs_status[job_id]


@app.get("/result/{job_id}")
def get_result(job_id: str):
    """Get processing result for a completed job"""
    if job_id not in jobs_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_status[job_id]
    
    if job["status"] != "completed":
        return {
            "status": job["status"],
            "message": "Processing not yet completed"
        }
    
    result_path = RESULTS_DIR / f"{job_id}.json"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Result file not found")
    
    with result_path.open("r") as f:
        result = json.load(f)
    
    return result


@app.delete("/job/{job_id}")
def delete_job(job_id: str):
    """Delete a job and its results"""
    if job_id not in jobs_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete result file if exists
    result_path = RESULTS_DIR / f"{job_id}.json"
    if result_path.exists():
        result_path.unlink()
    
    # Remove from status
    del jobs_status[job_id]
    
    return {"message": "Job deleted successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

