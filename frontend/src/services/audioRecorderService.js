/**
 * AudioRecorderService - Service for recording audio using MediaRecorder API
 * Records audio from the user's microphone during video calls
 */

class AudioRecorderService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioStream = null;
    this.isRecording = false;
    this.startTime = null;
    this.onDataAvailableCallback = null;
    this.onStopCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * Request microphone access and initialize MediaRecorder
   * @param {Object} options - Recording options
   * @param {string} options.mimeType - MIME type for recording (default: 'audio/webm')
   * @param {number} options.audioBitsPerSecond - Audio bitrate
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Get supported MIME types
      const mimeType = options.mimeType || this.getSupportedMimeType();
      
      // Create MediaRecorder
      const recorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000
      };

      this.mediaRecorder = new MediaRecorder(this.audioStream, recorderOptions);
      
      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          if (this.onDataAvailableCallback) {
            this.onDataAvailableCallback(event.data);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        if (this.onStopCallback) {
          const audioBlob = this.getAudioBlob();
          const duration = this.getDuration();
          this.onStopCallback(audioBlob, duration);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error || new Error('Recording error'));
        }
      };

      return true;
    } catch (error) {
      console.error('Error initializing audio recorder:', error);
      throw new Error(`Impossible d'accéder au microphone: ${error.message}`);
    }
  }

  /**
   * Get the best supported MIME type for audio recording
   * @returns {string} MIME type
   */
  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback to default
    return 'audio/webm';
  }

  /**
   * Start recording audio
   * @param {number} timeslice - Time slice in milliseconds for data chunks
   */
  startRecording(timeslice = 1000) {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('Recording already in progress');
      return;
    }

    this.audioChunks = [];
    this.startTime = Date.now();
    this.isRecording = true;

    // Start recording with timeslice for chunked data
    if (timeslice > 0) {
      this.mediaRecorder.start(timeslice);
    } else {
      this.mediaRecorder.start();
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) {
      console.warn('No active recording to stop');
      return;
    }

    this.mediaRecorder.stop();
    this.stopTracks();
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Get the recorded audio as a Blob
   * @returns {Blob} Audio blob
   */
  getAudioBlob() {
    if (this.audioChunks.length === 0) {
      return null;
    }
    return new Blob(this.audioChunks, { type: this.getSupportedMimeType() });
  }

  /**
   * Get recording duration in seconds
   * @returns {number} Duration in seconds
   */
  getDuration() {
    if (!this.startTime) {
      return 0;
    }
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get formatted duration string (MM:SS)
   * @returns {string} Formatted duration
   */
  getFormattedDuration() {
    const seconds = this.getDuration();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Stop all audio tracks
   */
  stopTracks() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => {
        track.stop();
      });
      this.audioStream = null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopRecording();
    this.stopTracks();
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.startTime = null;
  }

  /**
   * Set callback for data available events
   * @param {Function} callback - Callback function
   */
  onDataAvailable(callback) {
    this.onDataAvailableCallback = callback;
  }

  /**
   * Set callback for stop events
   * @param {Function} callback - Callback function
   */
  onStop(callback) {
    this.onStopCallback = callback;
  }

  /**
   * Set callback for error events
   * @param {Function} callback - Callback function
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * Check if MediaRecorder is supported
   * @returns {boolean} True if supported
   */
  static isSupported() {
    return typeof MediaRecorder !== 'undefined' && 
           typeof navigator !== 'undefined' && 
           navigator.mediaDevices && 
           navigator.mediaDevices.getUserMedia;
  }
}

export default AudioRecorderService;





