import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      {/* Logo positioned at top-left */}
      <div className="home-logo">
        <img src="/logo.svg" alt="Maister" className="home-logo-img" />
        <span className="home-logo-text">Maister</span>
      </div>
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <div className="badge-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
                </svg>
              </div>
              <span>Powered by Artificial Intelligence</span>
            </div>
            
            <h1 className="hero-title">
              Learn or Teach French with
              <span className="gradient-text"> Maister</span>
            </h1>
            
            <p className="hero-subtitle">
              An advanced linguistic analysis platform that combines artificial intelligence 
              and pedagogical expertise to accelerate your French learning.
            </p>
            
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary">
                <span>Start for free</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/login" className="btn btn-outline">
                Sign in
              </Link>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="preview-title">Real-time Analysis</div>
              </div>
              <div className="preview-content">
                <div className="analysis-card">
                  <div className="analysis-header">
                    <div className="analysis-icon">📝</div>
                    <div className="analysis-info">
                      <div className="analysis-title">Text submitted</div>
                      <div className="analysis-time">2 minutes ago</div>
                    </div>
                  </div>
                  <div className="analysis-progress">
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                    <span className="progress-text">Analysis in progress...</span>
                  </div>
                </div>
                
                <div className="results-card">
                  <div className="result-item">
                    <div className="result-icon">✓</div>
                    <div className="result-text">Grammar corrected</div>
                  </div>
                  <div className="result-item">
                    <div className="result-icon">📊</div>
                    <div className="result-text">B2 level detected</div>
                  </div>
                  <div className="result-item">
                    <div className="result-icon">🎯</div>
                    <div className="result-text">+15% progress</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="features-header">
            <div className="section-badge">Features</div>
            <h2 className="section-title">
              A complete solution for learning French
            </h2>
            <p className="section-description">
              Discover how our platform revolutionizes French teaching 
              through artificial intelligence and pedagogical expertise.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card primary">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Intelligent Text Analysis</h3>
              <p className="feature-description">
                Automatic detection of grammar, syntax, vocabulary, and conjugation errors 
                with personalized improvement suggestions.
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Oral Production Analysis</h3>
              <p className="feature-description">
                Automatic transcription and analysis of pronunciation, fluency 
                and linguistic accuracy of your audio recordings.
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Advanced Progress Tracking</h3>
              <p className="feature-description">
                Detailed dashboards with statistics, progress reports 
                and recommendations tailored to your CEFR level.
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Advanced Artificial Intelligence</h3>
              <p className="feature-description">
                State-of-the-art AI algorithms for accurate analysis 
                and personalized improvement suggestions.
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Teacher Space</h3>
              <p className="feature-description">
                Complete dashboard to track your students' progress, 
                analyze common errors and adapt your teaching.
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Cloud Synchronization</h3>
              <p className="feature-description">
                Automatic backup and synchronization of your texts 
                from any device (coming soon).
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">
              Ready to transform your French learning?
            </h2>
            <p className="cta-description">
              Join over 500 students and teachers who already use 
              our platform to accelerate their French progress.
            </p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                <span>Start for free</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Sign in
              </Link>
            </div>
            <div className="cta-note">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
              </svg>
              <span>Free • No credit card required</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

