import './Analysis.css';

const OralAnalysis = ({ userEmail }) => {

  return (
    <div className="analysis-page">
      <div className="page-background">
        <div className="page-gradient"></div>
        <div className="page-pattern"></div>
      </div>
      
      <div className="page-container">
        <div className="page-header">
          <div className="in-progress-banner">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            <span>🚧 Feature in Progress - Coming Soon</span>
          </div>
          
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
          {/* Google Meet Integration Notice */}
          <div className="analysis-section">
            <div className="card integration-notice">
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
        </div>
      </div>
    </div>
  );
};

export default OralAnalysis;

