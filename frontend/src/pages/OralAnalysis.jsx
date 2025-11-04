import { useState } from 'react';
import './Analysis.css';

const OralAnalysis = ({ userEmail }) => {
  const [recording, setRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate transcription and analysis
    // TODO: Implement real TTS transcription with Google Meet integration
    setTimeout(() => {
      setTranscription(
        'Here is the simulated transcription of your audio recording. ' +
        'The real transcription will be available after Google Meet integration.'
      );
      setAnalysisResult(
        '📊 Oral production analysis:\n\n' +
        '✅ Strengths:\n' +
        '- Good overall pronunciation\n' +
        '- Satisfactory fluency\n\n' +
        '⚠️ Areas for improvement:\n' +
        '- Work on liaisons\n' +
        '- Pay attention to tonic accents\n\n' +
        '💡 Recommendations:\n' +
        '- Practice reading aloud\n' +
        '- Listen to French podcasts'
      );
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="analysis-page">
      <div className="page-background">
        <div className="page-gradient"></div>
        <div className="page-pattern"></div>
      </div>
      
      <div className="page-container">
        <div className="page-header">
          <div className="page-badge">
            <div className="badge-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
              </svg>
            </div>
            <span>Voice analysis</span>
          </div>
          
          <h1 className="page-title">
            <span className="gradient-text">Oral Production</span> Analysis
          </h1>
          
          <p className="page-description">
            Record or import an audio file for a comprehensive analysis 
            of your spoken French with artificial intelligence.
          </p>
        </div>

        <div className="analysis-grid">
          {/* Upload/Record Section */}
          <div className="analysis-section">
            <div className="card">
              <div className="card-header">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                </div>
                <h2 className="card-title">Audio Recording</h2>
                <p className="card-subtitle">Import or record your oral production</p>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    {error}
                  </div>
                )}

                <div className="audio-upload">
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                    </svg>
                  </div>
                  <h3>Import an audio file</h3>
                  <p className="text-secondary">
                    Accepted formats: MP3, WAV, M4A
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="file-input"
                    id="audio-file"
                  />
                  <label htmlFor="audio-file" className="btn btn-secondary">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    Choose a file
                  </label>
                  
                  {audioFile && (
                    <div className="file-selected">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      File selected: {audioFile.name}
                    </div>
                  )}
                </div>

                <div className="divider">
                  <span>or</span>
                </div>

                <div className="recording-section">
                  <button
                    className={`btn ${recording ? 'btn-danger' : 'btn-primary'} btn-lg w-full`}
                    onClick={() => setRecording(!recording)}
                  >
                    {recording ? (
                      <>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        Stop recording
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                        </svg>
                        Start recording
                      </>
                    )}
                  </button>
                  
                  {recording && (
                    <div className="recording-indicator">
                      <div className="recording-dot"></div>
                      <span>Recording in progress...</span>
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-success btn-lg w-full mt-4"
                  onClick={handleAnalyze}
                  disabled={!audioFile || loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Analysis in progress...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                      </svg>
                      Transcribe and Analyze
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Google Meet Integration Notice */}
            <div className="card mt-4 integration-notice">
              <div className="card-header">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
                  </svg>
                </div>
                <h3 className="card-title">Google Meet Integration</h3>
                <p className="card-subtitle">Advanced features in development</p>
              </div>
              <div className="card-body">
                <div className="feature-list">
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Automatic transcription of Google Meet meetings</span>
                  </div>
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Real-time analysis of your oral productions</span>
                  </div>
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>TTS calibration specialized for French as a foreign language</span>
                  </div>
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Automatic saving of transcriptions</span>
                  </div>
                </div>
                <div className="badge badge-planned">Phase 4-5 - In development</div>
              </div>
            </div>
          </div>

          {/* Transcription & Analysis Section */}
          <div className="analysis-section">
            {/* Transcription Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <h2 className="card-title">Transcription</h2>
                <p className="card-subtitle">Transcribed text from your recording</p>
              </div>
              <div className="card-body">
                {loading && (
                  <div className="loading-spinner">
                    <svg className="animate-spin" width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" strokeDasharray="37.7" strokeDashoffset="37.7">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 37.7;18.85 18.85;0 37.7" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-18.85;-37.7" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    <p>Transcription in progress...</p>
                  </div>
                )}

                {!loading && !transcription && (
                  <div className="placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <p>The transcription will appear here</p>
                  </div>
                )}

                {transcription && (
                  <div className="transcription-result">
                    <div className="result-header">
                      <span className="result-badge">✨ Transcribed by AI</span>
                    </div>
                    <div className="result-content">
                      <p>{transcription}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Result Card */}
            <div className="card mt-4">
              <div className="card-header">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <h2 className="card-title">Oral Production Analysis</h2>
                <p className="card-subtitle">Detailed evaluation of your spoken French</p>
              </div>
              <div className="card-body">
                {!analysisResult && !loading && (
                  <div className="placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                    <p>The analysis will appear here after transcription</p>
                  </div>
                )}

                {analysisResult && (
                  <div className="analysis-result">
                    <div className="result-header">
                      <span className="result-badge">✨ Analyzed by AI</span>
                    </div>
                    <div className="result-content">
                      <pre>{analysisResult}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OralAnalysis;

