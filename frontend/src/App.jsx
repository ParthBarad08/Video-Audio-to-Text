import React, { useState, useRef } from 'react';
import './App.css';
import MathBackground from './MathBackground';
import UploadAudio from './UploadAudio';


// Navigation Component
const Navigation = () => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="nav-logo">🎙️</span>
          <span className="nav-title">Team X</span>
        </div>
        <div className="nav-links">
          <a href="#upload" className="nav-link">Upload</a>
          <a href="#record" className="nav-link">Record</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>
      </div>
    </nav>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>🎙️ Team X </h4>
          
        </div>
        <div className="footer-section">
          <h5>Features</h5>
          <ul>
            <li>Live Recording</li>
            <li>File Upload</li>
            <li>AI Transcription</li>
            <li>Text Download</li>
          </ul>
        </div>
        <div className="footer-section">
          <h5>Support</h5>
          <ul>
            <li>Documentation</li>
            <li>FAQ</li>
            <li>Contact Us</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
        <div className="footer-section">
          <h5>Connect</h5>
          <div className="social-links">
            <span className="social-link">📧</span>
            <span className="social-link">📱</span>
            <span className="social-link">🌐</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-divider"></div>
        <p className="footer-credit">Made with ❤️ Team X</p>
      </div>
    </footer>
  );
};

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
      <Navigation />
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

      <Footer />
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
        }

        /* Navigation Styles */
        .navbar {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .nav-logo {
          font-size: 1.5rem;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          padding: 0.5rem 1rem;
          border-radius: 20px;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        /* Math Background */
        .math-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }

        .math-symbols {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .math-symbol {
          position: absolute;
          color: rgba(255, 255, 255, 0.1);
          font-size: 2rem;
          font-weight: bold;
          animation: float 10s infinite linear;
        }

        .symbol-0 { top: 10%; left: 10%; animation-delay: 0s; }
        .symbol-1 { top: 20%; left: 80%; animation-delay: 2s; }
        .symbol-2 { top: 60%; left: 15%; animation-delay: 4s; }
        .symbol-3 { top: 80%; left: 70%; animation-delay: 6s; }
        .symbol-4 { top: 40%; left: 90%; animation-delay: 8s; }

        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); }
          to { transform: translateY(-20px) rotate(360deg); }
        }

        /* Main Content */
        .app-content {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          position: relative;
          z-index: 2;
        }

        .app-header {
          text-align: center;
          margin-bottom: 3rem;
          color: white;
        }

        .app-header h1 {
          margin: 0.5rem 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .app-subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
          margin-top: 1rem;
        }

        /* Sections */
        .upload-section, .recording-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }

        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          margin: 2rem 0;
        }

        /* Upload Component */
        .upload-container {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
        }

        .file-input {
          display: none;
        }

        .upload-btn {
          background: linear-gradient(45deg, #ff6b6b, #ff8e53);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Recording Controls */
        .recording-controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin: 2rem 0;
        }

        .record-btn, .clear-btn {
          padding: 1rem 2rem;
          border: none;
          border-radius: 50px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .record-btn {
          background: linear-gradient(45deg, #4ecdc4, #44a08d);
          color: white;
        }

        .record-btn.recording {
          background: linear-gradient(45deg, #ff6b6b, #ee5a52);
          animation: pulse 1s infinite;
        }

        .clear-btn {
          background: linear-gradient(45deg, #ffeaa7, #fdcb6e);
          color: #2d3436;
        }

        .record-btn:hover, .clear-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .record-indicator {
          display: inline-block;
          width: 10px;
          height: 10px;
          background: #ff4757;
          border-radius: 50%;
          margin-right: 0.5rem;
          animation: blink 1s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        /* Audio Player */
        .audio-player {
          text-align: center;
          margin: 2rem 0;
        }

        .audio-control {
          width: 100%;
          max-width: 400px;
          margin-top: 1rem;
        }

        /* Loading */
        .loading-container {
          text-align: center;
          padding: 2rem;
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Error */
        .error-container {
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.5);
          border-radius: 10px;
          padding: 1rem;
          margin: 1rem 0;
          color: #ff6b6b;
          text-align: center;
        }

        /* Transcript */
        .transcript-container {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          padding: 1.5rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .transcript-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .download-btn {
          background: linear-gradient(45deg, #74b9ff, #0984e3);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .transcript-content {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 1rem;
          max-height: 300px;
          overflow-y: auto;
          margin: 1rem 0;
        }

        .transcript-content pre {
          color: white;
          font-family: 'Arial', sans-serif;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          line-height: 1.6;
        }

        .transcript-stats {
          color: rgba(255, 255, 255, 0.7);
          text-align: right;
        }

        /* Footer Styles */
        .footer {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 3rem 0 1rem;
          margin-top: auto;
          color: white;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .footer-section h4 {
          color: #74b9ff;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .footer-section h5 {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .footer-section p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
        }

        .footer-section li {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.3rem;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .footer-section li:hover {
          color: #74b9ff;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          font-size: 1.5rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .social-link:hover {
          transform: scale(1.2);
        }

        .footer-bottom {
          margin-top: 2rem;
          text-align: center;
        }

        .footer-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          margin-bottom: 1rem;
        }

        .footer-credit {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          margin: 0;
          letter-spacing: 0.5px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 1rem;
          }

          .nav-links {
            gap: 1rem;
          }

          .app-content {
            padding: 1rem;
          }

          .recording-controls {
            flex-direction: column;
            align-items: center;
          }

          .transcript-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .footer-content {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}

export default App;

// import React, { useState, useRef } from 'react';
// import './App.css';
// import MathBackground from './MathBackground';
// import UploadAudio from './UploadAudio';

// function App() {
//   const [recording, setRecording] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const [audioURL, setAudioURL] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const chunksRef = useRef([]);
//   const streamRef = useRef(null);

//   // Handle live recording functionality
//   const handleRecord = async () => {
//     if (!recording) {
//       try {
//         setError('');
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         streamRef.current = stream;
//         const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
//         setMediaRecorder(recorder);
//         chunksRef.current = [];

//         recorder.ondataavailable = e => {
//           if (e.data.size > 0) chunksRef.current.push(e.data);
//         };

//         recorder.onstop = async () => {
//           const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
//           setAudioURL(URL.createObjectURL(blob));
          
//           // Send to backend for transcription
//           const formData = new FormData();
//           formData.append('file', blob, 'recording.webm');

//           try {
//             setLoading(true);
//             const response = await fetch('http://localhost:5000/transcribe', {
//               method: 'POST',
//               body: formData,
//             });
            
//             const result = await response.json();
            
//             if (result.success) {
//               setTranscript(result.transcript || 'No transcript available.');
//             } else {
//               setError(result.error || 'Transcription failed.');
//             }
//           } catch (err) {
//             console.error('Transcription failed:', err);
//             setError('Error during transcription. Please try again.');
//           } finally {
//             setLoading(false);
//           }

//           // Clean up stream
//           if (streamRef.current) {
//             streamRef.current.getTracks().forEach(track => track.stop());
//           }
//         };

//         recorder.start();
//         setRecording(true);
//       } catch (err) {
//         console.error('Microphone access denied:', err);
//         setError('Please allow microphone access to record audio.');
//       }
//     } else {
//       if (mediaRecorder) {
//         mediaRecorder.stop();
//         setRecording(false);
//       }
//     }
//   };

//   // Download transcript as text file
//   const handleDownload = () => {
//     if (!transcript) return;
    
//     const blob = new Blob([transcript], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `transcript_${new Date().toISOString().split('T')[0]}.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   // Clear transcript and reset state
//   const handleClear = () => {
//     setTranscript('');
//     setAudioURL('');
//     setError('');
//   };

//   return (
//     <>
//       <MathBackground />
//       <div className="app-content">
//         <header className="app-header">
//           <h1>Team X Present</h1>
//           <h1>🎙️ Audio & Video to Text Converter</h1>
//           <h1> Hotal Bhageshree Naad Kariti Kaay!!</h1>
//           <p className="app-subtitle">
//             Convert your audio recordings and video files to text using AI-powered transcription
//           </p>
//         </header>

//         {/* File Upload Section */}
//         <section className="upload-section">
//           <h2>📁 Upload Audio/Video File</h2>
//           <UploadAudio onTranscriptUpdate={setTranscript} onError={setError} />
//         </section>

//         <div className="divider"></div>

//         {/* Live Recording Section */}
//         <section className="recording-section">
//           <h2>🎤 Live Audio Recording</h2>
//           <div className="recording-controls">
//             <button
//               onClick={handleRecord}
//               className={`record-btn ${recording ? 'recording' : ''}`}
//               disabled={loading}
//             >
//               {recording ? (
//                 <>
//                   <span className="record-indicator"></span>
//                   ⏹️ Stop Recording
//                 </>
//               ) : (
//                 '🎤 Start Recording'
//               )}
//             </button>
            
//             {transcript && (
//               <button onClick={handleClear} className="clear-btn">
//                 🗑️ Clear
//               </button>
//             )}
//           </div>

//           {/* Audio Playback */}
//           {audioURL && (
//             <div className="audio-player">
//               <h3>🔊 Recorded Audio</h3>
//               <audio src={audioURL} controls className="audio-control" />
//             </div>
//           )}

//           {/* Loading Indicator */}
//           {loading && (
//             <div className="loading-container">
//               <div className="spinner"></div>
//               <p>Processing audio... Please wait</p>
//             </div>
//           )}

//           {/* Error Display */}
//           {error && (
//             <div className="error-container">
//               <p>❌ {error}</p>
//             </div>
//           )}

//           {/* Transcript Display */}
//           {transcript && !loading && (
//             <div className="transcript-container">
//               <div className="transcript-header">
//                 <h3>📝 Transcript</h3>
//                 <button onClick={handleDownload} className="download-btn">
//                   ⬇️ Download
//                 </button>
//               </div>
//               <div className="transcript-content">
//                 <pre>{transcript}</pre>
//               </div>
//               <div className="transcript-stats">
//                 <small>
//                   Words: {transcript.split(/\s+/).filter(word => word.length > 0).length} | 
//                   Characters: {transcript.length}
//                 </small>
//               </div>
//             </div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }

// export default App;






















// -------------------------------------------------------





