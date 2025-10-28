import { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ userRole, userEmail }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading students data
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
  }, [userRole, userEmail]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Chargement du tableau de bord...</p>
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

