import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WrittenAnalysis from './pages/WrittenAnalysis';
import OralAnalysis from './pages/OralAnalysis';
import Progress from './pages/Progress';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Corrections from './pages/Corrections';
import Analytics from './pages/Analytics';
import './styles/App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState('student');

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setUserEmail(user.email);
        setUserRole(user.role);
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (email, role) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify({ email, role }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole('student');
    // Clear localStorage
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Progress page - wrapped in AppLayout */}
        <Route
          path="/progress"
          element={
            <AppLayout 
              userEmail={userEmail} 
              userRole={userRole} 
              onLogout={handleLogout}
            >
              <Progress userEmail={userEmail} userRole={userRole} />
            </AppLayout>
          }
        />
        
        {isAuthenticated && (
          <>
            <Route
              path="/written-analysis"
              element={
                <AppLayout userEmail={userEmail} userRole={userRole} onLogout={handleLogout}>
                  <WrittenAnalysis userEmail={userEmail} />
                </AppLayout>
              }
            />
            <Route
              path="/oral-analysis"
              element={
                <AppLayout userEmail={userEmail} userRole={userRole} onLogout={handleLogout}>
                  <OralAnalysis userEmail={userEmail} />
                </AppLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <AppLayout userEmail={userEmail} userRole={userRole} onLogout={handleLogout}>
                  <Profile userEmail={userEmail} userRole={userRole} />
                </AppLayout>
              }
            />
            <Route
              path="/corrections"
              element={
                <AppLayout userEmail={userEmail} userRole={userRole} onLogout={handleLogout}>
                  <Corrections userEmail={userEmail} userRole={userRole} />
                </AppLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <AppLayout userEmail={userEmail} userRole={userRole} onLogout={handleLogout}>
                  <Analytics userEmail={userEmail} userRole={userRole} />
                </AppLayout>
              }
            />
            {(userRole === 'admin' || userRole === 'teacher') && (
              <Route
                path="/dashboard"
                element={
                  <AppLayout userEmail={userEmail} userRole={userRole} onLogout={handleLogout}>
                    <Dashboard userRole={userRole} userEmail={userEmail} />
                  </AppLayout>
                }
              />
            )}
          </>
        )}
        
        {/* Redirect unauthenticated users - Temporarily disabled for Progress testing */}
        {/* {!isAuthenticated && (
          <Route path="/progress" element={<Navigate to="/login" replace />} />
        )} */}
      </Routes>
    </Router>
  );
};

export default App;

