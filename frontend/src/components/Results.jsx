import React, { useState } from 'react'
import './Results.css'

function Results({ results, onReset }) {
  const [activeTab, setActiveTab] = useState('transcription')

  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="results">
      <div className="results-header">
        <h2>Processing complete</h2>
        <button className="new-video-button" onClick={onReset}>
          Process another video
        </button>
      </div>

      <div className="results-tabs">
        <button 
          className={`tab ${activeTab === 'transcription' ? 'active' : ''}`}
          onClick={() => setActiveTab('transcription')}
        >
          Transcription
        </button>
        <button 
          className={`tab ${activeTab === 'frames' ? 'active' : ''}`}
          onClick={() => setActiveTab('frames')}
        >
          Frame descriptions ({results.frames?.length || 0})
        </button>
      </div>

      <div className="results-content">
        {activeTab === 'transcription' && (
          <div className="transcription-section">
            {results.transcription ? (
              <>
                <div className="transcription-meta">
                  <span className="meta-item">
                    Language: <strong>{results.transcription.language || 'Unknown'}</strong>
                  </span>
                  {results.transcription.duration && (
                    <span className="meta-item">
                      Duration: <strong>{formatTimestamp(results.transcription.duration)}</strong>
                    </span>
                  )}
                </div>

                <div className="transcription-full">
                  <h3>Full transcription</h3>
                  <div className="text-content">
                    {results.transcription.text || 'No transcription available'}
                  </div>
                </div>

                {results.transcription.segments && results.transcription.segments.length > 0 && (
                  <div className="transcription-segments">
                    <h3>Segments</h3>
                    <div className="segments-list">
                      {results.transcription.segments.map((segment, idx) => (
                        <div key={idx} className="segment-item">
                          <div className="segment-time">
                            {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                          </div>
                          <div className="segment-text">{segment.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="no-data">No transcription available</p>
            )}
          </div>
        )}

        {activeTab === 'frames' && (
          <div className="frames-section">
            {results.frames && results.frames.length > 0 ? (
              <div className="frames-grid">
                {results.frames.map((frame, idx) => (
                  <div key={idx} className="frame-item">
                    <div className="frame-header">
                      <span className="frame-number">Frame {frame.frame_number}</span>
                      <span className="frame-timestamp">
                        {formatTimestamp(frame.timestamp)}
                      </span>
                    </div>
                    <div className="frame-description">
                      {frame.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No frames analyzed</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Results

