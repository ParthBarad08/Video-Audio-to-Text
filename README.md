# Video_text_generator# Video_text_generator

## Features
- Upload audio or video files for transcription and action point extraction
- Live audio recording and transcription
- Real-time video call with live transcription (WebRTC + Socket.IO signaling)

## Prerequisites
- Python 3.8+
- Node.js & npm
- ffmpeg (added to PATH)
- (For video call) `signaling-server.js` using Node.js

## Setup

### 1. Backend (Flask + Whisper)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
- Make sure `ffmpeg` is installed and available in your system PATH.

### 2. Frontend (React)
```bash
cd frontend/frontend
npm install
npm start
```

### 3. Signaling Server (for video calls)
```bash
# In the project root or where signaling-server.js is located
npm install socket.io
node signaling-server.js
```
- The signaling server runs on port 5001 by default.

## Usage

- **File Upload:** Use the upload form to send audio/video files for transcription.
- **Live Audio:** Use the live audio component to record and transcribe in real time.
- **Video Call:** 
  1. Start the signaling server.
  2. Open the app in two browser windows/tabs.
  3. Each user copies their ID and shares it with the other.
  4. Enter the partner's ID and click "Start Call" to connect.
  5. The transcript will update in real time as you speak.

## Notes

- The backend must be running on port 5000, frontend on 3000, and signaling server on 5001.
- Make sure CORS is enabled in Flask for local development.
- For production, secure your signaling server and backend.
