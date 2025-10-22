import React, { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import ProcessingStatus from './components/ProcessingStatus'
import Results from './components/Results'
import './App.css'

function App() {
  const [currentJob, setCurrentJob] = useState(null)
  const [results, setResults] = useState(null)

  const handleUploadComplete = (jobId) => {
    setCurrentJob(jobId)
    setResults(null)
  }

  const handleProcessingComplete = (result) => {
    setResults(result)
  }

  const handleReset = () => {
    setCurrentJob(null)
    setResults(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Video transcribe and describe</h1>
        <p className="subtitle">Upload a video to extract transcription and AI-generated frame descriptions</p>
      </header>

      <main className="app-main">
        {!currentJob && !results && (
          <VideoUploader onUploadComplete={handleUploadComplete} />
        )}

        {currentJob && !results && (
          <ProcessingStatus 
            jobId={currentJob} 
            onComplete={handleProcessingComplete}
            onCancel={handleReset}
          />
        )}

        {results && (
          <Results 
            results={results}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by OpenAI Whisper & GPT-4 Vision</p>
      </footer>
    </div>
  )
}

export default App

