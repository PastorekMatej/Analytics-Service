import { useState } from 'react';
import studentService from '../services/studentService';
import './Analysis.css';

const WrittenAnalysis = ({ userEmail }) => {
  const [lessonId, setLessonId] = useState('');
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

    if (!lessonId.trim() || !message.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Save the conversation
      const saveResponse = await studentService.addConversation(userEmail, {
        message_id: lessonId.trim(),
        message: message.trim(),
        type: 'production_écrite'
      });

      if (saveResponse.success) {
        setSuccess(true);
        
        // Run analysis
        const analysisResponse = await studentService.runAnalysis(userEmail);
        
        if (analysisResponse.success) {
          setAnalysisResult(analysisResponse.result);
        }
        
        // Reset form
        setLessonId('');
        setMessage('');
      } else {
        setError(saveResponse.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      setError('Erreur lors de l\'analyse. Veuillez réessayer.');
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
                  <label htmlFor="lessonId" className="form-label">
                    Identifiant de la leçon
                  </label>
                  <input
                    type="text"
                    id="lessonId"
                    className="form-control"
                    placeholder="ex: leçon_1, exercice_5"
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Votre texte en français
                  </label>
                  <textarea
                    id="message"
                    className="form-control"
                    rows="10"
                    placeholder="Écrivez votre texte en français ici..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <p className="form-help">
                    Écrivez au moins quelques phrases pour une analyse complète
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={loading}
                >
                  {loading ? '🔍 Analyse en cours...' : '🚀 Enregistrer et Analyser'}
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
                    <span className="result-badge">✨ Analysé par l'IA</span>
                  </div>
                  <div className="result-content">
                    <pre>{analysisResult}</pre>
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

