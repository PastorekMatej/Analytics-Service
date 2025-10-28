import { useState, useEffect } from 'react';
import analysisService from '../services/analysisService';
import './Dashboard.css';

const Dashboard = ({ userRole, userEmail }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);

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

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  // Student view - show analyses
  if (userRole === 'student') {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1 className="page-title">📊 Mon Progrès</h1>
          <p className="page-description">
            Consultez vos analyses de textes et suivez votre progression
          </p>
        </div>

        {analyses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3 className="empty-title">Aucune analyse disponible</h3>
            <p className="empty-description">
              Soumettez votre premier texte dans l'onglet "Analyse Écrite" pour commencer votre parcours d'apprentissage.
            </p>
          </div>
        ) : (
          <div className="analyses-list">
            {analyses.map((analysis, index) => (
              <div key={analysis.id || index} className="analysis-card">
                <div className="analysis-card-header">
                  <div className="analysis-info">
                    <h3 className="analysis-title">
                      Analyse #{analyses.length - index}
                    </h3>
                    <p className="analysis-date">
                      {new Date(analysis.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="analysis-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setExpandedAnalysis(expandedAnalysis === analysis.id ? null : analysis.id)}
                    >
                      {expandedAnalysis === analysis.id ? 'Masquer' : 'Voir détails'}
                    </button>
                  </div>
                </div>
                
                <div className="analysis-preview">
                  <p className="text-excerpt">
                    "{analysis.text_content ? analysis.text_content.substring(0, 100) + '...' : 'Texte non disponible'}"
                  </p>
                </div>

                {expandedAnalysis === analysis.id && (
                  <div className="analysis-details">
                    <div className="analysis-content">
                      {analysis.analysis_result ? (
                        <div className="analysis-text">
                          {analysis.analysis_result.split('\n').map((line, lineIndex) => {
                            // Handle headers (## Titre)
                            if (line.startsWith('## ')) {
                              return (
                                <h4 key={lineIndex} className="analysis-section-title">
                                  {line.replace('## ', '')}
                                </h4>
                              );
                            }
                            // Handle bold text (**texte**)
                            if (line.includes('**')) {
                              const parts = line.split(/(\*\*[^*]+\*\*)/g);
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
                            if (line.trim().startsWith('-')) {
                              return (
                                <li key={lineIndex} className="analysis-list-item">
                                  {line.replace(/^-\s*/, '')}
                                </li>
                              );
                            }
                            // Handle numbered items
                            if (line.match(/^\d+\./)) {
                              return (
                                <li key={lineIndex} className="analysis-list-item">
                                  {line.replace(/^\d+\.\s*/, '')}
                                </li>
                              );
                            }
                            // Empty lines
                            if (line.trim() === '') {
                              return <br key={lineIndex} />;
                            }
                            // Regular paragraphs
                            return (
                              <p key={lineIndex} className="analysis-paragraph">
                                {line}
                              </p>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-secondary">Analyse en cours...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">
          📊 Tableau de bord {userRole === 'admin' ? 'Admin' : 'Enseignant'}
        </h1>
        <p className="page-description">
          Gérez et analysez les progrès de vos étudiants
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
              <div className="stat-label">Étudiants</div>
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
              <div className="stat-label">Textes totaux</div>
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
              <div className="stat-label">Moyenne/étudiant</div>
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
              <div className="stat-label">Actifs</div>
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
        <h2 className="section-title">👥 Liste des Étudiants</h2>
        
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3 className="empty-title">Aucun étudiant assigné</h3>
            <p className="empty-description">
              {userRole === 'teacher' 
                ? "Les étudiants pourront vous choisir comme enseignant lors de leur inscription ou depuis leur profil."
                : "Aucun étudiant n'est encore inscrit sur la plateforme."}
            </p>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Textes soumis</th>
                  <th>Dernière activité</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>
                      {student.email}
                      {student.hasNewTexts && (
                        <span className="new-badge">Nouveau</span>
                      )}
                    </td>
                    <td>{student.textsCount}</td>
                    <td>{new Date(student.lastActivity).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {student.hasNewTexts ? (
                        <span className="status-badge status-new">📝 Nouveaux textes</span>
                      ) : (
                        <span className="status-badge status-ok">✓ À jour</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedStudent(student)}
                      >
                        Voir détails
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
              <h2>Détails de l'étudiant</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedStudent(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Email:</strong> {selectedStudent.email}</p>
              <p><strong>Textes soumis:</strong> {selectedStudent.textsCount}</p>
              <p><strong>Dernière activité:</strong> {selectedStudent.lastActivity}</p>
              <button className="btn btn-primary mt-3">
                🔍 Lancer une analyse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

