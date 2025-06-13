from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import tempfile
import subprocess
import traceback
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'mp4', 'webm', 'ogg', 'flac', 'm4a', 'avi', 'mov'}

# Create upload directory if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Load Whisper model
try:
    print("Loading Whisper model...")
    model = whisper.load_model("base")
    print("✅ Whisper model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading Whisper model: {e}")
    model = None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_to_wav(input_path, output_path):
    """Convert audio/video file to WAV format using ffmpeg"""
    try:
        command = [
            "ffmpeg", "-i", input_path,
            "-ar", "16000",  # Whisper prefers 16kHz
            "-ac", "1",      # Mono channel
            "-y", output_path  # Overwrite output file
        ]
        
        result = subprocess.run(command, 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE, 
                              text=True)
        
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr}")
            return False
        return True
    except FileNotFoundError:
        print("❌ FFmpeg not found. Please install FFmpeg.")
        return False
    except Exception as e:
        print(f"❌ Conversion error: {e}")
        return False

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': '🎙️ Audio/Video to Text API is running!',
        'endpoints': {
            '/transcribe': 'POST - Upload audio/video file for transcription',
            '/health': 'GET - Check API health'
        }
    })

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'whisper_model': 'loaded' if model else 'not loaded'
    })

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if not model:
        return jsonify({'error': 'Whisper model not loaded'}), 500
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not supported'}), 400

    # Secure filename and save
    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    
    try:
        file.save(input_path)
        print(f"📁 File saved: {input_path}")

        # Create temporary WAV file
        wav_path = None
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
            wav_path = temp_wav.name

        # Convert to WAV if necessary
        file_ext = filename.rsplit('.', 1)[1].lower()
        if file_ext != 'wav':
            print(f"🔄 Converting {file_ext} to WAV...")
            if not convert_to_wav(input_path, wav_path):
                return jsonify({'error': 'Failed to convert audio file'}), 500
        else:
            # If already WAV, just copy
            import shutil
            shutil.copy2(input_path, wav_path)

        print(f"🎵 Processing audio file: {wav_path}")

        # Transcribe with Whisper
        result = model.transcribe(wav_path, language="en")
        transcript = result["text"].strip()
        
        print(f"✅ Transcription completed: {transcript[:100]}...")

        return jsonify({
            'success': True,
            'transcript': transcript,
            'filename': filename,
            'message': 'Transcription completed successfully!'
        })

    except Exception as e:
        print(f"❌ Transcription failed: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500

    finally:
        # Cleanup temporary files
        try:
            if os.path.exists(input_path):
                os.remove(input_path)
            if wav_path and os.path.exists(wav_path):
                os.remove(wav_path)
        except Exception as cleanup_error:
            print(f"⚠️ Cleanup error: {cleanup_error}")

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 100MB.'}), 413

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("📋 Supported file formats:", ', '.join(ALLOWED_EXTENSIONS))
    app.run(host='0.0.0.0', port=5000, debug=True)