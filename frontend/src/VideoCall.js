import React, { useRef, useState, useEffect } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import axios from './api';

const socket = io('http://localhost:5000');

function VideoCall() {
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const myVideo = useRef();
  const partnerVideo = useRef();
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    socket.emit('join');
    socket.on('your-id', id => setMyId(id));
    socket.on('signal', async ({ from, data }) => {
      if (peer) {
        peer.signal(data);
      } else {
        await answerCall(data, from);
      }
    });
  // In the p.on('stream') handler:
p.on('stream', partnerStream => {
  if (partnerVideo.current) { // ✅ Corrected (no "32" typo)
    partnerVideo.current.srcObject = partnerStream;
    partnerVideo.current.play();
  }
});

    return () => {
      socket.off('your-id');
      socket.off('signal');
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [peer]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
        myVideo.current.play();
      }

      const audioStream = new MediaStream(stream.getAudioTracks());
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const formData = new FormData();
          formData.append('file', e.data, 'chunk.wav');
          try {
            await axios.post('/transcribe-chunk', formData);
          } catch (err) {
            console.error('Chunk upload failed:', err);
          }
        }
      };
      mediaRecorder.start(5000);

      const p = new Peer({ initiator: true, trickle: false, stream });
      setPeer(p);

      p.on('signal', data => {
        if (partnerId) {
          socket.emit('signal', { to: partnerId, data });
        }
      });

      p.on('stream', partnerStream => {
        if (partnerVideo.current) {
          partner32Video.current.srcObject = partnerStream;
          partnerVideo.current.play();
        }
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      alert('Failed to access camera/microphone.');
    }
  };

  const answerCall = async (signalData, fromId) => {
    setPartnerId(fromId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
        myVideo.current.play();
      }

      const audioStream = new MediaStream(stream.getAudioTracks());
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const formData = new FormData();
          formData.append('file', e.data, 'chunk.wav');
          try {
            await axios.post('/transcribe-chunk', formData);
          } catch (err) {
            console.error('Chunk upload failed:', err);
          }
        }
      };
      mediaRecorder.start(5000);

      const p = new Peer({ initiator: false, trickle: false, stream });
      setPeer(p);

      p.on('signal', data => {
        socket.emit('signal', { to: fromId, data });
      });

      p.on('stream', partnerStream => {
        if (partnerVideo.current) {
          partnerVideo.current.srcObject = partnerStream;
          partnerVideo.current.play();
        }
      });

      p.signal(signalData);
    } catch (err) {
      console.error('Failed to answer call:', err);
      alert('Failed to access camera/microphone.');
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div>
        <input
          placeholder="Partner ID"
          value={partnerId}
          onChange={e => setPartnerId(e.target.value)}
          style={{
            padding: '0.5rem',
            marginRight: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        />
        <button
          onClick={startCall}
          style={{
            background: '#2ecc71',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Start Call
        </button>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <video
          ref={myVideo}
          autoPlay
          playsInline
          muted
          style={{ width: '200px', borderRadius: '8px', border: '2px solid #2ecc71' }}
        />
        <video
          ref={partnerVideo}
          autoPlay
          playsInline
          style={{ width: '200px', borderRadius: '8px', border: '2px solid #3498db' }}
        />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <p style={{ color: '#555' }}>Your ID: {myId}</p>
        <p style={{ color: '#555' }}>Share your ID with your partner!</p>
      </div>
    </div>
  );
}

export default VideoCall;
