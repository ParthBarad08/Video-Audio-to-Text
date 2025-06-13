import React, { useState, useRef } from 'react';

function UploadAudio({ onTranscriptUpdate, onError }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Supported file types
  const supportedTypes = [
    'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a',
    'audio/ogg', 'audio/flac', 'audio/webm',
    'video/mp4', 'video/avi', 'video/mov', 'video/webm'
  ];

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    if (!supportedTypes.includes(selectedFile.type) && 
        !supportedTypes.some(type => selectedFile.name.toLowerCase().endsWith(type.split('/')[1]))) {
      onError('Unsupported file type. Please select an audio or video file.');
      return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > maxSize) {
      onError('File too large. Maximum size is 100MB.');
      return;
    }

    setFile(selectedFile);
    onError(''); // Clear any previous errors
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError('Please select a file first.');
      return;
    }

    setLoading(true);
    onError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onTranscriptUpdate(result.transcript || 'No transcript available.');
        setFile(null); // Clear file after successful upload
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        onError(result.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      onError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'webm'];
    const videoExts = ['mp4', 'avi', 'mov', 'webm'];
    
    if (audioExts.includes(extension)) return '🎵';
    if (videoExts.includes(extension)) return '🎬';
    return '📄';
  };

  return (
    <div className="upload-container">
      {/* Drag and Drop Area */}
      <div 
        className={`upload-dropzone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*,.mp3,.wav,.mp4,.avi,.mov,.ogg,.flac,.m4a,.webm"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {!file ? (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <h3>Drop your file here or click to browse</h3>
            <p>Supports: MP3, WAV, MP4, AVI, MOV, OGG, FLAC, M4A, WEBM</p>
            <p className="size-limit">Maximum file size: 100MB</p>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-info">
              <div className="file-icon">{getFileIcon(file.name)}</div>
              <div className="file-details">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
                <div className="file-type">{file.type || 'Unknown type'}</div>
              </div>
            </div>
            <button 
              className="remove-file-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              ❌
            </button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && (
        <div className="upload-actions">
          <button 
            onClick={handleUpload} 
            disabled={loading}
            className="upload-btn"
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Processing...
              </>
            ) : (
              '🚀 Upload & Transcribe'
            )}
          </button>
        </div>
      )}

      {/* Supported Formats Info */}
      <div className="supported-formats">
        <details>
          <summary>📋 Supported Formats</summary>
          <div className="format-grid">
            <div className="format-category">
              <h4>🎵 Audio</h4>
              <span>MP3, WAV, OGG, FLAC, M4A, WEBM</span>
            </div>
            <div className="format-category">
              <h4>🎬 Video</h4>
              <span>MP4, AVI, MOV, WEBM</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default UploadAudio;