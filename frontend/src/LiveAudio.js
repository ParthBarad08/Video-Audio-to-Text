import React, { useRef, useState } from 'react';
import axios from './api';
import AudioRecorder from 'audio-recorder-polyfill';
window.MediaRecorder = window.MediaRecorder || AudioRecorder;

function LiveAudio() {
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const formData = new FormData();
        formData.append('file', e.data, 'chunk.wav');

        try {
          const res = await axios.post('/transcribe-chunk', formData);
          setTranscript((prev) => prev + ' ' + res.data.transcript);
        } catch (err) {
          console.error('Chunk upload failed:', err);
        }
      }
    };

    mediaRecorderRef.current.start(5000); // record in 5 sec chunks
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div>
      <h2>Live Audio Transcription</h2>
      <button onClick={startRecording} disabled={recording}>Start Recording</button>
      <button onClick={stopRecording} disabled={!recording}>Stop</button>
      <p><strong>Transcript:</strong> {transcript}</p>
    </div>
  );
}

import axios from './api';
import AudioRecorder from 'audio-recorder-polyfill';
window.MediaRecorder = window.MediaRecorder || AudioRecorder;

function LiveAudio() {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const formData = new FormData();
          formData.append('file', e.data, 'chunk.wav');
          try {
            const res = await axios.post('/transcribe-chunk', formData);
            setTranscript(prev => prev + ' ' + res.data.transcript);
          } catch (err) {
            console.error('Chunk upload failed:', err);
          }
        }
      };
      mediaRecorderRef.current.start(5000); // record in 5 sec chunks
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  return (
    <div>
      <h2>Live Audio Transcription</h2>
      <button onClick={startRecording} disabled={recording}>Start Recording</button>
      <button onClick={stopRecording} disabled={!recording}>Stop</button>
      <p><strong>Transcript:</strong> {transcript}</p>
    </div>
  );
}

export default LiveAudio;
