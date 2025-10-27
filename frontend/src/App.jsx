import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WrittenAnalysis from './pages/WrittenAnalysis';
import OralAnalysis from './pages/OralAnalysis';
import Progress from './pages/Progress';
import Dashboard from './pages/Dashboard';
import './styles/App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState('student');

  const handleLogin = (email, role) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole('student');
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
                element={<Progress userEmail={userEmail} />}
              />
              {(userRole === 'admin' || userRole === 'teacher') && (
                <Route
                  path="/dashboard"
                  element={<Dashboard userRole={userRole} />}
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

