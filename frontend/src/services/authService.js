/**
 * Authentication Service
 * Handles user authentication, login, signup, and session management
 */

const API_BASE_URL = '/api';

const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Response with success status and user info
   */
  async login(email, password) {
    try {
      // TODO: Replace with actual API call when backend is ready
      // For now, simulate authentication with mock data
      
      // Built-in admin check
      if (email === 'admin@frenchlab.com' && password === 'AdminFrench2024!') {
        return {
          success: true,
          email: email,
          role: 'admin',
          message: 'Admin login successful'
        };
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock user data (replace with actual API call)
      const mockUsers = {
        'student@example.com': { password: 'student123', role: 'student', teacherId: 'teacher@example.com' },
        'student2@example.com': { password: 'student123', role: 'student', teacherId: null },
        'teacher@example.com': { password: 'teacher123', role: 'teacher' },
        'teacher2@example.com': { password: 'teacher123', role: 'teacher' }
      };

      const user = mockUsers[email];
      
      if (!user || user.password !== password) {
        return {
          success: false,
          message: 'Email ou mot de passe invalide'
        };
      }

      return {
        success: true,
        email: email,
        role: user.role,
        teacherId: user.teacherId || null,
        message: 'Login successful'
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
  async signup(email, password, role, teacherId = null) {
    try {
      // TODO: Replace with actual API call when backend is ready
      
      // Prevent signup with admin email
      if (email === 'admin@frenchlab.com') {
        return {
          success: false,
          message: 'Cet email est réservé pour le compte admin'
        };
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Store user data in localStorage (simulating database)
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      users[email] = { password, role, teacherId };
      localStorage.setItem('users', JSON.stringify(users));

      // Simulate successful signup
      return {
        success: true,
        message: 'Compte créé avec succès'
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
      // TODO: Replace with actual API call when backend is ready
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Mock teachers list
      const teachers = [
        { email: 'teacher@example.com', name: 'Prof. Dubois' },
        { email: 'teacher2@example.com', name: 'Prof. Martin' },
        { email: 'admin@frenchlab.com', name: 'Administrateur' }
      ];

      return {
        success: true,
        teachers: teachers
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

