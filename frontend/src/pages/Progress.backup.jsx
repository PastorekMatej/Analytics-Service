import { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import './Progress.css';

const Progress = ({ userEmail }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [userEmail]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await studentService.getProgress(userEmail);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Error loading data');
      }
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  const conversations = data?.conversations || [];
  const analyses = data?.analyses || [];

  return (
    <div className="progress-page">
      <div className="page-header">
        <h1 className="page-title">📈 My Progress</h1>
        <p className="page-description">
          Track your evolution and view your analyses
        </p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{conversations.length}</div>
          <div className="stat-label">Texts submitted</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{analyses.length}</div>
          <div className="stat-label">Analyses performed</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">
            {conversations.length > 0 ? Math.min(100, conversations.length * 10) : 0}%
          </div>
          <div className="stat-label">Progress</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">
            {analyses.length > 0 ? 'Positive' : 'In progress'}
          </div>
          <div className="stat-label">Trend</div>
        </div>
      </div>

      {/* Analysis Reports */}
      <div className="section">
        <h2 className="section-title">📋 Analysis Reports</h2>
        
        {analyses.length === 0 ? (
          <div className="card">
            <div className="card-body">
              <div className="placeholder">
                <p>📝 No analysis available</p>
                <p className="text-secondary">
                  Submit your first texts to start tracking your progress
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="reports-list">
            {analyses.slice().reverse().map((analysis, index) => (
              <div key={index} className="report-card">
                <div className="report-header">
                  <h3 className="report-title">
                    📊 Analysis #{analyses.length - index}
                  </h3>
                  <span className="report-date">
                    {new Date(analysis.date).toLocaleDateString('en-US')}
                  </span>
                </div>
                <div className="report-content">
                  <pre>{analysis.result}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversations Timeline */}
      <div className="section">
        <h2 className="section-title">📝 Text History</h2>
        
        {conversations.length === 0 ? (
          <div className="card">
            <div className="card-body">
              <div className="placeholder">
                <p>📝 No texts submitted</p>
                <p className="text-secondary">
                  Start by submitting your first text in "Written Analysis"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="timeline">
            {conversations.slice().reverse().map((conv, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h3 className="timeline-title">{conv.message_id}</h3>
                    <span className="timeline-date">
                      {new Date(conv.date).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <div className="timeline-body">
                    <div className="message-preview">
                      {conv.message.substring(0, 200)}
                      {conv.message.length > 200 && '...'}
                    </div>
                    <div className="message-stats">
                      <span>📊 {conv.message.split(' ').length} words</span>
                      <span>📝 {conv.message.length} characters</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;

