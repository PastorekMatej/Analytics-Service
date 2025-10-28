import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WrittenAnalysis from './pages/WrittenAnalysis';
import OralAnalysis from './pages/OralAnalysis';
import Progress from './pages/Progress';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
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
      <Layout
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={handleLogout}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={<Login onLogin={handleLogin} />}
          />
          <Route path="/signup" element={<Signup />} />
          
          {isAuthenticated && (
            <>
              <Route
                path="/written-analysis"
                element={<WrittenAnalysis userEmail={userEmail} />}
              />
              <Route
                path="/oral-analysis"
                element={<OralAnalysis userEmail={userEmail} />}
              />
              <Route
                path="/progress"
                element={<Dashboard userRole={userRole} userEmail={userEmail} />}
              />
              <Route
                path="/profile"
                element={<Profile userEmail={userEmail} userRole={userRole} />}
              />
              {(userRole === 'admin' || userRole === 'teacher') && (
                <Route
                  path="/dashboard"
                  element={<Dashboard userRole={userRole} userEmail={userEmail} />}
                />
              )}
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

