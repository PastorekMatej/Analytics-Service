import { useState, useEffect, useRef } from 'react';
import analysisService from '../services/analysisService';
import './Dashboard.css';

// Parse analysis result into structured sections
const parseAnalysisResult = (analysisText) => {
  if (!analysisText) return null;

  const sections = {
    niveau: '',
    conclusion: '',
    erreursRecurrentes: '',
    erreursPersistantes: ''
  };

  const lines = analysisText.split('\n');
  let currentSection = null;
  let currentContent = [];
  let evolutionContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect section headers
    if (line.includes('ÉVOLUTION_GLOBALE') || line.includes('ÉVOLUTION GLOBALE')) {
      currentSection = 'evolutionGlobale';
      currentContent = [];
      continue;
    }
    if (line.includes('ERREURS_RÉCURRENTES') || line.includes('ERREURS RÉCURRENTES')) {
      // Save evolution content before switching
      evolutionContent = currentContent.join('\n');
      // Extract niveau and conclusion from evolution
      extractEvolutionData(evolutionContent, sections);
      currentSection = 'erreursRecurrentes';
      currentContent = [];
      continue;
    }
    if (line.includes('TENDANCES D\'ÉVOLUTION') || line.includes("TENDANCES D'ÉVOLUTION")) {
      if (currentSection === 'erreursRecurrentes') {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'tendancesEvolution';
      currentContent = [];
      continue;
    }
    if (line.includes('ERREURS_PERSISTANTES') || line.includes('ERREURS PERSISTANTES')) {
      if (currentSection === 'erreursRecurrentes') {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'erreursPersistantes';
      currentContent = [];
      continue;
    }

    // Skip empty lines at section boundaries
    if (line === '' && currentContent.length === 0) continue;

    // Collect content for current section
    if (currentSection) {
      currentContent.push(lines[i]);
    }
  }

  // Save last section
  if (currentSection === 'erreursPersistantes') {
    sections[currentSection] = currentContent.join('\n');
  } else if (currentSection === 'evolutionGlobale') {
    evolutionContent = currentContent.join('\n');
    extractEvolutionData(evolutionContent, sections);
  }

  return sections;
};

// Extract niveau and conclusion from evolution globale section
const extractEvolutionData = (content, sections) => {
  if (!content) return;
  
  const fullContent = content;
  let niveauMatch = null;
  let resumeContent = '';
  
  // Extract niveau - look for patterns like "A2 → B1+" or "évolution de niveau: "A2 → B1+"
  const niveauPatterns = [
    /évolution de niveau[:\s]*[""]([A-Z0-9+\s→]+)[""]/i,
    /évolution de niveau[:\s]*([A-Z0-9+\s→]+)/i,
    /evolution de niveau[:\s]*[""]([A-Z0-9+\s→]+)[""]/i,
    /evolution de niveau[:\s]*([A-Z0-9+\s→]+)/i,
    /[""]([A-Z0-9+\s→]+)[""]/,
    /([A-Z][0-9]+\s*→\s*[A-Z][0-9+]+)/
  ];
  
  for (const pattern of niveauPatterns) {
    const match = fullContent.match(pattern);
    if (match && match[1]) {
      niveauMatch = match[1].trim();
      break;
    }
  }
  
  // Extract résumé/conclusion
  const resumePatterns = [
    /résumé[:\s]*>\s*\n([\s\S]*?)(?=\n\s*[A-Z]|\n\s*$)/i,
    /resumé[:\s]*>\s*\n([\s\S]*?)(?=\n\s*[A-Z]|\n\s*$)/i,
    /résume[:\s]*>\s*\n([\s\S]*?)(?=\n\s*[A-Z]|\n\s*$)/i,
    /résumé[:\s]*([\s\S]*?)(?=\n\s*[A-Z]|\n\s*$)/i
  ];
  
  for (const pattern of resumePatterns) {
    const match = fullContent.match(pattern);
    if (match && match[1]) {
      resumeContent = match[1].trim().replace(/^>\s*/gm, '').trim();
      break;
    }
  }
  
  // If no pattern match, try to find after "résumé:" line
  if (!resumeContent) {
    const lines = content.split('\n');
    let resumeStart = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().includes('résumé') || line.toLowerCase().includes('resumé')) {
        resumeStart = i + 1;
        break;
      }
    }
    if (resumeStart > 0) {
      resumeContent = lines.slice(resumeStart).join('\n').trim().replace(/^>\s*/gm, '');
    }
  }
  
  if (niveauMatch) {
    sections.niveau = niveauMatch;
  }
  
  if (resumeContent) {
    sections.conclusion = resumeContent;
  }
};

// Format section content for display
const formatSectionContent = (content) => {
  if (!content) return null;

  return content.split('\n').map((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    // Handle headers (## Titre or GRAMMAIRE:, VOCABULAIRE:, STYLE:)
    if (trimmedLine.startsWith('## ') || trimmedLine.match(/^(GRAMMAIRE|VOCABULAIRE|STYLE):$/)) {
      return (
        <h4 key={lineIndex} className="analysis-section-title">
          {trimmedLine.replace(/^##\s*/, '').replace(':', '')}
        </h4>
      );
    }
    
    // Handle bold text (**texte**)
    if (trimmedLine.includes('**')) {
      const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={lineIndex} className="analysis-paragraph">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={i}>
                  {part.replace(/\*\*/g, '')}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    }
    
    // Handle list items
    if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
      return (
        <li key={lineIndex} className="analysis-list-item">
          {trimmedLine.replace(/^[-•]\s*/, '')}
        </li>
      );
    }
    
    // Handle numbered items
    if (trimmedLine.match(/^\d+\./)) {
      return (
        <li key={lineIndex} className="analysis-list-item">
          {trimmedLine.replace(/^\d+\.\s*/, '')}
        </li>
      );
    }
    
    // Handle error type format (type: G01, pattern:, occurrences:, exemples:)
    if (trimmedLine.startsWith('type:') || trimmedLine.startsWith('pattern:') || trimmedLine.startsWith('occurrences:') || trimmedLine.startsWith('exemples:')) {
      return (
        <div key={lineIndex} className="analysis-error-item">
          <strong>{trimmedLine}</strong>
        </div>
      );
    }
    
    // Empty lines
    if (trimmedLine === '') {
      return <br key={lineIndex} />;
    }
    
    // Regular paragraphs
    return (
      <p key={lineIndex} className="analysis-paragraph">
        {trimmedLine}
      </p>
    );
  });
};

const Dashboard = ({ userRole, userEmail }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [analyzingAnalyses, setAnalyzingAnalyses] = useState({});
  const [analysisProgress, setAnalysisProgress] = useState({});
  const progressIntervals = useRef({});

  useEffect(() => {
    const loadData = async () => {
      if (userRole === 'student') {
        // Load analyses for student
        try {
          const response = await analysisService.getStudentAnalyses(userEmail);
          setAnalyses(response.analyses || []);
        } catch (error) {
          console.error('Error loading analyses:', error);
          setAnalyses([]);
        }
        setLoading(false);
      } else {
        // Load students for teacher/admin
        setTimeout(() => {
          // Get all users from localStorage
          const users = JSON.parse(localStorage.getItem('users') || '{}');
          
          // Filter students based on teacher
          let filteredStudents = [];
          
          if (userRole === 'admin') {
            // Admin sees all students
            filteredStudents = Object.entries(users)
              .filter(([email, data]) => data.role === 'student')
              .map(([email, data]) => ({
                email,
                textsCount: Math.floor(Math.random() * 30),
                lastActivity: new Date().toISOString().split('T')[0],
                hasNewTexts: Math.random() > 0.5,
                teacherId: data.teacherId
              }));
          } else if (userRole === 'teacher') {
            // Teachers see only their assigned students
            filteredStudents = Object.entries(users)
              .filter(([email, data]) => data.role === 'student' && data.teacherId === userEmail)
              .map(([email, data]) => ({
                email,
                textsCount: Math.floor(Math.random() * 30),
                lastActivity: new Date().toISOString().split('T')[0],
                hasNewTexts: Math.random() > 0.5,
                teacherId: data.teacherId
              }));
          }
          
          setStudents(filteredStudents);
          setLoading(false);
        }, 1000);
      }
    };

    loadData();
  }, [userRole, userEmail]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(progressIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  // Filter analyses by type and sort by date (most recent first)
  const allWrittenAnalyses = analyses
    .filter(a => a.text_type === 'written' || !a.text_type)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  // Only show the most recent analysis
  const writtenAnalyses = allWrittenAnalyses.length > 0 ? [allWrittenAnalyses[0]] : [];

  // Get the most recent analysis for launching analysis
  const mostRecentWritten = writtenAnalyses.length > 0 ? writtenAnalyses[0] : null;

  // Handle analysis execution
  const handleAnalyze = async (analysis) => {
    if (!analysis.text_content) {
      console.error('No text content found for analysis');
      return;
    }

    const analysisId = analysis.id;
    
    // Mark as analyzing
    setAnalyzingAnalyses(prev => ({ ...prev, [analysisId]: true }));
    setAnalysisProgress(prev => ({ ...prev, [analysisId]: 0 }));

    // Start progress simulation
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90; // Cap at 90% until response
      setAnalysisProgress(prev => ({ ...prev, [analysisId]: Math.min(progress, 90) }));
    }, 200);
    
    progressIntervals.current[analysisId] = interval;

    try {
      // Submit for analysis
      const response = await analysisService.submitTextForAnalysis(
        userEmail,
        analysis.text_content,
        analysis.text_type || 'written'
      );

      // Complete progress
      clearInterval(interval);
      setAnalysisProgress(prev => ({ ...prev, [analysisId]: 100 }));

      // Reload analyses to get updated results
      const updatedResponse = await analysisService.getStudentAnalyses(userEmail);
      setAnalyses(updatedResponse.analyses || []);

      // Reset state after a short delay
      setTimeout(() => {
        setAnalyzingAnalyses(prev => {
          const updated = { ...prev };
          delete updated[analysisId];
          return updated;
        });
        setAnalysisProgress(prev => {
          const updated = { ...prev };
          delete updated[analysisId];
          return updated;
        });
        delete progressIntervals.current[analysisId];
      }, 500);
    } catch (error) {
      console.error('Error analyzing text:', error);
      clearInterval(interval);
      setAnalyzingAnalyses(prev => {
        const updated = { ...prev };
        delete updated[analysisId];
        return updated;
      });
      setAnalysisProgress(prev => {
        const updated = { ...prev };
        delete updated[analysisId];
        return updated;
      });
      delete progressIntervals.current[analysisId];
    }
  };

  // Analysis Dashboard Component for Written Analyses
  const WrittenAnalysisDashboard = ({ analysisResult }) => {
    const [activeTab, setActiveTab] = useState('erreursRecurrentes');
    const parsedSections = parseAnalysisResult(analysisResult);

    if (!parsedSections) {
      return (
        <div className="analysis-text">
          {formatSectionContent(analysisResult)}
        </div>
      );
    }

    const tabs = [
      { id: 'erreursRecurrentes', label: 'Recurring Errors', content: parsedSections.erreursRecurrentes },
      { id: 'erreursPersistantes', label: 'Persistent Errors', content: parsedSections.erreursPersistantes },
      { id: 'conclusion', label: 'Conclusion', content: parsedSections.conclusion }
    ];

    // Filter out empty tabs
    const availableTabs = tabs.filter(tab => tab.content && tab.content.trim().length > 0);

    return (
      <div className="analysis-dashboard">
        {/* Niveau Display */}
        {parsedSections.niveau && (
          <div className="niveau-display">
            <div className="niveau-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="niveau-label">Level Progression</span>
            </div>
            <div className="niveau-value">
              {parsedSections.niveau}
            </div>
          </div>
        )}

        {/* Tabs */}
        {availableTabs.length > 0 && (
          <div className="analysis-tabs">
            <div className="tabs-header">
              {availableTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="tabs-content">
              {availableTabs.map(tab => (
                <div
                  key={tab.id}
                  className={`tab-panel ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <div className="analysis-text">
                    {formatSectionContent(tab.content)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableTabs.length === 0 && (
          <div className="analysis-text">
            {formatSectionContent(analysisResult)}
          </div>
        )}
      </div>
    );
  };

  // Analysis Tabs Component for Oral Analyses (keep original)
  const AnalysisTabs = ({ analysisResult }) => {
    const [activeTab, setActiveTab] = useState('evolutionGlobale');
    const parsedSections = parseAnalysisResult(analysisResult);

    if (!parsedSections) {
      return (
        <div className="analysis-text">
          {formatSectionContent(analysisResult)}
        </div>
      );
    }

    const tabs = [
      { id: 'evolutionGlobale', label: 'Global Evolution', content: parsedSections.evolutionGlobale },
      { id: 'erreursRecurrentes', label: 'Recurring Errors', content: parsedSections.erreursRecurrentes },
      { id: 'erreursPersistantes', label: 'Persistent Errors', content: parsedSections.erreursPersistantes }
    ];

    // Filter out empty tabs
    const availableTabs = tabs.filter(tab => tab.content && tab.content.trim().length > 0);

    if (availableTabs.length === 0) {
      return (
        <div className="analysis-text">
          {formatSectionContent(analysisResult)}
        </div>
      );
    }

    return (
      <div className="analysis-tabs">
        <div className="tabs-header">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="tabs-content">
          {availableTabs.map(tab => (
            <div
              key={tab.id}
              className={`tab-panel ${activeTab === tab.id ? 'active' : ''}`}
            >
              <div className="analysis-text">
                {formatSectionContent(tab.content)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render analysis card component
  const renderAnalysisCard = (analysis, index, totalCount) => {
    const isAnalyzing = analyzingAnalyses[analysis.id] || false;
    const progress = analysisProgress[analysis.id] || 0;
    const hasAnalysis = !!analysis.analysis_result;
    
    return (
      <div key={analysis.id || index} className="analysis-card">
        <div className="analysis-card-header">
          <div className="analysis-info">
            <div className="analysis-meta">
              <h3 className="analysis-title">
                {hasAnalysis ? (
                  <>Report generated on {new Date(analysis.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</>
                ) : (
                  <>Text saved on {new Date(analysis.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</>
                )}
              </h3>
            </div>
          </div>
        </div>

        {isAnalyzing && (
          <div className="analysis-progress-container">
            <div className="analyzing-indicator">
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
              <span>Analysis in progress...</span>
            </div>
            <div className="analysis-progress-bar">
              <div 
                className="analysis-progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="analysis-progress-text">{Math.round(progress)}%</div>
          </div>
        )}

        <div className="analysis-details">
          <div className="analysis-content">
            {hasAnalysis ? (
              analysis.text_type === 'written' || !analysis.text_type ? (
                <WrittenAnalysisDashboard analysisResult={analysis.analysis_result} />
              ) : (
                <AnalysisTabs analysisResult={analysis.analysis_result} />
              )
            ) : (
              <div className="analysis-empty">
                <div className="new-texts-available">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <p><strong>New texts available</strong></p>
                  <p>Launch analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Student view - show analyses
  if (userRole === 'student') {
    return (
      <div className="dashboard-page">
        <div className="page-background">
          <div className="page-gradient"></div>
          <div className="page-pattern"></div>
        </div>
        
        <div className="page-container">
          <div className="page-header">
            <div className="page-header-content">
              <div className="page-header-left">
                <div className="page-badge">
                  <div className="badge-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
                    </svg>
                  </div>
                  <span>Progress tracking</span>
                </div>
                
                <h1 className="page-title">
                  My <span className="gradient-text">Progress</span>
                </h1>
                
                <p className="page-description">
                  View your text analyses and track your French progress 
                  with artificial intelligence.
                </p>
              </div>
              
              <div className="page-header-right">
                {mostRecentWritten && (
                  <div className="analyze-buttons-group">
                    <button
                      className={`btn btn-primary btn-lg ${analyzingAnalyses[mostRecentWritten.id] ? 'btn-loading' : ''}`}
                      onClick={() => handleAnalyze(mostRecentWritten)}
                      disabled={analyzingAnalyses[mostRecentWritten.id]}
                    >
                      {analyzingAnalyses[mostRecentWritten.id] ? (
                        <>
                          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                            </circle>
                          </svg>
                          Written analysis in progress...
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                          </svg>
                          Analyze written text
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {analyses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="empty-title">No analysis available</h3>
              <p className="empty-description">
                Submit your first text in the "Written Analysis" tab 
                to start your learning journey.
              </p>
              <div className="empty-actions">
                <a href="/written-analysis" className="btn btn-primary">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                  </svg>
                  Start analysis
                </a>
              </div>
            </div>
          ) : (
            <div className="progress-columns">
              {/* Written Analyses Column */}
              <div className="progress-column">
                <div className="column-header">
                  <div className="column-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-8 8-8-8V4zM3 9.414l7 7 7-7V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.414z"/>
                    </svg>
                  </div>
                  <h2 className="column-title">Written Analyses</h2>
                  <span className="column-count">{writtenAnalyses.length}</span>
                </div>
                <div className="analyses-list">
                  {writtenAnalyses.length === 0 ? (
                    <div className="column-empty">
                      <p>No written analysis available</p>
                    </div>
                  ) : (
                    writtenAnalyses.map((analysis, index) => 
                      renderAnalysisCard(analysis, index, writtenAnalyses.length)
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">
          📊 Dashboard {userRole === 'admin' ? 'Admin' : 'Teacher'}
        </h1>
        <p className="page-description">
          Manage and analyze your students' progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card stat-students">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">👥</div>
            </div>
            <div className="stat-info">
              <div className="stat-label">Students</div>
              <div className="stat-value">{students.length}</div>
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: '75%'}}></div>
          </div>
        </div>

        <div className="stat-card stat-texts">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">📝</div>
            </div>
            <div className="stat-info">
              <div className="stat-label">Total texts</div>
              <div className="stat-value">
                {students.reduce((sum, s) => sum + s.textsCount, 0)}
              </div>
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: '60%'}}></div>
          </div>
        </div>

        <div className="stat-card stat-average">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">📊</div>
            </div>
            <div className="stat-info">
              <div className="stat-label">Average/student</div>
              <div className="stat-value">
                {Math.round(students.reduce((sum, s) => sum + s.textsCount, 0) / students.length || 0)}
              </div>
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: '85%'}}></div>
          </div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">✅</div>
            </div>
            <div className="stat-info">
              <div className="stat-label">Active</div>
              <div className="stat-value">{students.length}</div>
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: '95%'}}></div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="section">
        <h2 className="section-title">👥 Students List</h2>
        
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3 className="empty-title">No students assigned</h3>
            <p className="empty-description">
              {userRole === 'teacher' 
                ? "Students can choose you as their teacher during registration or from their profile."
                : "No students have registered on the platform yet."}
            </p>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Texts submitted</th>
                  <th>Last activity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>
                      {student.email}
                      {student.hasNewTexts && (
                        <span className="new-badge">New</span>
                      )}
                    </td>
                    <td>{student.textsCount}</td>
                    <td>{new Date(student.lastActivity).toLocaleDateString('en-US')}</td>
                    <td>
                      {student.hasNewTexts ? (
                        <span className="status-badge status-new">📝 New texts</span>
                      ) : (
                        <span className="status-badge status-ok">✓ Up to date</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedStudent(student)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedStudent(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Email:</strong> {selectedStudent.email}</p>
              <p><strong>Texts submitted:</strong> {selectedStudent.textsCount}</p>
              <p><strong>Last activity:</strong> {selectedStudent.lastActivity}</p>
              <button className="btn btn-primary mt-3">
                🔍 Launch analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

