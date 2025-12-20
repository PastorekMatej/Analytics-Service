import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, Upload, Trash2, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import analysisService from '../services/analysisService';

// Status badge component
const StatusBadge = ({ status }) => {
  if (status === 'analyzed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
        Analyzed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
      Pending
    </span>
  );
};

// Text item component - Grid Card Version
const TextItem = ({ text, date, status, onDelete, isDeleting }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col bg-white border border-slate-200 rounded-2xl p-5 transition-all hover:shadow-md hover:border-slate-300 min-h-[240px] group"
    >
      {/* Text Preview on Top */}
      <div className="flex-1 mb-4">
        <div className="text-sm leading-relaxed text-slate-700 line-clamp-4">
          {text}
        </div>
      </div>

      {/* Metadata and Status Badge in Middle */}
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 font-medium">{date}</span>
        </div>
        <div className="flex items-start">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Delete Button in Bottom-Right Corner */}
      <div className="flex justify-end mt-auto">
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl border border-red-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete this text"
        >
          {isDeleting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={14} />
              Delete
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const WrittenAnalysis = ({ userEmail }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [texts, setTexts] = useState([]);
  const [textsLoading, setTextsLoading] = useState(false);
  const [deletingTextId, setDeletingTextId] = useState(null);

  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  // Fetch texts on mount and when userEmail changes
  useEffect(() => {
    if (userEmail) {
      refreshTexts();
    }
  }, [userEmail]);

  // Refresh texts list
  const refreshTexts = async () => {
    if (!userEmail) return;

    setTextsLoading(true);
    try {
      const response = await analysisService.getStudentAnalyses(userEmail);
      // Filter for written texts only and sort by date (most recent first)
      const writtenTexts = (response.analyses || [])
        .filter(text => text.text_type === 'written' || !text.text_type)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTexts(writtenTexts);
    } catch (err) {
      console.error('Error fetching texts:', err);
      setTexts([]);
    } finally {
      setTextsLoading(false);
    }
  };

  // Handle text deletion
  const handleDeleteText = async (textId) => {
    if (!userEmail) {
      setError('You must be logged in to delete a text');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this text? This action cannot be undone.')) {
      return;
    }

    setDeletingTextId(textId);
    try {
      await analysisService.deleteAnalysis(textId, userEmail);
      // Refresh texts list after deletion
      await refreshTexts();
    } catch (err) {
      console.error('Error deleting text:', err);
      setError(err.message || 'Error deleting text. Please try again.');
    } finally {
      setDeletingTextId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Truncate text preview
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

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
        
        // Refresh texts list
        await refreshTexts();
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
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Written Text Analysis</h1>
            <p className="text-sm text-slate-500">
              Submit your written French texts for comprehensive AI analysis and expert feedback
            </p>
          </div>

          {/* New Text Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8"
          >
            <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                <FileText size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">New Text</h2>
                <p className="text-sm text-slate-500">Write your French text for analysis</p>
              </div>
            </div>

            <div className="p-8">
              {/* Alert Messages */}
              {error && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle size={20} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <span>Text saved successfully!</span>
                </div>
              )}

              {fileError && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle size={20} className="shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {infoMessage && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
                  <Info size={20} className="shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Upload a file for transcription
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      disabled={transcriptionLoading}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-all shadow-sm ${
                        transcriptionLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload size={16} />
                      Choose file
                    </label>
                    {selectedFile && (
                      <p className="text-xs text-slate-600 mt-3 font-medium">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        {transcriptionLoading && ' — transcription en cours...'}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-3">
                      Formats: PDF, DOC/DOCX, TXT. Maximum size 25MB. Text is not corrected.
                    </p>
                  </div>
                </div>

                {/* Text Area */}
                <div className="mb-6">
                  <label htmlFor="message" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Your French text
                  </label>
                  <div className="relative">
                    <textarea
                      id="message"
                      rows={12}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your French text here...&#10;&#10;Example:&#10;Yesterday, I went to the market with my family. We bought fresh vegetables and fruits. I really like shopping because I can see many interesting things..."
                      required
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 resize-vertical min-h-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Write at least a few complete sentences for detailed analysis
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || transcriptionLoading}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Saved Texts Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                <FileText size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">My Saved Texts</h2>
                <p className="text-sm text-slate-500">View and manage your saved texts</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{texts.length}</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Texts</p>
              </div>
            </div>

            <div className="p-8">
              {textsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
                  <p className="text-sm text-slate-500">Loading your texts...</p>
                </div>
              ) : texts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText size={48} className="text-slate-300 mb-4" />
                  <p className="text-sm font-medium text-slate-700 mb-1">No saved texts yet</p>
                  <p className="text-xs text-slate-500">Save your first text using the form above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {texts.map((text) => (
                    <TextItem
                      key={text.id}
                      text={truncateText(text.text_content)}
                      date={formatDate(text.created_at)}
                      status={text.analysis_result ? 'analyzed' : 'pending'}
                      onDelete={() => handleDeleteText(text.id)}
                      isDeleting={deletingTextId === text.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default WrittenAnalysis;
