import { useState } from 'react';
import analysisService from '../services/analysisService';
import './Analysis.css';

const WrittenAnalysis = ({ userEmail }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!userEmail) {
      setError('Vous devez être connecté pour soumettre un texte');
      return;
    }

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
                ✅ Texte enregistré et en cours d'analyse !
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
                {loading ? '💾 Sauvegarde en cours...' : '💾 Sauvegarder'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrittenAnalysis;

