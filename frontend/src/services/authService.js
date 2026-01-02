/**
 * Authentication Service
 * Handles user authentication, login, signup, and session management
 */

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Response with success status and user info
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle errors properly
        let errorMessage = 'Erreur de connexion';
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg || err.message).join(', ');
          }
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }

      return {
        success: data.success,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        teacherId: data.user.teacher_email,
        students: data.user.students,
        texts_count: data.user.texts_count,
        message: data.message
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Erreur de connexion. Veuillez réessayer.'
      };
    }
  },

  /**
   * Sign up new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (student/teacher)
   * @param {string} teacherId - Optional teacher ID for students
   * @returns {Promise<Object>} Response with success status
   */
  async signup(email, password, name, role, teacherId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          teacher_email: teacherId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle Pydantic validation errors
        let errorMessage = 'Erreur lors de la création du compte';
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            // Pydantic validation errors format
            errorMessage = data.detail.map(err => err.msg || err.message).join(', ');
          } else if (typeof data.detail === 'object') {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }

      return {
        success: data.success,
        message: data.message
      };

    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'Erreur lors de la création du compte'
      };
    }
  },

  /**
   * Logout current user
   * @returns {Promise<Object>} Response with success status
   */
  async logout() {
    try {
      // TODO: Replace with actual API call when backend is ready
      
      // Clear any stored session data
      localStorage.removeItem('user_token');
      sessionStorage.clear();

      return {
        success: true,
        message: 'Déconnexion réussie'
      };

    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Erreur lors de la déconnexion'
      };
    }
  },

  /**
   * Get current user info
   * @returns {Promise<Object>} User information
   */
  async getCurrentUser() {
    try {
      // TODO: Replace with actual API call when backend is ready
      
      const token = localStorage.getItem('user_token');
      if (!token) {
        return {
          success: false,
          message: 'Non authentifié'
        };
      }

      return {
        success: true,
        user: {
          email: 'user@example.com',
          role: 'student'
        }
      };

    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des informations utilisateur'
      };
    }
  },

  /**
   * Get list of all teachers
   * @returns {Promise<Object>} List of teachers
   */
  async getTeachersList() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/teachers`);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          teachers: [],
          message: data.detail || 'Erreur lors de la récupération des enseignants'
        };
      }

      return {
        success: data.success,
        teachers: data.teachers
      };

    } catch (error) {
      console.error('Get teachers list error:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération de la liste des enseignants',
        teachers: []
      };
    }
  },

  /**
   * Assign teacher to student
   * @param {string} studentEmail - Student email
   * @param {string} teacherEmail - Teacher email (null to remove assignment)
   * @returns {Promise<Object>} Response with success status
   */
  async assignTeacher(studentEmail, teacherEmail) {
    try {
      // TODO: Replace with actual API call when backend is ready
      
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      
      if (!users[studentEmail]) {
        return {
          success: false,
          message: 'Étudiant non trouvé'
        };
      }

      // Update teacher assignment
      users[studentEmail].teacherId = teacherEmail;
      localStorage.setItem('users', JSON.stringify(users));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        success: true,
        message: teacherEmail ? 'Enseignant assigné avec succès' : 'Assignation retirée'
      };

    } catch (error) {
      console.error('Assign teacher error:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'assignation'
      };
    }
  }
};

export default authService;

