import { useState, useEffect } from 'react';
import authService from '../services/authService';
import './Profile.css';

const Profile = ({ userEmail, userRole }) => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      // Load teachers list
      const teachersResponse = await authService.getTeachersList();
      if (teachersResponse.success) {
        setTeachers(teachersResponse.teachers);
      }

      // Load current teacher assignment from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const userData = users[userEmail];
      if (userData && userData.teacherId) {
        setCurrentTeacher(userData.teacherId);
        setSelectedTeacher(userData.teacherId);
      }
    };
    loadData();
  }, [userEmail]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await authService.assignTeacher(userEmail, selectedTeacher || null);
      
      if (response.success) {
        setSuccess(true);
        setCurrentTeacher(selectedTeacher || null);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (email) => {
    const teacher = teachers.find(t => t.email === email);
    return teacher ? teacher.name : email;
  };

  if (userRole !== 'student') {
    return (
      <div className="profile-page">
        <div className="page-header">
          <h1 className="page-title">👤 Mon Profil</h1>
        </div>
        <div className="profile-card">
          <p>Les enseignants n'ont pas accès à cette page de profil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">👤 Mon Profil</h1>
        <p className="page-description">
          Gérez vos informations personnelles
        </p>
      </div>

      <div className="profile-container">
        {/* Account Information */}
        <div className="profile-card">
          <div className="card-header">
            <h2 className="card-title">📧 Informations du compte</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{userEmail}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Rôle:</span>
              <span className="info-value badge badge-primary">Étudiant</span>
            </div>
            <div className="info-row">
              <span className="info-label">Type de compte:</span>
              <span className="info-value badge badge-success">Gratuit</span>
            </div>
          </div>
        </div>

        {/* Teacher Assignment */}
        <div className="profile-card">
          <div className="card-header">
            <h2 className="card-title">👨‍🏫 Mon Enseignant</h2>
          </div>
          <div className="card-body">
            {currentTeacher ? (
              <div className="current-teacher">
                <div className="teacher-badge">
                  <span className="teacher-icon">✓</span>
                  <div>
                    <div className="teacher-name">{getTeacherName(currentTeacher)}</div>
                    <div className="teacher-email">{currentTeacher}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-teacher">
                <p>Vous n'avez pas encore d'enseignant assigné.</p>
                <p className="help-text">
                  Choisissez un enseignant ci-dessous pour qu'il puisse suivre votre progression.
                </p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                ✅ Modifications enregistrées avec succès !
              </div>
            )}

            <div className="form-group">
              <label htmlFor="teacher" className="form-label">
                Changer d'enseignant
              </label>
              <select
                id="teacher"
                className="form-control"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">Aucun enseignant</option>
                {teachers.map((teacher) => (
                  <option key={teacher.email} value={teacher.email}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
              <p className="form-help">
                Votre enseignant pourra voir vos analyses et suivre votre progression
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading || selectedTeacher === currentTeacher}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

