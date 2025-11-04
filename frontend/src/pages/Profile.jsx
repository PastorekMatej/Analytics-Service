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
      setError('Error saving');
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
              <span>Restricted access</span>
            </div>
            
            <h1 className="page-title">
              My <span className="gradient-text">Profile</span>
            </h1>
          </div>
          
          <div className="profile-card">
            <div className="card-header">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h2 className="card-title">Restricted access</h2>
            </div>
            <div className="card-body">
              <p>Teachers do not have access to this profile page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
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
            <span>Account management</span>
          </div>
          
          <h1 className="page-title">
            My <span className="gradient-text">Profile</span>
          </h1>
          
          <p className="page-description">
            Manage your personal information and learning preferences
          </p>
        </div>

        <div className="profile-container">
          {/* Account Information */}
          <div className="profile-card">
            <div className="card-header">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <h2 className="card-title">Account information</h2>
              <p className="card-subtitle">Your personal data and preferences</p>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    Email
                  </div>
                  <div className="info-value">{userEmail}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    Role
                  </div>
                  <div className="info-value">
                    <span className="badge badge-primary">Student</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Account type
                  </div>
                  <div className="info-value">
                    <span className="badge badge-success">Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Assignment */}
          <div className="profile-card">
            <div className="card-header">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h2 className="card-title">My Teacher</h2>
              <p className="card-subtitle">Choose your teacher for personalized tracking</p>
            </div>
            <div className="card-body">
              {currentTeacher ? (
                <div className="current-teacher">
                  <div className="teacher-badge">
                    <div className="teacher-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="teacher-info">
                      <div className="teacher-name">{getTeacherName(currentTeacher)}</div>
                      <div className="teacher-email">{currentTeacher}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-teacher">
                  <div className="no-teacher-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h3>No teacher assigned yet</h3>
                  <p className="help-text">
                    Choose a teacher below so they can track your progress.
                  </p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Changes saved successfully!
                </div>
              )}

              <div className="form-group">
                <label htmlFor="teacher" className="form-label">
                  Change teacher
                </label>
                <div className="input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="input-icon">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <select
                    id="teacher"
                    className="form-control"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                  >
                    <option value="">No teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.email} value={teacher.email}>
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="form-help">
                  Your teacher will be able to see your analyses and track your progress
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading || selectedTeacher === currentTeacher}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                    </svg>
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

