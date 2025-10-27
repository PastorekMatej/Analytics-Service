import { Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, isAuthenticated, userEmail, userRole, onLogout }) => {
  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Link to="/">
                <span className="logo-icon">🔬</span>
                <span className="logo-text">French Learning Analytics Lab</span>
              </Link>
            </div>
            
            <nav className="nav">
              {!isAuthenticated ? (
                <>
                  <Link to="/" className="nav-link">Accueil</Link>
                  <Link to="/login" className="nav-link">Connexion</Link>
                  <Link to="/signup" className="nav-link">Inscription</Link>
                </>
              ) : (
                <>
                  {userRole === 'student' && (
                    <>
                      <Link to="/written-analysis" className="nav-link">
                        📝 Analyse Écrite
                      </Link>
                      <Link to="/oral-analysis" className="nav-link">
                        🎤 Analyse Orale
                      </Link>
                      <Link to="/progress" className="nav-link">
                        📈 Mon Progrès
                      </Link>
                    </>
                  )}
                  
                  {(userRole === 'admin' || userRole === 'teacher') && (
                    <Link to="/dashboard" className="nav-link">
                      📊 Tableau de bord
                    </Link>
                  )}
                  
                  <div className="user-info">
                    <span className="user-email">{userEmail}</span>
                    <span className="user-role">{userRole}</span>
                  </div>
                  
                  <button onClick={onLogout} className="btn btn-danger btn-sm">
                    🚪 Déconnexion
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          {children}
        </div>
      </main>
      
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            French Learning Analytics Lab - AI-Powered Language Assessment
          </p>
          <p className="footer-copyright">
            © 2024 - Plateforme d'analyse pour étudiants FLE
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

