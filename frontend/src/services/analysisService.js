/**
 * Analysis Service
 * Handles all analysis-related API calls
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api/analysis';

/**
 * Transcribe an uploaded file to text
 * @param {File} file - File to transcribe
 * @returns {Promise} Transcription result
 */
export const transcribeFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/transcribe-file`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || 'Erreur lors de la transcription';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Error transcribing file:', error);
    throw error;
  }
};

/**
 * Submit a text for analysis
 * @param {string} studentEmail - Student email
 * @param {string} textContent - Text to analyze
 * @param {string} textType - Type of text (written/oral)
 * @returns {Promise} Analysis result
 */
export const submitTextForAnalysis = async (studentEmail, textContent, textType = 'written') => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_email: studentEmail,
        text_content: textContent,
        text_type: textType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle Pydantic validation errors
      let errorMessage = 'Erreur lors de la soumission';
      if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
          // Pydantic validation errors format
          errorMessage = error.detail.map(err => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg || err.message || 'invalid'}`;
          }).join(', ');
        }
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting text:', error);
    throw error;
  }
};

/**
 * Get all analyses for a student
 * @param {string} studentEmail - Student email
 * @param {number} limit - Number of analyses to fetch
 * @param {number} offset - Pagination offset
 * @returns {Promise} List of analyses
 */
export const getStudentAnalyses = async (studentEmail, limit = 1000, offset = 0) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/student/${studentEmail}?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la récupération');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analyses:', error);
    throw error;
  }
};

/**
 * Get a specific analysis by ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise} Analysis details
 */
export const getAnalysisById = async (analysisId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Analyse non trouvée');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
};

/**
 * Delete an analysis
 * @param {string} analysisId - Analysis ID
 * @param {string} studentEmail - Student email
 * @returns {Promise} Success message
 */
export const deleteAnalysis = async (analysisId, studentEmail) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/analysis/${analysisId}?student_email=${studentEmail}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la suppression');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
};

/**
 * Mark analyses as read by teacher
 * @param {string} studentEmail - Student email
 * @param {string} teacherEmail - Teacher email
 * @returns {Promise} Success message
 */
export const markAnalysesAsRead = async (studentEmail, teacherEmail) => {
  try {
    const response = await fetch(`${API_BASE_URL}/mark-as-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_email: studentEmail,
        teacher_email: teacherEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la mise à jour');
    }

    return await response.json();
  } catch (error) {
    console.error('Error marking as read:', error);
    throw error;
  }
};

/**
 * Save a text without analysis
 * @param {string} studentEmail - Student email
 * @param {string} textContent - Text to save
 * @param {string} textType - Type of text (written/oral)
 * @returns {Promise} Save result
 */
export const saveTextOnly = async (studentEmail, textContent, textType = 'written') => {
  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_email: studentEmail,
        text_content: textContent,
        text_type: textType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle Pydantic validation errors
      let errorMessage = 'Erreur lors de la sauvegarde';
      if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
          // Pydantic validation errors format
          errorMessage = error.detail.map(err => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg || err.message || 'invalid'}`;
          }).join(', ');
        }
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving text:', error);
    throw error;
  }
};

/**
 * Mock data for development (when backend is not available)
 */
export const mockAnalysis = {
  success: true,
  analysis_id: 'mock-123',
  analysis: `## Niveau CECRL estimé
B1 - Utilisateur indépendant

## Erreurs identifiées
1. **Accord du participe passé**: "j'ai arrivée" → "je suis arrivée"
2. **Article défini**: "des gens qui je n'ai connu pas" → "des gens que je ne connais pas"
3. **Négation**: Placement incorrect de "pas"

## Points forts
- Vocabulaire varié et approprié
- Structure des phrases généralement correcte
- Bon usage des temps verbaux

## Suggestions d'amélioration
- Pratiquer l'accord des participes passés avec être/avoir
- Réviser le placement de la négation
- Attention aux articles définis et indéfinis

## Score global
72/100 - Niveau B1 confirmé avec des progrès notables`,
  texts_count: 5,
};

// Default export
const analysisService = {
  submitTextForAnalysis,
  saveTextOnly,
  getStudentAnalyses,
  getAnalysisById,
  deleteAnalysis,
  markAnalysesAsRead,
  transcribeFile,
  mockAnalysis,
};

export default analysisService;

