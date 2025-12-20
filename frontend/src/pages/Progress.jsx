import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, User, Calendar, Award, Search, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import studentService from '../services/studentService';
import analysisService from '../services/analysisService';

// Define the CEFR level boundaries based on the user's logic
const LEVEL_BOUNDARIES = [{
  name: 'A1',
  min: 0,
  max: 8,
  color: '#fee2e2'
}, {
  name: 'A1+',
  min: 9,
  max: 16,
  color: '#fef3c7'
}, {
  name: 'A2',
  min: 17,
  max: 25,
  color: '#fef9c3'
}, {
  name: 'A2+',
  min: 26,
  max: 33,
  color: '#ecfdf5'
}, {
  name: 'B1',
  min: 34,
  max: 42,
  color: '#dcfce7'
}, {
  name: 'B1+',
  min: 43,
  max: 50,
  color: '#f0fdf4'
}, {
  name: 'B2',
  min: 51,
  max: 58,
  color: '#f0f9ff'
}, {
  name: 'B2+',
  min: 59,
  max: 67,
  color: '#e0f2fe'
}, {
  name: 'C1',
  min: 68,
  max: 75,
  color: '#eff6ff'
}, {
  name: 'C1+',
  min: 76,
  max: 83,
  color: '#dbeafe'
}, {
  name: 'C2',
  min: 84,
  max: 92,
  color: '#f5f3ff'
}, {
  name: 'C2+',
  min: 93,
  max: 100,
  color: '#ede9fe'
}];

const getLevelFromScore = (score) => {
  const level = LEVEL_BOUNDARIES.find(l => score >= l.min && score <= l.max);
  return level ? level.name : 'Unknown';
};

// Map score to main CEFR level for Y-axis display
const getMainLevelFromScore = (score) => {
  if (score >= 0 && score <= 16) return 'A1';
  if (score >= 17 && score <= 33) return 'A2';
  if (score >= 34 && score <= 50) return 'B1';
  if (score >= 51 && score <= 67) return 'B2';
  if (score >= 68 && score <= 83) return 'C1';
  if (score >= 84 && score <= 100) return 'C2';
  return '';
};

const STUDENT_DATA = [{
  date: '2024-09-15',
  score: 18,
  level: 'A2',
  improvement: 'Amélioration majeure: Maîtrise des conjugaisons de base'
}, {
  date: '2024-09-22',
  score: 22,
  level: 'A2',
  improvement: 'Amélioration majeure: Réduction des erreurs d\'articles'
}, {
  date: '2024-09-29',
  score: 28,
  level: 'A2+',
  improvement: 'Amélioration majeure: Introduction de structures complexes'
}, {
  date: '2024-10-06',
  score: 35,
  level: 'B1',
  improvement: 'Amélioration majeure: Meilleure cohérence temporelle'
}, {
  date: '2024-10-13',
  score: 41,
  level: 'B1',
  improvement: 'Régression mineure: Réapparition d\'erreurs de prépositions'
}, {
  date: '2024-10-20',
  score: 45,
  level: 'B1+',
  improvement: 'Amélioration majeure: Enrichissement du vocabulaire'
}];

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isRegression = data.improvement.toLowerCase().includes('régression');
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-slate-200 max-w-xs">
        <p className="text-sm font-semibold text-slate-500 mb-1">{data.date}</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-slate-800">{data.score}/100</span>
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold uppercase">
            Niveau {data.level}
          </span>
        </div>
        <div className={`text-xs p-2 rounded ${isRegression ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {data.improvement}
        </div>
      </div>
    );
  }
  return null;
};

const Progress = ({ userEmail: propUserEmail, userRole: propUserRole }) => {
  const navigate = useNavigate();
  
  // State management for API integration
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(propUserEmail || null);
  const [userRole, setUserRole] = useState(propUserRole || 'student');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  
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
        // Reload progress data to show the new analysis
        await loadProgress(studentEmailToAnalyze);
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
  
  // Use real data if available, fallback to hardcoded data
  const dataToUse = progressData.length > 0 ? progressData : STUDENT_DATA;
  const latestData = dataToUse.length > 0 ? dataToUse[dataToUse.length - 1] : { score: 0, level: 'A1' };
  const previousData = dataToUse.length > 1 ? dataToUse[dataToUse.length - 2] : { score: 0 };
  const scoreChange = (latestData?.score || 0) - (previousData?.score || 0);

  // Load user data from props or localStorage and initialize
  useEffect(() => {
    const loadUserAndProgress = async () => {
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
            // Students see their own progress
            setSelectedStudentEmail(email);
            await loadProgress(email);
          } else if (role === 'teacher' || role === 'admin') {
            // Teachers need to select a student first
            await loadTeacherStudents(email);
          }
        } else {
          // No user data, just show hardcoded data for testing
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setLoading(false);
      }
    };
    
    loadUserAndProgress();
  }, [propUserEmail, propUserRole]);

  // Load progress data for a specific student
  const loadProgress = async (studentEmail) => {
    if (!studentEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await studentService.getProgress(studentEmail);
      
      if (response.success) {
        setProgressData(response.data.progress_data || []);
      } else {
        setError(response.message || 'Error loading progress');
      }
    } catch (err) {
      console.error('Error loading progress:', err);
      setError('Error loading progress - using demo data');
      // On error, we'll fall back to hardcoded data
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
    await loadProgress(studentEmail);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
       {/* Main Content */}
       <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-slate-600">Loading progress data...</p>
            </div>
          </div>
        ) : (
          <>
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
                        {student.name} ({student.texts_count} texts)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="relative max-w-md w-full">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <div className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                    My Progress
                  </div>
                </div>
              )}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 font-medium">Dernière mise à jour</p>
              <p className="text-sm font-semibold text-slate-800">20 Octobre 2024</p>
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
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Suivi de Progression</h1>
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                   <User className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium text-slate-700">
                     {userRole === 'teacher' || userRole === 'admin' 
                       ? (availableStudents.find(s => s.email === selectedStudentEmail)?.name || 'Select Student')
                       : (userEmail ? userEmail.split('@')[0] : 'Student')
                     }
                   </span>
                 </div>
                 <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                   <Calendar className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium text-slate-700">
                     {dataToUse.length > 0 && progressData.length > 0
                       ? `${new Date(dataToUse[0]?.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - ${new Date(dataToUse[dataToUse.length - 1]?.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
                       : 'Sept 2024 - Oct 2024'
                     }
                   </span>
                 </div>
               </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Score Actuel</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-slate-900">{latestData.score}</span>
                  <span className="text-sm text-slate-400 mb-1">/100</span>
                  <span className={`flex items-center text-xs font-bold mb-1 ml-1 ${scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scoreChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(scoreChange)}
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Niveau CECRL</p>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-bold text-slate-900">{latestData.level}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[450px] relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Évaluation Numérique</h3>
                    <p className="text-sm text-slate-500">Progression globale de l'apprentissage du Français</p>
                  </div>
                  <div className="flex gap-1">
                    {['Mois', 'Trimestre', 'Année'].map(p => (
                      <button
                        key={p}
                        className={`px-3 py-1 rounded-md text-xs font-semibold ${
                          p === 'Mois' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                 <div className="h-[320px] w-full">
                   {dataToUse.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart
                         data={dataToUse}
                         margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                       >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        dy={10}
                      />
                      <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                        dx={-10}
                        ticks={[8, 25, 42, 58, 75, 92]}
                        tickFormatter={value => getMainLevelFromScore(value)}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                        animationDuration={1500}
                      />
                       </LineChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="flex items-center justify-center h-full">
                       <div className="text-center text-slate-500">
                         <div className="text-4xl mb-2">📊</div>
                         <p className="font-medium">No progress data available</p>
                         <p className="text-sm mt-1">
                           {userRole === 'teacher' || userRole === 'admin' 
                             ? 'Select a student to view their progress' 
                             : 'Complete some analyses to see your progress chart'
                           }
                         </p>
                         {error && (
                           <p className="text-red-500 text-sm mt-2">{error}</p>
                         )}
                       </div>
                     </div>
                   )}
                 </div>

                <div className="absolute top-20 right-6 flex flex-col gap-1 hidden xl:flex">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Guide Niveaux</div>
                  {LEVEL_BOUNDARIES.slice(0, 12).filter((_, i) => i % 2 === 0).map(lvl => (
                    <div key={lvl.name} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: lvl.color }}
                      />
                      <span className="text-[10px] font-medium text-slate-500">
                        {lvl.name}: {lvl.min}-{lvl.max}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-600 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg shadow-indigo-200">
                  <div className="relative z-10">
                    <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2">Objectif suivant</h4>
                    <p className="text-2xl font-bold mb-4">Niveau B2</p>
                    <div className="w-full bg-white/20 h-2 rounded-full mb-2">
                      <div
                        className="bg-white h-full rounded-full"
                        style={{ width: `${(latestData.score / 51) * 100}%` }}
                      />
                    </div>
                     <p className="text-xs text-white/70">
                       {latestData.score < 51 
                         ? `Il reste environ ${51 - latestData.score} points pour atteindre le niveau B2.`
                         : 'Félicitations! Vous avez atteint le niveau B2!'
                       }
                     </p>
                  </div>
                  <TrendingUp className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                   <div>
                     <h4 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Évaluations</h4>
                     <p className="text-3xl font-bold text-slate-900">{dataToUse.length}</p>
                     <p className="text-xs text-slate-400 mt-2">
                       {dataToUse.length > 0 ? 'Analyses complétées' : 'Aucune analyse'}
                     </p>
                   </div>
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline / Recent Activity Section */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
                {/* #region agent log */}
                {(() => {
                  fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Progress.jsx:574',message:'History section rendering',data:{showAllHistory,dataToUseLength:dataToUse.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  return null;
                })()}
                {/* #endregion */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Historique Précis</h3>
                  <button 
                    onClick={() => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Progress.jsx:576',message:'Button clicked',data:{showAllHistory,dataToUseLength:dataToUse.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                      // #endregion
                      setShowAllHistory(!showAllHistory);
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Progress.jsx:580',message:'State updated',data:{newShowAllHistory:!showAllHistory},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                      // #endregion
                    }}
                    className="text-indigo-600 text-xs font-bold hover:underline"
                  >
                    {showAllHistory ? 'Voir moins' : 'Voir tout'}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />

                   <div className="space-y-8 relative">
                     {dataToUse.length > 0 ? (
                       (() => {
                         // #region agent log
                         const reversedData = dataToUse.slice().reverse();
                         const displayData = showAllHistory ? reversedData : reversedData.slice(0, 3);
                         fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Progress.jsx:597',message:'Rendering history items',data:{showAllHistory,totalItems:reversedData.length,displayItems:displayData.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                         // #endregion
                         return displayData.map((item, idx) => {
                           const isRegression = item.improvement.toLowerCase().includes('régression');
                           const originalIndex = dataToUse.length - 1 - idx;
                           const previousScore = originalIndex > 0 ? dataToUse[originalIndex - 1].score : item.score;
                           const scoreChange = item.score - previousScore;
                         
                         return (
                           <motion.div
                             key={item.date}
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.1 }}
                             className="flex gap-4 group"
                           >
                             <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${
                               isRegression ? 'bg-red-100' : 'bg-indigo-100'
                             }`}>
                               <div className={`w-2 h-2 rounded-full ${isRegression ? 'bg-red-500' : 'bg-indigo-500'}`} />
                             </div>
                             
                             <div className="flex-1 pb-2">
                               <div className="flex items-center justify-between mb-1">
                                 <p className="text-xs font-bold text-slate-400">
                                   {progressData.length > 0 ? new Date(item.date).toLocaleDateString('fr-FR') : item.date}
                                 </p>
                                 <div className="flex items-center gap-2">
                                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                     scoreChange < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                   }`}>
                                     {scoreChange >= 0 ? '+' : ''}
                                     {scoreChange}
                                   </span>
                                   <span className="text-sm font-bold text-slate-700">{item.score}/100</span>
                                 </div>
                               </div>
                               <div className={`p-3 rounded-xl border transition-all group-hover:shadow-md ${
                                 isRegression 
                                   ? 'bg-red-50/30 border-red-100' 
                                   : 'bg-slate-50/50 border-slate-100'
                               }`}>
                                 <div className="flex items-center gap-2 mb-1">
                                   <span className="text-[10px] font-black bg-white border px-1.5 py-0.5 rounded shadow-sm text-slate-600 uppercase">
                                     Niveau {item.level}
                                   </span>
                                 </div>
                                 <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                   {item.improvement}
                                 </p>
                               </div>
                             </div>
                           </motion.div>
                         );
                       });
                       })()
                     ) : (
                       <div className="text-center text-slate-500 py-8">
                         <div className="text-2xl mb-2">📈</div>
                         <p className="font-medium">No progress history</p>
                         <p className="text-sm mt-1">Progress entries will appear here as analyses are completed</p>
                       </div>
                     )}
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Légende Échelle</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {LEVEL_BOUNDARIES.map(lvl => (
                      <div
                        key={lvl.name}
                        className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <span className="w-5 text-indigo-600">{lvl.name}</span>
                        <span className="text-slate-400">{lvl.min}-{lvl.max} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
           </div>
         </div>
         </>
        )}
       </main>
     </div>
  );
};

export default Progress;
