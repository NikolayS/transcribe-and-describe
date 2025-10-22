import os
import subprocess
from pathlib import Path
from typing import List, Dict, Callable, Optional
import tempfile
import base64
from datetime import timedelta
import asyncio

import openai
from openai import OpenAI


class VideoProcessor:
    """Process videos: extract audio, transcribe, extract frames, describe with LLM"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.temp_dir = Path("/tmp/video-processing")
        self.temp_dir.mkdir(exist_ok=True)
        
        # Configuration
        self.frames_per_second = 0.5  # Extract 1 frame every 2 seconds
        self.max_frames = 30  # Maximum frames to process
        
    async def process_video(
        self,
        video_path: Path,
        job_id: str,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        """
        Process video: extract audio, transcribe, extract frames, describe
        
        Args:
            video_path: Path to video file
            job_id: Unique job identifier
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary with transcription and frame descriptions
        """
        result = {
            "job_id": job_id,
            "video_filename": video_path.name,
            "transcription": None,
            "frames": []
        }
        
        # Create temporary directory for this job
        job_temp_dir = self.temp_dir / job_id
        job_temp_dir.mkdir(exist_ok=True)
        
        try:
            # Step 1: Check if video has audio and transcribe if present
            if progress_callback:
                progress_callback(20, "Checking for audio stream")
            
            has_audio = self._check_has_audio(video_path)
            
            if has_audio:
                if progress_callback:
                    progress_callback(25, "Extracting audio from video")
                
                audio_path = job_temp_dir / "audio.mp3"
                self._extract_audio(video_path, audio_path)
                
                if progress_callback:
                    progress_callback(40, "Transcribing audio")
                
                transcription = await self._transcribe_audio(audio_path)
                result["transcription"] = transcription
            else:
                if progress_callback:
                    progress_callback(40, "No audio stream found, skipping transcription")
                result["transcription"] = {
                    "text": "No audio stream found in video",
                    "language": None,
                    "duration": None,
                    "segments": []
                }
            
            # Step 2: Extract frames
            if progress_callback:
                progress_callback(50, "Extracting frames from video")
            
            frames_dir = job_temp_dir / "frames"
            frames_dir.mkdir(exist_ok=True)
            frame_paths = self._extract_frames(video_path, frames_dir)
            
            # Step 3: Describe frames with LLM
            if progress_callback:
                progress_callback(60, f"Analyzing {len(frame_paths)} frames with LLM")
            
            frame_descriptions = await self._describe_frames(
                frame_paths,
                progress_callback=lambda i, total: progress_callback(
                    60 + int(35 * i / total),
                    f"Analyzing frame {i}/{total}"
                ) if progress_callback else None
            )
            
            result["frames"] = frame_descriptions
            
            if progress_callback:
                progress_callback(95, "Finalizing results")
            
            return result
            
        finally:
            # Clean up temporary files
            self._cleanup_directory(job_temp_dir)
    
    def _check_has_audio(self, video_path: Path) -> bool:
        """Check if video has an audio stream using FFprobe"""
        try:
            cmd = [
                "ffprobe",
                "-v", "error",
                "-select_streams", "a",
                "-show_entries", "stream=codec_type",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(video_path)
            ]
            
            result = subprocess.run(cmd, check=True, capture_output=True)
            output = result.stdout.decode().strip()
            return output == "audio"
            
        except subprocess.CalledProcessError:
            return False
    
    def _extract_audio(self, video_path: Path, output_path: Path):
        """Extract audio from video using FFmpeg"""
        try:
            cmd = [
                "ffmpeg",
                "-i", str(video_path),
                "-vn",  # No video
                "-acodec", "libmp3lame",
                "-ab", "192k",
                "-ar", "44100",
                "-y",  # Overwrite output file
                str(output_path)
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to extract audio: {e.stderr.decode()}")
    
    async def _transcribe_audio(self, audio_path: Path) -> Dict:
        """Transcribe audio using OpenAI Whisper API"""
        try:
            with audio_path.open("rb") as audio_file:
                audio_data = audio_file.read()
            
            # Run in thread pool to avoid blocking
            transcript = await asyncio.to_thread(
                lambda: self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=("audio.mp3", audio_data),
                    response_format="verbose_json"
                )
            )
            
            return {
                "text": transcript.text,
                "language": transcript.language,
                "duration": transcript.duration,
                "segments": [
                    {
                        "start": seg.start,
                        "end": seg.end,
                        "text": seg.text
                    }
                    for seg in (transcript.segments or [])
                ]
            }
            
        except Exception as e:
            raise Exception(f"Failed to transcribe audio: {str(e)}")
    
    def _extract_frames(self, video_path: Path, output_dir: Path) -> List[Path]:
        """Extract frames from video using FFmpeg"""
        try:
            # First, get video duration
            duration = self._get_video_duration(video_path)
            
            # Calculate how many frames to extract
            total_frames = int(duration * self.frames_per_second)
            if total_frames > self.max_frames:
                # Adjust fps to limit frames
                self.frames_per_second = self.max_frames / duration
                total_frames = self.max_frames
            
            # Extract frames
            cmd = [
                "ffmpeg",
                "-i", str(video_path),
                "-vf", f"fps={self.frames_per_second}",
                "-vsync", "0",
                "-frame_pts", "1",
                str(output_dir / "frame_%04d.jpg")
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Get list of extracted frames
            frames = sorted(output_dir.glob("frame_*.jpg"))
            return frames
            
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to extract frames: {e.stderr.decode()}")
    
    def _get_video_duration(self, video_path: Path) -> float:
        """Get video duration in seconds using FFprobe"""
        try:
            cmd = [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(video_path)
            ]
            
            result = subprocess.run(cmd, check=True, capture_output=True)
            duration = float(result.stdout.decode().strip())
            return duration
            
        except (subprocess.CalledProcessError, ValueError) as e:
            raise Exception(f"Failed to get video duration: {str(e)}")
    
    async def _describe_frames(
        self,
        frame_paths: List[Path],
        progress_callback: Optional[Callable] = None
    ) -> List[Dict]:
        """Describe frames using OpenAI GPT-4 Vision API"""
        descriptions = []
        
        for i, frame_path in enumerate(frame_paths):
            try:
                # Read and encode image
                with frame_path.open("rb") as img_file:
                    image_data = base64.b64encode(img_file.read()).decode()
                
                # Call GPT-4 Vision API (run in thread pool to avoid blocking)
                response = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Describe what you see in this video frame in detail. Include information about people, objects, actions, text, and any notable elements."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_data}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=300
                )
                
                description = response.choices[0].message.content
                
                descriptions.append({
                    "frame_number": i + 1,
                    "frame_filename": frame_path.name,
                    "timestamp": i / self.frames_per_second,
                    "description": description
                })
                
                if progress_callback:
                    progress_callback(i + 1, len(frame_paths))
                
            except Exception as e:
                descriptions.append({
                    "frame_number": i + 1,
                    "frame_filename": frame_path.name,
                    "timestamp": i / self.frames_per_second,
                    "description": f"Error: {str(e)}"
                })
        
        return descriptions
    
    def _cleanup_directory(self, directory: Path):
        """Recursively clean up a directory"""
        try:
            if directory.exists():
                for item in directory.iterdir():
                    if item.is_dir():
                        self._cleanup_directory(item)
                    else:
                        item.unlink()
                directory.rmdir()
        except Exception as e:
            print(f"Warning: Failed to clean up {directory}: {e}")

