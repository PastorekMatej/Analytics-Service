/**
 * Audio Service
 * Handles all audio-related API calls for uploading recorded audio files
 */

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/audio`
  : 'http://127.0.0.1:8000/api/audio';

/**
 * Upload an audio file from a video call recording
 * @param {Blob} audioBlob - Audio blob to upload
 * @param {string} userEmail - User email
 * @param {string} sessionId - Session ID for the call
 * @param {number} duration - Duration in seconds
 * @returns {Promise} Upload result
 */
export const uploadAudioRecording = async (audioBlob, userEmail, sessionId, duration) => {
  const formData = new FormData();
  
  // Create a File object from the Blob
  const fileName = `recording-${sessionId}-${Date.now()}.webm`;
  const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });
  formData.append('file', audioFile);
  formData.append('user_email', userEmail);
  formData.append('session_id', sessionId);
  formData.append('duration', duration.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || 'Erreur lors de l\'upload de l\'enregistrement';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};

/**
 * Get all audio sessions for a user
 * @param {string} userEmail - User email
 * @returns {Promise} List of audio sessions
 */
export const getAudioSessions = async (userEmail) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions?user_email=${encodeURIComponent(userEmail)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la récupération des sessions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching audio sessions:', error);
    throw error;
  }
};

/**
 * Get a specific audio session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise} Audio session details
 */
export const getAudioSessionById = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Session non trouvée');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching audio session:', error);
    throw error;
  }
};

/**
 * Delete an audio session
 * @param {string} sessionId - Session ID
 * @param {string} userEmail - User email (for verification)
 * @returns {Promise} Success message
 */
export const deleteAudioSession = async (sessionId, userEmail) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sessions/${sessionId}?user_email=${encodeURIComponent(userEmail)}`,
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
    console.error('Error deleting audio session:', error);
    throw error;
  }
};

// Default export
const audioService = {
  uploadAudioRecording,
  getAudioSessions,
  getAudioSessionById,
  deleteAudioSession,
};

export default audioService;





