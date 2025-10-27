import { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ userRole }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading students data
    setTimeout(() => {
      setStudents([
        { email: 'student1@example.com', textsCount: 12, lastActivity: '2024-12-15' },
        { email: 'student2@example.com', textsCount: 8, lastActivity: '2024-12-14' },
        { email: 'dominika@example.com', textsCount: 25, lastActivity: '2024-12-16' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{students.length}</div>
          <div className="stat-label">Étudiants</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">
            {students.reduce((sum, s) => sum + s.textsCount, 0)}
          </div>
          <div className="stat-label">Textes totaux</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">
            {Math.round(students.reduce((sum, s) => sum + s.textsCount, 0) / students.length || 0)}
          </div>
          <div className="stat-label">Moyenne/étudiant</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{students.length}</div>
          <div className="stat-label">Actifs</div>
        </div>
      </div>

      {/* Students Table */}
      <div className="section">
        <h2 className="section-title">👥 Liste des Étudiants</h2>
        
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Textes soumis</th>
                <th>Dernière activité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={index}>
                  <td>{student.email}</td>
                  <td>{student.textsCount}</td>
                  <td>{new Date(student.lastActivity).toLocaleDateString('fr-FR')}</td>
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

