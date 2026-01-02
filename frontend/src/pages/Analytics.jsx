"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, TrendingUp, TrendingDown, Award, Calendar, BookOpen, MessageSquare, Clock, Target, CheckCircle2, AlertCircle, Send, FileText, Mic, PenTool, BookMarked, BarChart3, Star, ArrowRight, Search, Users, TrendingUpDown, Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import analysisService from '../services/analysisService';
import studentService from '../services/studentService';
import { 
  getSkillPerformanceData, 
  getCompetencyData, 
  extractScore, 
  extractCEFRLevel,
  getAggregatedEvolutionTrends,
  getAggregatedPersistentErrors
} from '../utils/analysisParser';

// CEFR Level color coding
const LEVEL_COLORS = {
  'A1': '#fee2e2',
  'A1+': '#fef3c7',
  'A2': '#fef9c3',
  'A2+': '#ecfdf5',
  'B1': '#dcfce7',
  'B1+': '#f0fdf4',
  'B2': '#f0fdf4',
  'B2+': '#e0f2fe',
  'C1': '#eff6ff',
  'C1+': '#dbeafe',
  'C2': '#f5f3ff',
  'C2+': '#ede9fe'
};

// Mock analytics performance data
const SKILL_PERFORMANCE = [{
  skill: 'Richesse lexicale',
  score: 48,
  maxScore: 100,
  color: '#6366f1'
}, {
  skill: 'Précision lexicale',
  score: 42,
  maxScore: 100,
  color: '#8b5cf6'
}, {
  skill: 'Grammaire (temps, modes, conjugaison, accords)',
  score: 51,
  maxScore: 100,
  color: '#06b6d4'
}, {
  skill: 'Syntaxe (ordre des mots, phrases complexes)',
  score: 45,
  maxScore: 100,
  color: '#14b8a6'
}, {
  skill: 'Organisation du texte (cohérence, structure, connecteurs logiques)',
  score: 47,
  maxScore: 100,
  color: '#10b981'
}];

// Radar chart data for competency breakdown
const COMPETENCY_DATA = [{
  competency: 'Richesse lexicale',
  value: 48,
  fullMark: 100
}, {
  competency: 'Précision lexicale',
  value: 42,
  fullMark: 100
}, {
  competency: 'Grammaire',
  value: 51,
  fullMark: 100
}, {
  competency: 'Syntaxe',
  value: 45,
  fullMark: 100
}, {
  competency: 'Organisation du texte',
  value: 47,
  fullMark: 100
}];

// Recent analytics activities
const RECENT_ACTIVITIES = [{
  id: 1,
  date: '2024-10-20',
  type: 'Écriture',
  title: 'Analyse écrite complétée',
  score: 48,
  level: 'B1+',
  feedback: 'Analyse détaillée des compétences écrites avec amélioration notable dans la structure.',
  strengths: ['Structure claire', 'Vocabulaire varié', 'Bon usage des connecteurs'],
  weaknesses: ['Accord des participes passés', 'Prépositions temporelles'],
  icon: FileText
}, {
  id: 2,
  date: '2024-10-18',
  type: 'Expression Orale',
  title: 'Analyse orale complétée',
  score: 42,
  level: 'B1',
  feedback: 'Amélioration notable dans la fluidité. Prononciation encore à travailler.',
  strengths: ['Confiance accrue', 'Bonne intonation', 'Moins d\'hésitations'],
  weaknesses: ['Voyelles nasales', 'Liaisons obligatoires'],
  icon: Mic
}, {
  id: 3,
  date: '2024-10-15',
  type: 'Écriture',
  title: 'Analyse écrite complétée',
  score: 45,
  level: 'B1+',
  feedback: 'Excellente structure narrative. Quelques erreurs de conjugaison persistent.',
  strengths: ['Structure claire', 'Vocabulaire varié'],
  weaknesses: ['Accord des participes passés'],
  icon: PenTool
}];

// Recommended focus areas
const RECOMMENDED_FOCUS = [{
  area: 'Accord des participes passés',
  priority: 'high',
  estimatedTime: '2 semaines'
}, {
  area: 'Prononciation des voyelles nasales',
  priority: 'high',
  estimatedTime: '3 semaines'
}, {
  area: 'Prépositions temporelles',
  priority: 'medium',
  estimatedTime: '1 semaine'
}, {
  area: 'Liaisons obligatoires',
  priority: 'medium',
  estimatedTime: '2 semaines'
}];

const Analytics = ({ userEmail: propUserEmail, userRole: propUserRole }) => {
  const navigate = useNavigate();
  const [activeActivity, setActiveActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(propUserEmail || null);
  const [userRole, setUserRole] = useState(propUserRole || 'student');
  const [selectedStudentEmail, setSelectedStudentEmail] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  
  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  
  // Analytics data
  const [skillPerformance, setSkillPerformance] = useState(null);
  const [competencyData, setCompetencyData] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);
  const [level, setLevel] = useState('A1');
  const [progressData, setProgressData] = useState([]);
  const [evolutionTrends, setEvolutionTrends] = useState([]);
  const [persistentErrors, setPersistentErrors] = useState([]);
  const [lastReportDate, setLastReportDate] = useState(null);
  
  const scoreChange = currentScore - previousScore;
  const improvementPercentage = previousScore > 0 ? (scoreChange / previousScore * 100).toFixed(1) : '0';
  const studentName = selectedStudentEmail 
    ? (availableStudents.find(s => s.email === selectedStudentEmail)?.name || selectedStudentEmail.split('@')[0])
    : (userEmail ? userEmail.split('@')[0] : 'User');
  
  // Load user data and analytics
  useEffect(() => {
    const loadUserAndAnalytics = async () => {
      try {
        // Use props if available, otherwise try localStorage
        let email = propUserEmail;
        let role = propUserRole;
        
        if (!email || !role) {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            email = user.email;
            role = user.role;
            setUserEmail(email);
            setUserRole(role);
          }
        } else {
          setUserEmail(email);
          setUserRole(role);
        }
        
        if (email && role) {
          if (role === 'student') {
            setSelectedStudentEmail(email);
            await loadAnalyticsData(email);
          } else if (role === 'teacher' || role === 'admin') {
            await loadTeacherStudents(email);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Error loading analytics data');
        setLoading(false);
      }
    };
    
    loadUserAndAnalytics();
  }, [propUserEmail, propUserRole]);
  
  // Load analytics data for a specific student
  const loadAnalyticsData = async (studentEmail) => {
    if (!studentEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch analyses
      const analysesResponse = await analysisService.getStudentAnalyses(studentEmail, 100, 0);
      
      if (analysesResponse.success && analysesResponse.analyses) {
        const analyses = analysesResponse.analyses.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA; // Most recent first
        });
        
        // Find the most recent report with analysis_result (generated report)
        // Filter analyses that have a generated report (analysis_result exists and is not empty)
        const generatedReports = analyses.filter(a => {
          if (!a.analysis_result) return false;
          if (typeof a.analysis_result === 'string') {
            return a.analysis_result.trim().length > 0;
          }
          return true; // Object or other non-empty value
        });
        
        // Sort generated reports by report_generated_at (if available) or created_at, most recent first
        generatedReports.sort((a, b) => {
          const dateA = a.report_generated_at || a.created_at || '';
          const dateB = b.report_generated_at || b.created_at || '';
          return dateB.localeCompare(dateA); // Most recent first (ISO strings compare correctly)
        });
        
        // Get the most recent one (first in sorted array)
        if (generatedReports.length > 0) {
          // Prefer report_generated_at, fallback to created_at
          const reportDate = generatedReports[0].report_generated_at || generatedReports[0].created_at;
          if (reportDate) {
            console.log('[Analytics] Last report date (raw):', reportDate);
            console.log('[Analytics] Last report date (parsed):', new Date(reportDate));
            console.log('[Analytics] Using report_generated_at:', !!generatedReports[0].report_generated_at);
            setLastReportDate(reportDate);
          } else {
            setLastReportDate(null);
          }
        } else {
          setLastReportDate(null);
        }
        
        // Extract skill performance data
        const skillData = getSkillPerformanceData(analyses);
        const competency = getCompetencyData(analyses);
        
        setSkillPerformance(skillData);
        setCompetencyData(competency);
        
        // Extract evolution trends and persistent errors from most recent analysis
        if (analyses.length > 0 && analyses[0].analysis_result) {
          const trends = getAggregatedEvolutionTrends(analyses);
          const errors = getAggregatedPersistentErrors(analyses);
          setEvolutionTrends(trends);
          setPersistentErrors(errors);
        }
        
        // Load progress data for score calculation
        const progressResponse = await studentService.getProgress(studentEmail);
        if (progressResponse.success && progressResponse.data && progressResponse.data.progress_data) {
          const progress = progressResponse.data.progress_data;
          setProgressData(progress);
          
          if (progress.length > 0) {
            const latest = progress[progress.length - 1];
            const previous = progress.length > 1 ? progress[progress.length - 2] : null;
            
            setCurrentScore(latest.score || 0);
            setPreviousScore(previous?.score || 0);
            setLevel(latest.level || 'A1');
          }
        }
      } else {
        setError('No analytics data available');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };
  
  // Load list of students for teachers
  const loadTeacherStudents = async (teacherEmail) => {
    if (!teacherEmail) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/teacher/${teacherEmail}/students`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableStudents(data.students || []);
        // Auto-select first student if available
        if (data.students && data.students.length > 0) {
          const firstStudent = data.students[0];
          setSelectedStudentEmail(firstStudent.email);
          await loadAnalyticsData(firstStudent.email);
        }
      } else {
        console.error('Error loading students:', data.message);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading teacher students:', err);
      setLoading(false);
    }
  };
  
  // Handle student selection for teachers
  const handleStudentSelect = async (studentEmail) => {
    setSelectedStudentEmail(studentEmail);
    await loadAnalyticsData(studentEmail);
  };
  
  // Handle "Ajouter une évaluation" button click - Launch analysis
  const handleAddEvaluation = async () => {
    // Determine which student email to use
    const studentEmailToAnalyze = userRole === 'student' 
      ? userEmail 
      : selectedStudentEmail;
    
    if (!studentEmailToAnalyze) {
      if (userRole === 'teacher' || userRole === 'admin') {
        setAnalysisError('Veuillez sélectionner un étudiant d\'abord');
        return;
      } else {
        setAnalysisError('Vous devez être connecté pour lancer une analyse');
        return;
      }
    }
    
    // Check if user is a student (backend requires student role)
    if (userRole !== 'student' && !selectedStudentEmail) {
      setAnalysisError('Veuillez sélectionner un étudiant pour lancer une analyse');
      return;
    }
    
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(false);
    
    try {
      // Submit for analysis - backend will analyze all saved texts for this student
      const response = await analysisService.submitTextForAnalysis(
        studentEmailToAnalyze,
        null, // No specific text content - analyze all saved texts
        'written'
      );
      
      if (response.success) {
        setAnalysisSuccess(true);
        // Reload analytics data to show the new analysis
        await loadAnalyticsData(studentEmailToAnalyze);
        // Clear success message after 3 seconds
        setTimeout(() => setAnalysisSuccess(false), 3000);
      } else {
        setAnalysisError(response.message || 'Erreur lors du lancement de l\'analyse');
      }
    } catch (err) {
      console.error('Error launching analysis:', err);
      // If error is about no texts available, redirect to written-analysis page
      if (err.message && err.message.includes('Aucun texte disponible')) {
        setAnalysisError('Aucun texte disponible. Redirection vers la page d\'analyse...');
        setTimeout(() => navigate('/written-analysis'), 2000);
      } else {
        setAnalysisError(err.message || 'Erreur lors du lancement de l\'analyse. Veuillez réessayer.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  if (error && !skillPerformance) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-800 font-semibold">{error}</p>
        </div>
      </div>
    );
  }
  
  // Use real data if available, fallback to mock data
  const skillDataToUse = skillPerformance || SKILL_PERFORMANCE;
  const competencyDataToUse = competencyData || COMPETENCY_DATA;
  
  // Calculate date range from progress data
  const getDateRange = () => {
    if (progressData.length > 0) {
      const dates = progressData.map(d => d.date).filter(Boolean).sort();
      if (dates.length > 0) {
        const firstDate = new Date(dates[0]);
        const lastDate = new Date(dates[dates.length - 1]);
        return `${firstDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - ${lastDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
      }
    }
    return 'Sept 2024 - Oct 2024';
  };
  
  return (
    <>
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {userRole === 'teacher' || userRole === 'admin' ? (
          <div className="relative max-w-md w-full">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={selectedStudentEmail || ''}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Select a student...</option>
              {availableStudents.map(student => (
                <option key={student.email} value={student.email}>
                  {student.name} ({student.texts_count || 0} texts)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="relative max-w-md w-full">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <div className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
              My Analytics
            </div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 font-medium">Dernière mise à jour</p>
            <p className="text-sm font-semibold text-slate-800">
              {lastReportDate
                ? (() => {
                    try {
                      // Parse the date and ensure we use local timezone
                      const date = new Date(lastReportDate);
                      // Check if date is valid
                      if (isNaN(date.getTime())) {
                        console.error('[Analytics] Invalid date:', lastReportDate);
                        return 'Date invalide';
                      }
                      // Format using local date (not UTC)
                      return date.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                      });
                    } catch (err) {
                      console.error('[Analytics] Error formatting date:', err, lastReportDate);
                      return 'Date invalide';
                    }
                  })()
                : 'Aucun rapport généré'
              }
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={handleAddEvaluation}
              disabled={analyzing}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                analyzing 
                  ? 'bg-indigo-400 text-white cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {analyzing ? 'Analyse en cours...' : 'Ajouter une évaluation'}
            </button>
            {analysisError && (
              <p className="text-xs text-red-600 max-w-xs text-right">{analysisError}</p>
            )}
            {analysisSuccess && (
              <p className="text-xs text-green-600 max-w-xs text-right">Analyse lancée avec succès!</p>
            )}
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Analytics Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics & Insights</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{studentName}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{getDateRange()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Score Actuel</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900">{currentScore}</span>
                <span className="text-sm text-slate-400 mb-1">/100</span>
                {scoreChange !== 0 && (
                  <span className={`flex items-center text-xs font-bold mb-1 ml-1 ${scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scoreChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(scoreChange)}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Niveau CECRL</p>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-bold text-slate-900">{level}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Skills Performance Bar Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Performance par Compétence</h3>
                      <p className="text-sm text-slate-500" style={{
                        display: "none"
                      }}>Répartition détaillée des scores</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {skillDataToUse && skillDataToUse.length > 0 ? (
                      skillDataToUse.map((skill, index) => (
                        <motion.div key={skill.skill} initial={{
                          opacity: 0,
                          x: -20
                        }} animate={{
                          opacity: 1,
                          x: 0
                        }} transition={{
                          delay: index * 0.1
                        }} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">{skill.skill}</span>
                            <span className="text-sm font-bold text-slate-900">{skill.score}/100</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <motion.div initial={{
                              width: 0
                            }} animate={{
                              width: `${skill.score / skill.maxScore * 100}%`
                            }} transition={{
                              duration: 1,
                              delay: index * 0.1 + 0.3
                            }} className="h-full rounded-full" style={{
                              backgroundColor: skill.color
                            }} />
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 py-8">
                        <p>No skill performance data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Competency Radar Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Analyse Multidimensionnelle</h3>
                      <p className="text-sm text-slate-500" style={{
                        display: "none"
                      }}>Répartition des compétences clés</p>
                    </div>
                  </div>
                  <div className="h-[320px]">
                    {competencyDataToUse && competencyDataToUse.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={competencyDataToUse}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="competency" tick={{
                            fill: '#64748b',
                            fontSize: 12,
                            fontWeight: 600
                          }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{
                            fill: '#94a3b8',
                            fontSize: 10
                          }} />
                          <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        <p>No competency data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
      </div>
    </>
  );
};

export default Analytics;
