import React, { useState, useRef } from 'react'
import axios from 'axios'
import './VideoUploader.css'

function VideoUploader({ onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const uploadFile = async (file) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a video file (mp4, avi, mov, mkv, webm)')
      return
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 500MB')
      return
    }

    setError(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      onUploadComplete(response.data.job_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload video')
      setIsUploading(false)
    }
  }

  return (
    <div className="video-uploader">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="upload-progress">
            <div className="spinner"></div>
            <p>Uploading video...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3>Drop your video here</h3>
            <p className="upload-hint">or click to browse</p>
            <button className="upload-button" onClick={handleButtonClick}>
              Select video
            </button>
            <p className="upload-formats">Supported: MP4, AVI, MOV, MKV, WebM (max 500MB)</p>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

export default VideoUploader

