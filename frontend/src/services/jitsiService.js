/**
 * Jitsi Service
 * Handles JaaS JWT token generation via backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

export const getJitsiToken = async (roomName, userEmail, moderator = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/jitsi/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room_name: roomName,
        user_email: userEmail,
        ...(moderator !== null ? { moderator } : {})
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = 'Erreur lors de la génération du token Jitsi';
      if (data?.detail) {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map(err => err.msg || err.message).join(', ');
        }
      }
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Jitsi token error:', error);
    throw error;
  }
};
