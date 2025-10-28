import { useState } from 'react';
import analysisService from '../services/analysisService';
import './Analysis.css';

const WrittenAnalysis = ({ userEmail }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setAnalysisResult(null);

    if (!message.trim()) {
      setError('Veuillez entrer un texte à analyser');
      return;
    }

    setLoading(true);

    try {
      // Submit text for analysis
      const response = await analysisService.submitTextForAnalysis(
        userEmail,
        message.trim(),
        'written'
      );

      if (response.success) {
        setSuccess(true);
        setAnalysisResult(response.analysis);
        
        // Reset form
        setMessage('');
      } else {
        setError(response.message || 'Erreur lors de l\'analyse');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Erreur lors de l\'analyse. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analysis-page">
      <div className="page-header">
        <h1 className="page-title">📝 Analyse des Textes Écrits</h1>
        <p className="page-description">
          Soumettez vos productions écrites en français pour une analyse complète avec l'Intelligence Artificielle
        </p>
      </div>

      <div className="analysis-grid">
        {/* Input Section */}
        <div className="analysis-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Nouveau Texte</h2>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  ✅ Texte enregistré et analysé avec succès !
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Votre texte en français
                  </label>
                  <textarea
                    id="message"
                    className="form-control"
                    rows="12"
                    placeholder="Écrivez votre texte en français ici...

Exemple:
Hier, je suis allé au marché avec ma famille. Nous avons acheté des légumes frais et des fruits. J'aime beaucoup faire les courses parce que je peux voir beaucoup de choses intéressantes..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <p className="form-help">
                    Écrivez au moins quelques phrases complètes pour une analyse détaillée
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={loading}
                >
                  {loading ? '🔍 Analyse IA en cours...' : '🚀 Analyser mon texte'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Analysis Result Section */}
        <div className="analysis-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Résultat de l'Analyse</h2>
            </div>
            <div className="card-body">
              {loading && (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Analyse IA en cours...</p>
                </div>
              )}

              {!loading && !analysisResult && (
                <div className="placeholder">
                  <p>📊 Soumettez un texte pour voir l'analyse ici</p>
                  <p className="text-secondary">
                    L'IA analysera votre texte et fournira des recommandations détaillées
                  </p>
                </div>
              )}

              {analysisResult && (
                <div className="analysis-result">
                  <div className="result-header">
                    <span className="result-badge">✨ Analyse IA</span>
                    <span className="result-date">
                      {new Date().toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="result-content">
                    <div className="analysis-text">
                      {analysisResult.split('\n').map((line, index) => {
                        // Handle headers (## Titre)
                        if (line.startsWith('## ')) {
                          return (
                            <h3 key={index} className="analysis-section-title">
                              {line.replace('## ', '')}
                            </h3>
                          );
                        }
                        // Handle bold text (**texte**)
                        if (line.includes('**')) {
                          const parts = line.split(/(\*\*[^*]+\*\*)/g);
                          return (
                            <p key={index} className="analysis-paragraph">
                              {parts.map((part, i) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <strong key={i}>
                                      {part.replace(/\*\*/g, '')}
                                    </strong>
                                  );
                                }
                                return part;
                              })}
                            </p>
                          );
                        }
                        // Handle list items
                        if (line.trim().startsWith('-')) {
                          return (
                            <li key={index} className="analysis-list-item">
                              {line.replace(/^-\s*/, '')}
                            </li>
                          );
                        }
                        // Handle numbered items
                        if (line.match(/^\d+\./)) {
                          return (
                            <li key={index} className="analysis-list-item">
                              {line.replace(/^\d+\.\s*/, '')}
                            </li>
                          );
                        }
                        // Empty lines
                        if (line.trim() === '') {
                          return <br key={index} />;
                        }
                        // Regular paragraphs
                        return (
                          <p key={index} className="analysis-paragraph">
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips Card */}
          <div className="card mt-4">
            <div className="card-header">
              <h3 className="card-title">💡 Conseils</h3>
            </div>
            <div className="card-body">
              <ul className="tips-list">
                <li>Écrivez au moins 3-4 phrases complètes</li>
                <li>Utilisez un français naturel, ne vous inquiétez pas des erreurs</li>
                <li>L'IA détectera les erreurs de grammaire, vocabulaire et syntaxe</li>
                <li>Consultez régulièrement votre progression dans l'onglet "Mon Progrès"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrittenAnalysis;

