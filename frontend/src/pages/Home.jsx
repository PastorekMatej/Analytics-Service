import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            🔬 French Learning Analytics Lab
          </h1>
          <p className="hero-subtitle">
            Plateforme d'analyse avancée pour l'apprentissage du français langue étrangère
          </p>
          <p className="hero-description">
            Utilisez l'intelligence artificielle pour analyser vos productions écrites et orales en français.
            Recevez des retours personnalisés et suivez votre progression.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Commencer maintenant
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Se connecter
            </Link>
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
              Analysez vos productions écrites en français avec l'IA GPT-5. 
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
              Propulsé par OpenAI GPT-5 pour des analyses précises et des suggestions 
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

