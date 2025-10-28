import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <div className="badge-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
                </svg>
              </div>
              <span>Propulsé par l'Intelligence Artificielle</span>
            </div>
            
            <h1 className="hero-title">
              Maîtrisez le français avec
              <span className="gradient-text"> l'expertise de Matej</span>
            </h1>
            
            <p className="hero-subtitle">
              Une plateforme d'analyse linguistique avancée qui combine l'expérience pédagogique 
              de Matej avec la puissance de l'IA pour accélérer votre apprentissage du français.
            </p>
            
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary">
                <span>Commencer gratuitement</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/login" className="btn btn-outline">
                Se connecter
              </Link>
            </div>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Étudiants actifs</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Textes analysés</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">95%</div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="preview-title">Analyse en temps réel</div>
              </div>
              <div className="preview-content">
                <div className="analysis-card">
                  <div className="analysis-header">
                    <div className="analysis-icon">📝</div>
                    <div className="analysis-info">
                      <div className="analysis-title">Texte soumis</div>
                      <div className="analysis-time">Il y a 2 minutes</div>
                    </div>
                  </div>
                  <div className="analysis-progress">
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                    <span className="progress-text">Analyse en cours...</span>
                  </div>
                </div>
                
                <div className="results-card">
                  <div className="result-item">
                    <div className="result-icon">✓</div>
                    <div className="result-text">Grammaire corrigée</div>
                  </div>
                  <div className="result-item">
                    <div className="result-icon">📊</div>
                    <div className="result-text">Niveau B2 détecté</div>
                  </div>
                  <div className="result-item">
                    <div className="result-icon">🎯</div>
                    <div className="result-text">+15% de progression</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="features-header">
            <div className="section-badge">Fonctionnalités</div>
            <h2 className="section-title">
              Une solution complète pour l'apprentissage du français
            </h2>
            <p className="section-description">
              Découvrez comment notre plateforme révolutionne l'enseignement du français 
              grâce à l'intelligence artificielle et l'expertise pédagogique.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card primary">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Analyse Intelligente des Textes</h3>
              <p className="feature-description">
                Détection automatique des erreurs de grammaire, syntaxe, vocabulaire et conjugaison 
                avec des suggestions d'amélioration personnalisées.
              </p>
              <div className="feature-link">
                <span>En savoir plus</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Analyse des Productions Orales</h3>
              <p className="feature-description">
                Transcription automatique et analyse de la prononciation, fluidité 
                et précision linguistique de vos enregistrements audio.
              </p>
              <div className="feature-link">
                <span>En savoir plus</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Suivi de Progression Avancé</h3>
              <p className="feature-description">
                Tableaux de bord détaillés avec statistiques, rapports de progression 
                et recommandations adaptées à votre niveau CECRL.
              </p>
              <div className="feature-link">
                <span>En savoir plus</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Intelligence Artificielle Avancée</h3>
              <p className="feature-description">
                Algorithmes d'IA de dernière génération pour des analyses précises 
                et des suggestions d'amélioration personnalisées.
              </p>
              <div className="feature-link">
                <span>En savoir plus</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Espace Enseignants</h3>
              <p className="feature-description">
                Tableau de bord complet pour suivre les progrès de vos étudiants, 
                analyser les erreurs communes et adapter votre enseignement.
              </p>
              <div className="feature-link">
                <span>En savoir plus</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Synchronisation Cloud</h3>
              <p className="feature-description">
                Sauvegarde automatique et synchronisation de vos textes 
                depuis n'importe quel appareil (fonctionnalité à venir).
              </p>
              <div className="feature-link">
                <span>En savoir plus</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <div className="section-badge">Témoignages</div>
            <h2 className="section-title">
              Ce que disent nos utilisateurs
            </h2>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="testimonial-quote">
                  "La plateforme a révolutionné ma façon d'enseigner le français. 
                  L'analyse automatique me fait gagner un temps précieux."
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">M</div>
                  <div className="author-info">
                    <div className="author-name">Marie Dubois</div>
                    <div className="author-role">Professeure de FLE</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="testimonial-quote">
                  "En 3 mois, j'ai progressé de A2 à B1 grâce aux analyses 
                  personnalisées et aux recommandations de Matej."
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">A</div>
                  <div className="author-info">
                    <div className="author-name">Ahmed Al-Rashid</div>
                    <div className="author-role">Étudiant</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="testimonial-quote">
                  "L'interface est intuitive et les analyses sont d'une précision 
                  remarquable. Je recommande vivement !"
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">S</div>
                  <div className="author-info">
                    <div className="author-name">Sophie Chen</div>
                    <div className="author-role">Étudiante</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">
              Prêt à transformer votre apprentissage du français ?
            </h2>
            <p className="cta-description">
              Rejoignez plus de 500 étudiants et enseignants qui utilisent déjà 
              notre plateforme pour accélérer leur progression en français.
            </p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                <span>Commencer gratuitement</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Se connecter
              </Link>
            </div>
            <div className="cta-note">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
              </svg>
              <span>Gratuit • Aucune carte de crédit requise</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

