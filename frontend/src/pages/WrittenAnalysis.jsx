import { useState } from 'react';
import analysisService from '../services/analysisService';
import './Analysis.css';

const WrittenAnalysis = ({ userEmail }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    setInfoMessage('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setFileError('Format non pris en charge. Utilisez PDF, DOC/DOCX ou TXT.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setFileError('Fichier trop volumineux (max 25MB).');
      return;
    }

    setSelectedFile(file);
    // Auto-start transcription once the file is validated
    handleTranscription(file);
  };

  const handleTranscription = async (fileToTranscribe = null) => {
    const file = fileToTranscribe || selectedFile;

    if (!userEmail) {
      setError('You must be logged in to transcribe a file');
      return;
    }

    if (!file) {
      setFileError('Veuillez sélectionner un fichier à transcrire.');
      return;
    }

    setError('');
    setSuccess(false);
    setFileError('');
    setInfoMessage('');
    setTranscriptionLoading(true);
    setInfoMessage('Transcription en cours...');

    try {
      const response = await analysisService.transcribeFile(file);
      setMessage(response.transcript || '');
      setInfoMessage('Transcription terminée. Le texte est prêt pour enregistrement.');
    } catch (err) {
      setFileError(err.message || 'Erreur lors de la transcription.');
    } finally {
      setTranscriptionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setInfoMessage('');

    if (!userEmail) {
      setError('You must be logged in to save a text');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a text to save');
      return;
    }

    setLoading(true);

    try {
      // Save text without analysis
      const response = await analysisService.saveTextOnly(
        userEmail,
        message.trim(),
        'written'
      );

      if (response.success) {
        setSuccess(true);
        
        // Reset form
        setMessage('');
        setSelectedFile(null);
      } else {
        setError(response.message || 'Error saving text');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Error saving text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analysis-page">
      <div className="page-background">
        <div className="page-gradient"></div>
        <div className="page-pattern"></div>
      </div>
      
      <div className="page-container">
        <div className="page-header">
          <div className="page-badge">
            <div className="badge-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
              </svg>
            </div>
            <span>AI Analysis</span>
          </div>
          
          <h1 className="page-title">
            <span className="gradient-text">Written Text</span> Analysis
          </h1>
          
          <p className="page-description">
            Submit your written French texts for comprehensive analysis 
            with artificial intelligence and Maister's pedagogical expertise.
          </p>
        </div>

        <div className="analysis-section">
          <div className="card">
            <div className="card-header">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <h2 className="card-title">New Text</h2>
              <p className="card-subtitle">Write your French text for analysis</p>
            </div>
            
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Text saved successfully!
                </div>
              )}

              {fileError && (
                <div className="alert alert-danger">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  {fileError}
                </div>
              )}

              {infoMessage && (
                <div className="alert alert-info">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  {infoMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="file-upload" className="form-label">
                    Upload a file for transcription
                  </label>
                  <div className="file-upload">
                    <input
                      id="file-upload"
                      type="file"
                        className="file-input"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      disabled={transcriptionLoading}
                    />
                    <label htmlFor="file-upload" className="btn btn-outline">
                      Choose file
                    </label>
                    <p className="form-help">
                      Formats: PDF, DOC/DOCX, TXT. Taille maximale 25MB. Le texte n&apos;est pas corrigé.
                    </p>
                    {selectedFile && (
                      <div className="file-selected">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        {transcriptionLoading && ' — transcription en cours...'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Your French text
                  </label>
                  <div className="textarea-wrapper">
                    <textarea
                      id="message"
                      className="form-control"
                      rows="12"
                      placeholder="Write your French text here...

Example:
Yesterday, I went to the market with my family. We bought fresh vegetables and fruits. I really like shopping because I can see many interesting things..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>
                  <p className="form-help">
                    Write at least a few complete sentences for detailed analysis
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={loading || transcriptionLoading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrittenAnalysis;

