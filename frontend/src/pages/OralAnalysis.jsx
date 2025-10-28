import { useState } from 'react';
import './Analysis.css';

const OralAnalysis = ({ userEmail }) => {
  const [recording, setRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!audioFile) {
      setError('Veuillez sélectionner un fichier audio');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate transcription and analysis
    // TODO: Implement real TTS transcription with Google Meet integration
    setTimeout(() => {
      setTranscription(
        'Voici la transcription simulée de votre enregistrement audio. ' +
        'La vraie transcription sera disponible après l\'intégration Google Meet.'
      );
      setAnalysisResult(
        '📊 Analyse de la production orale:\n\n' +
        '✅ Points forts:\n' +
        '- Bonne prononciation générale\n' +
        '- Fluidité satisfaisante\n\n' +
        '⚠️ Points à améliorer:\n' +
        '- Travaillez sur les liaisons\n' +
        '- Attention aux accents toniques\n\n' +
        '💡 Recommandations:\n' +
        '- Pratiquez la lecture à voix haute\n' +
        '- Écoutez des podcasts en français'
      );
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="analysis-page">
      <div className="page-header">
        <h1 className="page-title">🎤 Analyse des Productions Orales</h1>
        <p className="page-description">
          Enregistrez ou importez un fichier audio pour une analyse complète de votre français oral
        </p>
      </div>

      <div className="analysis-grid">
        {/* Upload/Record Section */}
        <div className="analysis-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Enregistrement Audio</h2>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <div className="audio-upload">
                <div className="upload-icon">🎙️</div>
                <h3>Importer un fichier audio</h3>
                <p className="text-secondary">
                  Formats acceptés: MP3, WAV, M4A
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="file-input"
                  id="audio-file"
                />
                <label htmlFor="audio-file" className="btn btn-secondary">
                  Choisir un fichier
                </label>
                
                {audioFile && (
                  <div className="file-selected">
                    ✅ Fichier sélectionné: {audioFile.name}
                  </div>
                )}
              </div>

              <div className="divider">ou</div>

              <div className="recording-section">
                <button
                  className={`btn ${recording ? 'btn-danger' : 'btn-primary'} btn-lg w-full`}
                  onClick={() => setRecording(!recording)}
                >
                  {recording ? '⏹️ Arrêter l\'enregistrement' : '🎤 Commencer l\'enregistrement'}
                </button>
                
                {recording && (
                  <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    Enregistrement en cours...
                  </div>
                )}
              </div>

              <button
                className="btn btn-success btn-lg w-full mt-4"
                onClick={handleAnalyze}
                disabled={!audioFile || loading}
              >
                {loading ? '🔍 Analyse en cours...' : '🚀 Transcrire et Analyser'}
              </button>
            </div>
          </div>

          {/* Google Meet Integration Notice */}
          <div className="card mt-4 integration-notice">
            <div className="card-header">
              <h3 className="card-title">🎥 Intégration Google Meet</h3>
            </div>
            <div className="card-body">
              <p><strong>Bientôt disponible:</strong></p>
              <ul className="tips-list">
                <li>Transcription automatique des réunions Google Meet</li>
                <li>Analyse en temps réel de vos productions orales</li>
                <li>Calibration TTS spécialisée pour le français FLE</li>
                <li>Sauvegarde automatique des transcriptions</li>
              </ul>
              <span className="badge badge-planned">Phase 4-5 - En développement</span>
            </div>
          </div>
        </div>

        {/* Transcription & Analysis Section */}
        <div className="analysis-section">
          {/* Transcription Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Transcription</h2>
            </div>
            <div className="card-body">
              {loading && (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Transcription en cours...</p>
                </div>
              )}

              {!loading && !transcription && (
                <div className="placeholder">
                  <p>📝 La transcription apparaîtra ici</p>
                </div>
              )}

              {transcription && (
                <div className="transcription-result">
                  <p>{transcription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Result Card */}
          <div className="card mt-4">
            <div className="card-header">
              <h2 className="card-title">Analyse de la Production Orale</h2>
            </div>
            <div className="card-body">
              {!analysisResult && !loading && (
                <div className="placeholder">
                  <p>📊 L'analyse apparaîtra ici après la transcription</p>
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
        </div>
      </div>
    </div>
  );
};

export default OralAnalysis;

