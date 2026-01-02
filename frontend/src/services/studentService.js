/**
 * Student Service
 * Handles student data, conversations, and analysis operations
 */

import { parseProgressData } from '../utils/analysisParser';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

const studentService = {
  /**
   * Get student conversations
   * @param {string} studentEmail - Student email
   * @returns {Promise<Object>} Student conversations data
   */
  async getConversations(studentEmail) {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/students/${studentEmail}/conversations`);
      // const data = await response.json();
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: {
          student_id: studentEmail,
          conversations: []
        }
      };

    } catch (error) {
      console.error('Get conversations error:', error);
      return {
        success: false,
        message: 'Erreur lors du chargement des conversations'
      };
    }
  },

  /**
   * Add new conversation/text
   * @param {string} studentEmail - Student email
   * @param {Object} conversation - Conversation data
   * @returns {Promise<Object>} Response with success status
   */
  async addConversation(studentEmail, conversation) {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/students/${studentEmail}/conversations`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(conversation)
      // });
      
      // Mock successful save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'Texte enregistré avec succès'
      };

    } catch (error) {
      console.error('Add conversation error:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'enregistrement du texte'
      };
    }
  },

  /**
   * Run error analysis on student texts
   * @param {string} studentEmail - Student email
   * @returns {Promise<Object>} Analysis results
   */
  async runAnalysis(studentEmail) {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/students/${studentEmail}/analyze`, {
      //   method: 'POST'
      // });
      
      // Mock analysis result
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis = `📊 Analyse IA - Rapport d'erreurs linguistiques

✅ POINTS FORTS:
- Bonne structure générale du texte
- Vocabulaire varié et approprié
- Utilisation correcte des temps simples

⚠️ ERREURS IDENTIFIÉES:

1. Grammaire (3 erreurs):
   - Accord sujet-verbe manquant (ligne 2)
   - Pronom relatif incorrect (ligne 5)
   - Article manquant devant nom (ligne 8)

2. Conjugaison (2 erreurs):
   - Temps incorrect: "j'ai allé" → "je suis allé" (ligne 3)
   - Mode incorrect: "il faut que je vais" → "il faut que j'aille" (ligne 6)

3. Orthographe (1 erreur):
   - "apartement" → "appartement" (ligne 4)

💡 RECOMMANDATIONS:
- Réviser les auxiliaires être/avoir au passé composé
- Pratiquer le subjonctif présent
- Attention aux accords sujet-verbe

📈 PROGRESSION:
Niveau actuel estimé: A2+/B1
Prochain objectif: Maîtriser le subjonctif et les pronoms relatifs`;

      return {
        success: true,
        result: mockAnalysis
      };

    } catch (error) {
      console.error('Run analysis error:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'analyse'
      };
    }
  },

  /**
   * Get student analysis history
   * @param {string} studentEmail - Student email
   * @returns {Promise<Object>} Analysis history
   */
  async getAnalysisHistory(studentEmail) {
    try {
      // TODO: Replace with actual API call when backend is ready
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: {
          student_id: studentEmail,
          analyses: []
        }
      };

    } catch (error) {
      console.error('Get analysis history error:', error);
      return {
        success: false,
        message: 'Erreur lors du chargement de l\'historique'
      };
    }
  },

  /**
   * Get student progress data
   * @param {string} studentEmail - Student email
   * @returns {Promise<Object>} Progress data with conversations and analyses
   */
  async getProgress(studentEmail) {
    try {
      // Fetch all analyses for the student
      const response = await fetch(`${API_BASE_URL}/analysis/student/${studentEmail}`);
      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          message: data.message || 'Error loading progress'
        };
      }
      
      // Parse analyses into progress data
      const progressData = parseProgressData(data.analyses || []);
      
      return {
        success: true,
        data: {
          student_email: studentEmail,
          progress_data: progressData,
          total_analyses: data.analyses?.length || 0
        }
      };
    } catch (error) {
      console.error('Get progress error:', error);
      return {
        success: false,
        message: 'Error loading progress'
      };
    }
  }
};

export default studentService;

