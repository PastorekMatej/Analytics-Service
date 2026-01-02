import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, User, Calendar, Award, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import studentService from '../services/studentService';
import analysisService from '../services/analysisService';
import { extractScore, extractCEFRLevel, getSkillPerformanceData, getCompetencyData } from '../utils/analysisParser';

// Mock skill performance data
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

const Analysis = ({ userEmail: propUserEmail, userRole: propUserRole }) => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(propUserEmail || null);
  const [userRole, setUserRole] = useState(propUserRole || 'student');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  
  // Current score and level (can be loaded from API)
  const [currentScore, setCurrentScore] = useState(45);
  const [previousScore, setPreviousScore] = useState(41);
  const [level, setLevel] = useState('B1+');
  const [skillData, setSkillData] = useState(SKILL_PERFORMANCE);
  const [competencyData, setCompetencyData] = useState(COMPETENCY_DATA);
  
  const scoreChange = currentScore - previousScore;

  // Load user data from props or localStorage and initialize
  useEffect(() => {
    const loadUserAndData = async () => {
      try {
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
            setSelectedStudentName(email.split('@')[0]);
            await loadAnalysisData(email);
          } else if (role === 'teacher' || role === 'admin') {
            await loadTeacherStudents(email);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setLoading(false);
      }
    };
    
    loadUserAndData();
  }, [propUserEmail, propUserRole]);

  // Load analysis data for a specific student
  const loadAnalysisData = async (studentEmail) => {
    if (!studentEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch analyses from API
      const response = await analysisService.getStudentAnalyses(studentEmail, 100, 0);
      
      if (response.success && response.analyses && response.analyses.length > 0) {
        // Sort analyses by date (most recent first)
        const sortedAnalyses = [...response.analyses].sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
        
        // Debug: Log the structure of analyses
        console.log('[Analysis] Loaded analyses:', sortedAnalyses.length);
        if (sortedAnalyses.length > 0) {
          console.log('[Analysis] Most recent analysis structure:', {
            has_analysis_result: !!sortedAnalyses[0].analysis_result,
            analysis_result_type: typeof sortedAnalyses[0].analysis_result,
            analysis_result_preview: typeof sortedAnalyses[0].analysis_result === 'string' 
              ? sortedAnalyses[0].analysis_result.substring(0, 200) 
              : JSON.stringify(sortedAnalyses[0].analysis_result).substring(0, 200)
          });
        }
        
        // Extract skill performance data from analyses
        const skillPerformance = getSkillPerformanceData(sortedAnalyses);
        const competencyData = getCompetencyData(sortedAnalyses);
        
        console.log('[Analysis] Extracted skill performance:', skillPerformance);
        console.log('[Analysis] Extracted competency data:', competencyData);
        
        if (skillPerformance) {
          setSkillData(skillPerformance);
        } else {
          // Check if analyses exist but don't have skill scores (old format)
          const hasAnalysesWithoutScores = sortedAnalyses.some(a => a.analysis_result);
          if (hasAnalysesWithoutScores) {
            // Analyses exist but don't have prompt_v7 format - show message
            console.warn('[Analysis] Analyses found but no skill scores detected. Analyses may need to be regenerated with prompt_v7.');
            setError('Les analyses existantes ne contiennent pas de scores par compétence. Veuillez relancer une analyse pour voir les performances détaillées.');
          }
          // Fallback to empty array (will show "no data" message in UI)
          setSkillData([]);
        }
        
        if (competencyData) {
          setCompetencyData(competencyData);
        } else {
          // Fallback to empty array (will show "no data" message in UI)
          setCompetencyData([]);
        }
        
        // Extract current and previous scores
        const mostRecentAnalysis = sortedAnalyses[0];
        const currentScoreValue = extractScore(mostRecentAnalysis?.analysis_result);
        const currentLevel = extractCEFRLevel(mostRecentAnalysis?.analysis_result);
        
        if (currentScoreValue !== null) {
          setCurrentScore(currentScoreValue);
        }
        
        if (currentLevel) {
          setLevel(currentLevel);
        }
        
        // Get previous score from second most recent analysis
        if (sortedAnalyses.length > 1) {
          const previousAnalysis = sortedAnalyses[1];
          const previousScoreValue = extractScore(previousAnalysis?.analysis_result);
          if (previousScoreValue !== null) {
            setPreviousScore(previousScoreValue);
          }
        }
      } else {
        // No analyses found, show empty state
        setSkillData([]);
        setCompetencyData([]);
      }
    } catch (err) {
      console.error('Error loading analysis data:', err);
      setError('Erreur lors du chargement des données d\'analyse');
      // Show empty state on error
      setSkillData([]);
      setCompetencyData([]);
    }
    
    setLoading(false);
  };

  // Load list of students for teachers
  const loadTeacherStudents = async (teacherEmail) => {
    if (!teacherEmail) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/teacher/${teacherEmail}/students`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableStudents(data.students || []);
      } else {
        console.error('Error loading students:', data.message);
      }
    } catch (err) {
      console.error('Error loading teacher students:', err);
    }
    
    setLoading(false);
  };

  // Handle student selection for teachers
  const handleStudentSelect = async (studentEmail) => {
    setSelectedStudentEmail(studentEmail);
    const student = availableStudents.find(s => s.email === studentEmail);
    setSelectedStudentName(student ? student.name : studentEmail.split('@')[0]);
    await loadAnalysisData(studentEmail);
  };

  // Handle "Ajouter une évaluation" button click
  const handleAddEvaluation = async () => {
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
    
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(false);
    
    try {
      const response = await analysisService.submitTextForAnalysis(
        studentEmailToAnalyze,
        null,
        'written'
      );
      
      if (response.success) {
        setAnalysisSuccess(true);
        await loadAnalysisData(studentEmailToAnalyze);
        setTimeout(() => setAnalysisSuccess(false), 3000);
      } else {
        setAnalysisError(response.message || 'Erreur lors du lancement de l\'analyse');
      }
    } catch (err) {
      console.error('Error launching analysis:', err);
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

  // Filter students based on search query
  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-slate-600">Loading analysis data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Header */}
          <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" style={{
                display: "none"
              }} />
              <input type="text" placeholder="Rechercher un étudiant..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" style={{
                display: "none"
              }} />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 font-medium">Dernière mise à jour</p>
                <p className="text-sm font-semibold text-slate-800">20 Octobre 2024</p>
              </div>
              <button
                onClick={handleAddEvaluation}
                disabled={analyzing}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {analyzing ? 'Analyse en cours...' : 'Ajouter une évaluation'}
              </button>
            </div>
          </header>

          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">{error}</p>
              </div>
            )}
            
            {/* Success Message */}
            {analysisSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">Analyse lancée avec succès !</p>
              </div>
            )}
            
            {/* Analysis Error Message */}
            {analysisError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{analysisError}</p>
              </div>
            )}
            
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">My progresse</h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      {userRole === 'teacher' || userRole === 'admin'
                        ? (selectedStudentName || 'Select Student')
                        : (selectedStudentName || userEmail?.split('@')[0] || 'Student')
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Sept 2024 - Oct 2024</span>
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
                      <span className={`flex items-center text-xs font-bold mb-1 ml-1 ${scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scoreChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {scoreChange > 0 ? '+' : ''}{scoreChange}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Niveau CECRL</p>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span className="text-2xl font-bold text-slate-900">{level || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Two Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Panel: Performance par Compétence */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Performance par Compétence</h3>
                  </div>
                </div>
                {skillData && skillData.length > 0 ? (
                  <div className="space-y-5 max-h-[500px] overflow-y-auto">
                    {skillData.map((skill, index) => (
                      <motion.div
                        key={skill.skill}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-700">{skill.skill}</span>
                          <span className="text-sm font-bold text-slate-900">{skill.score}/100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(skill.score / skill.maxScore) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: skill.color }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>Aucune donnée de performance disponible</p>
                    <p className="text-sm mt-2">Lancez une analyse pour voir les performances par compétence</p>
                  </div>
                )}
              </div>

              {/* Right Panel: Analyse Multidimensionnelle */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Analyse Multidimensionnelle</h3>
                  </div>
                </div>
                {competencyData && competencyData.length > 0 ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={competencyData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                          dataKey="competency"
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <p>Aucune donnée disponible</p>
                      <p className="text-sm mt-2">Lancez une analyse pour voir le graphique</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Analysis;
