import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, isAuthenticated, userEmail, userRole, onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-background">
          <div className="sidebar-gradient"></div>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-header">
            <Link to="/" className="logo-link">
              <div className="logo-icon">
                <img src="/logo.svg" alt="Maister" width="32" height="32" />
              </div>
              {!isSidebarCollapsed && <span className="logo-text">Maister</span>}
            </Link>
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                {isSidebarCollapsed ? (
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                ) : (
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
                )}
              </svg>
            </button>
          </div>

          <nav className="nav-links">
            {!isAuthenticated ? (
              <>
                <Link to="/" className="nav-link">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                  {!isSidebarCollapsed && <span>Home</span>}
                </Link>
                <Link to="/login" className="nav-link">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  {!isSidebarCollapsed && <span>Login</span>}
                </Link>
                <Link to="/signup" className="nav-link nav-link-primary">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  {!isSidebarCollapsed && <span>Sign Up</span>}
                </Link>
              </>
            ) : (
              <>
                {userRole === 'student' && (
                  <>
                    <Link to="/written-analysis" className="nav-link">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                      </svg>
                      {!isSidebarCollapsed && <span>My Writings</span>}
                    </Link>
                    <Link to="/oral-analysis" className="nav-link">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                      </svg>
                      {!isSidebarCollapsed && <span>My Voice</span>}
                    </Link>
                    <Link to="/progress" className="nav-link">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                      </svg>
                      {!isSidebarCollapsed && <span>Analysis</span>}
                    </Link>
                    <Link to="/profile" className="nav-link">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                      {!isSidebarCollapsed && <span>My Profile</span>}
                    </Link>
                  </>
                )}
                
                {(userRole === 'admin' || userRole === 'teacher') && (
                  <Link to="/dashboard" className="nav-link">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                    </svg>
                    {!isSidebarCollapsed && <span>Dashboard</span>}
                  </Link>
                )}
              </>
            )}
          </nav>

          {isAuthenticated && (
            <div className="sidebar-footer">
              {!isSidebarCollapsed && (
                <div className="user-info">
                  <div className="user-avatar">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-details">
                    <span className="user-email">{userEmail}</span>
                    <span className="user-role">{userRole}</span>
                  </div>
                </div>
              )}
              {isSidebarCollapsed && (
                <div className="user-avatar">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <button onClick={onLogout} className="nav-link logout-link">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
                </svg>
                {!isSidebarCollapsed && <span>Logout</span>}
              </button>
            </div>
          )}
        </div>
      </aside>
      
      <div className={`layout-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

