import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './ProcessingStatus.css'

function ProcessingStatus({ jobId, onComplete, onCancel }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let intervalId = null

    const checkStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api'
        const response = await axios.get(`${apiUrl}/status/${jobId}`)
        setStatus(response.data)

        if (response.data.status === 'completed') {
          clearInterval(intervalId)
          // Fetch the full results
          const resultResponse = await axios.get(`${apiUrl}/result/${jobId}`)
          onComplete(resultResponse.data)
        } else if (response.data.status === 'failed') {
          clearInterval(intervalId)
          setError(response.data.message)
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to check status')
        clearInterval(intervalId)
      }
    }

    // Check immediately
    checkStatus()

    // Then check every 2 seconds
    intervalId = setInterval(checkStatus, 2000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [jobId, onComplete])

  const handleCancel = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      await axios.delete(`${apiUrl}/job/${jobId}`)
      onCancel()
    } catch (err) {
      console.error('Failed to cancel job:', err)
      onCancel()
    }
  }

  if (error) {
    return (
      <div className="processing-status error">
        <div className="error-icon">⚠️</div>
        <h3>Processing failed</h3>
        <p>{error}</p>
        <button className="cancel-button" onClick={onCancel}>
          Try again
        </button>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="processing-status">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="processing-status">
      <div className="status-header">
        <h3>Processing video</h3>
        <p className="filename">{status.filename}</p>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
        <div className="progress-text">{status.progress}%</div>
      </div>

      <div className="status-message">
        <div className="spinner small"></div>
        <p>{status.message}</p>
      </div>

      <button className="cancel-button" onClick={handleCancel}>
        Cancel
      </button>
    </div>
  )
}

export default ProcessingStatus

