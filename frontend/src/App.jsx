import React, { useState, useRef } from 'react';
import './App.css';
import MathBackground from './MathBackground';
import UploadAudio from './UploadAudio';

function App() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // Handle live recording functionality
  const handleRecord = async () => {
    if (!recording) {
      try {
        setError('');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        setMediaRecorder(recorder);
        chunksRef.current = [];

        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioURL(URL.createObjectURL(blob));
          
          // Send to backend for transcription
          const formData = new FormData();
          formData.append('file', blob, 'recording.webm');

          try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/transcribe', {
              method: 'POST',
              body: formData,
            });
            
            const result = await response.json();
            
            if (result.success) {
              setTranscript(result.transcript || 'No transcript available.');
            } else {
              setError(result.error || 'Transcription failed.');
            }
          } catch (err) {
            console.error('Transcription failed:', err);
            setError('Error during transcription. Please try again.');
          } finally {
            setLoading(false);
          }

          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        };

        recorder.start();
        setRecording(true);
      } catch (err) {
        console.error('Microphone access denied:', err);
        setError('Please allow microphone access to record audio.');
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setRecording(false);
      }
    }
  };

  // Download transcript as text file
  const handleDownload = () => {
    if (!transcript) return;
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear transcript and reset state
  const handleClear = () => {
    setTranscript('');
    setAudioURL('');
    setError('');
  };

  return (
    <>
      <MathBackground />
      <div className="app-content">
        <header className="app-header">
          <h1>Team X Present</h1>
          <h1>🎙️ Audio & Video to Text Converter</h1>
          <h1> Hotal Bhageshree Naad Kariti Kaay!!</h1>
          <p className="app-subtitle">
            Convert your audio recordings and video files to text using AI-powered transcription
          </p>
        </header>

        {/* File Upload Section */}
        <section className="upload-section">
          <h2>📁 Upload Audio/Video File</h2>
          <UploadAudio onTranscriptUpdate={setTranscript} onError={setError} />
        </section>

        <div className="divider"></div>

        {/* Live Recording Section */}
        <section className="recording-section">
          <h2>🎤 Live Audio Recording</h2>
          <div className="recording-controls">
            <button
              onClick={handleRecord}
              className={`record-btn ${recording ? 'recording' : ''}`}
              disabled={loading}
            >
              {recording ? (
                <>
                  <span className="record-indicator"></span>
                  ⏹️ Stop Recording
                </>
              ) : (
                '🎤 Start Recording'
              )}
            </button>
            
            {transcript && (
              <button onClick={handleClear} className="clear-btn">
                🗑️ Clear
              </button>
            )}
          </div>

          {/* Audio Playback */}
          {audioURL && (
            <div className="audio-player">
              <h3>🔊 Recorded Audio</h3>
              <audio src={audioURL} controls className="audio-control" />
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Processing audio... Please wait</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-container">
              <p>❌ {error}</p>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && !loading && (
            <div className="transcript-container">
              <div className="transcript-header">
                <h3>📝 Transcript</h3>
                <button onClick={handleDownload} className="download-btn">
                  ⬇️ Download
                </button>
              </div>
              <div className="transcript-content">
                <pre>{transcript}</pre>
              </div>
              <div className="transcript-stats">
                <small>
                  Words: {transcript.split(/\s+/).filter(word => word.length > 0).length} | 
                  Characters: {transcript.length}
                </small>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default App;






















// -------------------------------------------------------





