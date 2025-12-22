import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Filter, Calendar, Award, 
  CheckCircle2, AlertCircle, FileText, Mic, UserCircle, 
  Search, TrendingDown, TrendingUp, Loader2 
} from 'lucide-react';
import { cn } from '../lib/utils';
import correctionsService from '../services/correctionsService';
import studentService from '../services/studentService';

/**
 * @typedef {Object} Correction
 * @property {string} id - Unique identifier
 * @property {string} original - Original text
 * @property {string} corrected - Corrected text
 * @property {string} errorType - Type of error
 * @property {string} teacherComment - Teacher's comment
 * @property {'high'|'medium'|'low'} severity - Error severity
 */

/**
 * @typedef {Object} Submission
 * @property {string} id - Unique identifier
 * @property {string} date - Submission date
 * @property {string} title - Submission title
 * @property {'written'|'oral'} type - Submission type
 * @property {number} score - Score out of 100
 * @property {number} totalCorrections - Total number of corrections
 * @property {Correction[]} corrections - Array of corrections
 */

const ERROR_CATEGORIES = [{
  id: 'all',
  label: 'Tous',
  color: 'slate'
}, {
  id: 'grammar',
  label: 'Grammar errors',
  color: 'red'
}, {
  id: 'style',
  label: 'Style errors',
  color: 'orange'
}, {
  id: 'vocabulary',
  label: 'Vocabulary errors',
  color: 'blue'
}, {
  id: 'persistent',
  label: 'Persistent errors',
  color: 'amber'
}];

const Corrections = ({ userEmail, userRole }) => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [expandedCorrections, setExpandedCorrections] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentEmail, setSelectedStudentEmail] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [progressData, setProgressData] = useState([]);
  
  const loadProgressData = async () => {
    const emailToUse = selectedStudentEmail || userEmail;
    if (!emailToUse) return;
    
    try {
      const response = await studentService.getProgress(emailToUse);
      if (response.success && response.data && response.data.progress_data) {
        setProgressData(response.data.progress_data);
      }
    } catch (err) {
      console.error('Error loading progress data:', err);
      setProgressData([]);
    }
  };
  
  const loadCorrections = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (userRole === 'student') {
        response = await correctionsService.getStudentCorrections(userEmail);
      } else {
        // Teacher/Admin view
        response = await correctionsService.getTeacherCorrections(userEmail, selectedStudentEmail);
        
        // Load available students for teacher
        if (!selectedStudentEmail && userRole === 'teacher') {
          try {
            const studentsResponse = await fetch(`http://127.0.0.1:8000/api/teacher/${userEmail}/students`);
            if (studentsResponse.ok) {
              const studentsData = await studentsResponse.json();
              setAvailableStudents(studentsData.students || []);
            }
          } catch (err) {
            console.error('Error loading students:', err);
          }
        }
      }
      
      if (response.success && response.submissions) {
        setSubmissions(response.submissions);
        if (response.submissions.length > 0 && !selectedSubmission) {
          setSelectedSubmission(response.submissions[0]);
          // Expand first correction by default
          if (response.submissions[0].corrections.length > 0) {
            setExpandedCorrections(new Set([response.submissions[0].corrections[0].id]));
          }
        }
      } else {
        setError(response.message || 'No corrections found');
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error loading corrections:', err);
      setError('Error loading corrections. Please try again.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load corrections data and progress data on mount
  useEffect(() => {
    if (userEmail) {
      loadCorrections();
      loadProgressData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, userRole, selectedStudentEmail]);
  
  const toggleCorrection = (id) => {
    const newExpanded = new Set(expandedCorrections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCorrections(newExpanded);
  };

  const filteredCorrections = selectedSubmission?.corrections?.filter(correction => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'grammar') return correction.errorType.toLowerCase().includes('grammar') || correction.errorType.startsWith('G');
    if (activeFilter === 'vocabulary') return correction.errorType.toLowerCase().includes('vocabulary') || correction.errorType.startsWith('V');
    if (activeFilter === 'style') return correction.errorType.toLowerCase().includes('style') || correction.errorType.startsWith('S');
    if (activeFilter === 'persistent') return correction.severity === 'high';
    return true;
  }) || [];

  const errorStats = selectedSubmission?.corrections?.reduce((acc, correction) => {
    const type = correction.errorType.split(' - ')[0];
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}) || {};
  
  // Calculate current score and CECRL level - use same logic as Progress page
  // Use progress data if available (same source as Progress page), otherwise fallback to submissions
  const dataToUse = Array.isArray(progressData) && progressData.length > 0 ? progressData : [];
  const latestData = dataToUse.length > 0 && dataToUse[dataToUse.length - 1] ? dataToUse[dataToUse.length - 1] : null;
  const previousData = dataToUse.length > 1 && dataToUse[dataToUse.length - 2] ? dataToUse[dataToUse.length - 2] : null;
  
  // Get score and level from progress data (same as Progress page)
  const getCECRLLevel = (score) => {
    if (!score && score !== 0) return 'A1';
    if (score >= 93) return 'C2+';
    if (score >= 84) return 'C2';
    if (score >= 76) return 'C1+';
    if (score >= 68) return 'C1';
    if (score >= 59) return 'B2+';
    if (score >= 51) return 'B2';
    if (score >= 43) return 'B1+';
    if (score >= 34) return 'B1';
    if (score >= 26) return 'A2+';
    if (score >= 17) return 'A2';
    if (score >= 9) return 'A1+';
    return 'A1';
  };
  
  // Get score from progress data first, then fallback to submissions
  let currentScore = 0;
  try {
    if (latestData && typeof latestData.score === 'number' && !isNaN(latestData.score)) {
      currentScore = Math.max(0, Math.min(100, latestData.score)); // Ensure score is between 0-100
    } else if (Array.isArray(submissions) && submissions.length > 0) {
      const validScores = submissions.filter(sub => sub && typeof sub.score === 'number' && !isNaN(sub.score) && sub.score >= 0);
      if (validScores.length > 0) {
        const avgScore = validScores.reduce((sum, sub) => sum + sub.score, 0) / validScores.length;
        currentScore = Math.max(0, Math.min(100, Math.round(avgScore)));
      }
    }
  } catch (err) {
    console.error('Error calculating currentScore:', err);
    currentScore = 0;
  }
  
  // Use level from progress data if available, otherwise calculate from score
  let cecrlLevel = 'A1';
  try {
    if (latestData && latestData.level && typeof latestData.level === 'string') {
      cecrlLevel = latestData.level;
    } else if (Array.isArray(submissions) && submissions.length > 0 && submissions[0]?.cecrlLevel) {
      cecrlLevel = submissions[0].cecrlLevel;
    } else {
      cecrlLevel = getCECRLLevel(currentScore);
    }
  } catch (err) {
    console.error('Error calculating cecrlLevel:', err);
    cecrlLevel = 'A1';
  }
  
  // Calculate score change (for consistency with Progress page)
  let scoreChange = 0;
  try {
    if (latestData && previousData && 
        typeof latestData.score === 'number' && typeof previousData.score === 'number' &&
        !isNaN(latestData.score) && !isNaN(previousData.score)) {
      scoreChange = latestData.score - previousData.score;
    }
  } catch (err) {
    console.error('Error calculating scoreChange:', err);
    scoreChange = 0;
  }
  
  // Filter submissions by search query
  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(sub => {
    if (!sub) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (sub.title && sub.title.toLowerCase().includes(query)) ||
      (sub.date && sub.date.includes(query)) ||
      (sub.studentEmail && sub.studentEmail.toLowerCase().includes(query)) ||
      (sub.studentName && sub.studentName.toLowerCase().includes(query))
    );
  }) : [];
  
  // Update selected submission when filtered submissions change
  useEffect(() => {
    if (filteredSubmissions.length > 0) {
      // If current selection is not in filtered list, select first one
      const currentSelectedId = selectedSubmission?.id;
      if (!currentSelectedId || !filteredSubmissions.find(s => s.id === currentSelectedId)) {
        setSelectedSubmission(filteredSubmissions[0]);
        if (filteredSubmissions[0].corrections.length > 0) {
          setExpandedCorrections(new Set([filteredSubmissions[0].corrections[0].id]));
        }
      }
    } else if (filteredSubmissions.length === 0 && submissions.length > 0) {
      // Search filtered everything out, but we have submissions
      setSelectedSubmission(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSubmissions.length, submissions.length, searchQuery]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'red';
      case 'medium':
        return 'amber';
      case 'low':
        return 'green';
      default:
        return 'slate';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading corrections...</p>
        </div>
      </div>
    );
  }
  
  if (error && submissions.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-800 font-semibold">{error}</p>
          <button 
            onClick={loadCorrections}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (submissions.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600 font-semibold">No corrections available</p>
          <p className="text-sm text-slate-500 mt-2">
            {userRole === 'student' 
              ? 'Submit some texts for analysis to see corrections here.'
              : 'No student corrections found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ width: '100%' }}>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
          <input 
            placeholder={userRole === 'student' ? "Rechercher dans les corrections..." : "Rechercher un étudiant..."} 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {userRole === 'teacher' && availableStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedStudentEmail || ''}
              onChange={(e) => {
                setSelectedStudentEmail(e.target.value || null);
                setSelectedSubmission(null);
              }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Students</option>
              {availableStudents.map((student) => (
                <option key={student.email || student} value={student.email || student}>
                  {student.name || student.email || student}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-4">
          {submissions.length > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 font-medium">Dernière mise à jour</p>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(submissions[0].date).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="p-8">
        {/* Student Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4" style={{ width: '100%' }}>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Corrections</h1>
            <div className="flex items-center gap-3">
              {/* Display student name */}
              {(selectedStudentEmail || userEmail) && (
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {submissions[0]?.studentName || 
                     (selectedStudentEmail ? selectedStudentEmail.split('@')[0] : userEmail?.split('@')[0] || 'Student')}
                  </span>
                </div>
              )}
              {/* Display date range from progress data */}
              {progressData.length > 0 && (
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {(() => {
                      const dates = progressData.map(d => d.date).filter(Boolean).sort();
                      if (dates.length === 0) return '';
                      const firstDate = new Date(dates[0]);
                      const lastDate = new Date(dates[dates.length - 1]);
                      const formatDate = (date) => {
                        return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                      };
                      return `${formatDate(firstDate)} - ${formatDate(lastDate)}`;
                    })()}
                  </span>
                </div>
              )}
              {/* Fallback: show submission count if no progress data */}
              {progressData.length === 0 && submissions.length > 0 && (
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
                  </span>
                </div>
              )}
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
                <span className="text-2xl font-bold text-slate-900">{cecrlLevel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Corrections List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Show message if search filtered everything */}
            {searchQuery && filteredSubmissions.length === 0 && submissions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-semibold">No submissions match your search</p>
                <p className="text-sm text-slate-500 mt-2">Try a different search term</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
                >
                  Clear search
                </button>
              </div>
            )}
            
            {/* Submission Tabs */}
            {filteredSubmissions.length > 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex gap-2 overflow-x-auto">
                {filteredSubmissions.map(submission => 
                  <button 
                    key={submission.id} 
                    onClick={() => {
                      setSelectedSubmission(submission);
                      // Expand first correction
                      if (submission.corrections.length > 0) {
                        setExpandedCorrections(new Set([submission.corrections[0].id]));
                      }
                    }} 
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                      selectedSubmission?.id === submission.id 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {submission.type === 'written' ? <FileText className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span className="hidden sm:inline">{submission.title}</span>
                      <span className="sm:hidden">{submission.date}</span>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Filter Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <Filter className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700">Filtrer par type d'erreur</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {ERROR_CATEGORIES.map(category => 
                  <button 
                    key={category.id} 
                    onClick={() => setActiveFilter(category.id)} 
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      activeFilter === category.id 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {category.label}
                    {category.id !== 'all' && (
                      <span className="ml-1.5 opacity-70">
                        ({filteredCorrections.filter(c => {
                          if (category.id === 'grammar') return c.errorType.toLowerCase().includes('grammar') || c.errorType.startsWith('G');
                          if (category.id === 'vocabulary') return c.errorType.toLowerCase().includes('vocabulary') || c.errorType.startsWith('V');
                          if (category.id === 'style') return c.errorType.toLowerCase().includes('style') || c.errorType.startsWith('S');
                          if (category.id === 'persistent') return c.severity === 'high';
                          return false;
                        }).length})
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Corrections List */}
            {!selectedSubmission ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">Select a submission to view corrections</p>
              </div>
            ) : filteredCorrections.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-slate-600">No corrections match the selected filter</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredCorrections.map((correction, index) => 
                  <motion.div 
                    key={correction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <button 
                      onClick={() => toggleCorrection(correction.id)} 
                      className="w-full p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        `bg-${getSeverityColor(correction.severity)}-100`
                      )}>
                        <AlertCircle className={cn("w-5 h-5", `text-${getSeverityColor(correction.severity)}-600`)} />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded",
                            `bg-${getSeverityColor(correction.severity)}-50 text-${getSeverityColor(correction.severity)}-700`
                          )}>
                            {correction.errorType}
                          </span>
                          {expandedCorrections.has(correction.id) ? 
                            <ChevronUp className="w-5 h-5 text-slate-400" /> : 
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          }
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Original:</span>
                            <p className="text-sm text-slate-700 flex-1">
                              <span className="bg-red-100 text-red-700 px-1 rounded">{correction.original}</span>
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Corrigé:</span>
                            <p className="text-sm text-slate-700 flex-1">
                              <span className="bg-green-100 text-green-700 px-1 rounded">{correction.corrected}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedCorrections.has(correction.id) && 
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-100"
                        >
                          <div className="p-5 bg-slate-50" style={{display: "none"}}>
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                  Explication du professeur
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {correction.teacherComment}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      }
                    </AnimatePresence>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Statistics Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Impact */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6" style={{display: "none"}}>
              <h3 className="text-lg font-bold text-slate-800 mb-6">Impact sur le Score</h3>
              
              <div className="space-y-4">
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-red-700">Erreurs Graves</span>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {selectedSubmission.corrections.filter(c => c.severity === 'high').length}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    -{selectedSubmission.corrections.filter(c => c.severity === 'high').length * 2} points
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-amber-700">Erreurs Moyennes</span>
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {selectedSubmission.corrections.filter(c => c.severity === 'medium').length}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    -{selectedSubmission.corrections.filter(c => c.severity === 'medium').length} point
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-green-700">Erreurs Légères</span>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {selectedSubmission.corrections.filter(c => c.severity === 'low').length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">-0.5 point</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200" style={{display: "none"}}>
              <h3 className="text-white/90 text-sm font-bold uppercase tracking-wider mb-4">
                Prochaines étapes
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-white text-indigo-600 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors">
                  Exercices ciblés
                </button>
                <button className="w-full bg-white/20 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors">
                  Demander clarification
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Corrections;