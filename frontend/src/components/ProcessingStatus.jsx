import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './ProcessingStatus.css'

function ProcessingStatus({ jobId, onComplete, onCancel }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    let intervalId = null

    const checkStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api'
        const response = await axios.get(`${apiUrl}/status/${jobId}`)
        setStatus(response.data)

        // Also fetch logs if showing logs panel
        if (showLogs) {
          try {
            const logsResponse = await axios.get(`${apiUrl}/logs/${jobId}`)
            setLogs(logsResponse.data.logs || [])
          } catch (e) {
            // Ignore logs fetch errors
          }
        }

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
  }, [jobId, onComplete, showLogs])

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

      <div className="action-buttons">
        <button className="logs-button" onClick={() => setShowLogs(!showLogs)}>
          {showLogs ? 'Hide logs' : 'Show logs'}
        </button>
        <button className="cancel-button" onClick={handleCancel}>
          Cancel
        </button>
      </div>

      {showLogs && (
        <div className="logs-panel">
          <h4>Processing logs</h4>
          <div className="logs-content">
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} className="log-entry">{log}</div>
              ))
            ) : (
              <div className="log-entry">No logs yet...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProcessingStatus

