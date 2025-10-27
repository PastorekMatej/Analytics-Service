import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Auth.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        onLogin(response.email, response.role);
        navigate(response.role === 'student' ? '/written-analysis' : '/dashboard');
      } else {
        setError(response.message || 'Email ou mot de passe invalide');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">🔐 Connexion</h1>
          <p className="auth-subtitle">
            Connectez-vous à votre compte French Learning Analytics Lab
          </p>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="votre.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <div className="auth-footer">
            <p>
              Pas encore de compte ?{' '}
              <a href="/signup" className="auth-link">
                Créer un compte
              </a>
            </p>
          </div>

          <div className="admin-info">
            <h3>👑 Compte Admin</h3>
            <p><strong>Email:</strong> admin@frenchlab.com</p>
            <p><strong>Mot de passe:</strong> AdminFrench2024!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

