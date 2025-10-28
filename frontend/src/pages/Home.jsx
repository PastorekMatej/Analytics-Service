import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
            </svg>
            Propulsé par l'IA
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">Matej Language Lab</span>
          </h1>
          <p className="hero-subtitle">
            Expérience et le savoir faire de Matej fusionnée à l'intelligence artificielle au service de votre maîtrise du français
          </p>
          <p className="hero-description">
            Analysez vos textes et productions orales avec la puissance de l'IA. 
            Recevez des feedbacks personnalisés et suivez votre progression en temps réel.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">
              <span>Commencer gratuitement</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Se connecter
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-badge level-a1">A1</div>
              <div className="stat-label">Débutant</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-badge level-a2">A2</div>
              <div className="stat-label">Élémentaire</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-badge level-b1">B1</div>
              <div className="stat-label">Intermédiaire</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-badge level-b2">B2</div>
              <div className="stat-label">Avancé</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-badge level-c1">C1</div>
              <div className="stat-label">Autonome</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-badge level-c2">C2</div>
              <div className="stat-label">Maîtrise</div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-icon">✓</div>
            <div className="card-text">Grammaire parfaite</div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">📊</div>
            <div className="card-text">Progression +45%</div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">🎯</div>
            <div className="card-text">Niveau B2</div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Fonctionnalités</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3 className="feature-title">Analyse des Textes Écrits</h3>
            <p className="feature-description">
              Analysez vos productions écrites en français avec l'Intelligence Artificielle. 
              Détection automatique des erreurs de grammaire, syntaxe, vocabulaire et conjugaison.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3 className="feature-title">Analyse des Productions Orales</h3>
            <p className="feature-description">
              Transcription automatique de vos enregistrements audio avec analyse 
              de la prononciation, fluidité et précision linguistique.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3 className="feature-title">Suivi de Progression</h3>
            <p className="feature-description">
              Visualisez votre progression dans le temps avec des rapports détaillés, 
              des statistiques et des recommandations personnalisées.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">Intelligence Artificielle</h3>
            <p className="feature-description">
              Propulsé par l'Intelligence Artificielle pour des analyses précises et des suggestions 
              d'amélioration adaptées à votre niveau.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3 className="feature-title">Pour les Enseignants</h3>
            <p className="feature-description">
              Tableau de bord complet pour suivre les progrès de vos étudiants, 
              analyser les erreurs communes et adapter votre enseignement.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3 className="feature-title">Sauvegarde Automatique</h3>
            <p className="feature-description">
              Sauvegardez automatiquement tous vos textes depuis n'importe quelle 
              application sur votre ordinateur (à venir).
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Prêt à améliorer votre français ?</h2>
          <p className="cta-description">
            Rejoignez des centaines d'étudiants qui utilisent notre plateforme pour progresser en français.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Créer un compte gratuit
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

