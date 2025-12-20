import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Filter, Calendar, Award, 
  CheckCircle2, AlertCircle, FileText, Mic, UserCircle, 
  Search, TrendingDown 
} from 'lucide-react';
import { cn } from '../lib/utils';

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

// Sample correction data
const SAMPLE_SUBMISSIONS = [{
  id: '1',
  date: '2024-10-20',
  title: 'Lettre formelle - Candidature',
  type: 'written',
  score: 45,
  totalCorrections: 12,
  corrections: [{
    id: 'c1',
    original: "J'ai travaillé dans cette société pendant trois ans",
    corrected: "J'ai travaillé dans cette entreprise pendant trois ans",
    errorType: 'V01 - Lexique',
    teacherComment: "\"Société\" est correct mais \"entreprise\" est plus idiomatique dans ce contexte professionnel.",
    severity: 'low'
  }, {
    id: 'c2',
    original: "Je suis très intéressé pour ce poste",
    corrected: "Je suis très intéressé par ce poste",
    errorType: 'G06 - Préposition',
    teacherComment: "Avec \"intéressé\", on utilise la préposition \"par\" et non \"pour\".",
    severity: 'high'
  }, {
    id: 'c3',
    original: "Les responsabilités que vous m'avez proposés",
    corrected: "Les responsabilités que vous m'avez proposées",
    errorType: 'G05 - Accord',
    teacherComment: "Accord du participe passé avec le COD \"responsabilités\" (féminin pluriel) placé avant.",
    severity: 'medium'
  }, {
    id: 'c4',
    original: "Je peux commencer le travail immédiatement",
    corrected: "Je peux commencer à travailler immédiatement",
    errorType: 'G06 - Construction infinitive',
    teacherComment: "\"Commencer\" est suivi de \"à\" + infinitif. Éviter \"commencer le travail\".",
    severity: 'medium'
  }, {
    id: 'c5',
    original: "J'attends avec impatience votre réponse",
    corrected: "J'attends avec impatience votre réponse",
    errorType: 'S03 - Genre discursif',
    teacherComment: "Parfait ! Formule de clôture appropriée pour une lettre formelle.",
    severity: 'low'
  }]
}, {
  id: '2',
  date: '2024-10-13',
  title: 'Récit de voyage - Mon séjour à Paris',
  type: 'written',
  score: 41,
  totalCorrections: 15,
  corrections: [{
    id: 'c6',
    original: "Je suis allé à Paris le mois dernier",
    corrected: "Je suis allée à Paris le mois dernier",
    errorType: 'G05 - Accord participe',
    teacherComment: "En tant que locutrice féminine, le participe passé doit s'accorder: \"allée\".",
    severity: 'high'
  }, {
    id: 'c7',
    original: "Les monuments étaient très impressionnant",
    corrected: "Les monuments étaient très impressionnants",
    errorType: 'G05 - Accord adjectif',
    teacherComment: "L'adjectif doit s'accorder en nombre avec \"monuments\" (pluriel).",
    severity: 'high'
  }, {
    id: 'c8',
    original: "J'ai visité le musée du Louvre et j'ai beaucoup aimé",
    corrected: "J'ai visité le musée du Louvre et je l'ai beaucoup aimé",
    errorType: 'G08 - Pronom COD',
    teacherComment: "Il faut reprendre \"le musée\" avec le pronom COD \"l'\" devant le verbe.",
    severity: 'medium'
  }]
}];

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
  const [selectedSubmission, setSelectedSubmission] = useState(SAMPLE_SUBMISSIONS[0]);
  const [expandedCorrections, setExpandedCorrections] = useState(new Set(['c1']));
  const [activeFilter, setActiveFilter] = useState('all');

  const toggleCorrection = (id) => {
    const newExpanded = new Set(expandedCorrections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCorrections(newExpanded);
  };

  const filteredCorrections = selectedSubmission.corrections.filter(correction => {
    if (activeFilter === 'all') return true;
    return correction.errorType.startsWith(activeFilter);
  });

  const errorStats = selectedSubmission.corrections.reduce((acc, correction) => {
    const type = correction.errorType.split(' - ')[0];
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

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

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ width: '100%' }}>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
          <input 
            placeholder="Rechercher un étudiant..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
            type="text" 
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 font-medium">Dernière mise à jour</p>
            <p className="text-sm font-semibold text-slate-800">20 Octobre 2024</p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Ajouter une évaluation
          </button>
        </div>
      </header>

      <div className="p-8">
        {/* Student Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4" style={{ width: '100%' }}>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Suivi de Progression</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user w-4 h-4 text-slate-400" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="text-sm font-medium text-slate-700">Jean-Pierre Dupont</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar w-4 h-4 text-slate-400" aria-hidden="true">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
                <span className="text-sm font-medium text-slate-700">Sept 2024 - Oct 2024</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Score Actuel</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900">45</span>
                <span className="text-sm text-slate-400 mb-1">/100</span>
                <span className="flex items-center text-xs font-bold mb-1 ml-1 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up w-3 h-3 mr-1" aria-hidden="true">
                    <path d="M16 7h6v6"></path>
                    <path d="m22 7-8.5 8.5-5-5L2 17"></path>
                  </svg>
                  4
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Niveau CECRL</p>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award w-5 h-5 text-amber-500" aria-hidden="true">
                  <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path>
                  <circle cx="12" cy="8" r="6"></circle>
                </svg>
                <span className="text-2xl font-bold text-slate-900">B1+</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Corrections List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Submission Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex gap-2 overflow-x-auto" style={{display: "none"}}>
              {SAMPLE_SUBMISSIONS.map(submission => 
                <button 
                  key={submission.id} 
                  onClick={() => setSelectedSubmission(submission)} 
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                    selectedSubmission.id === submission.id 
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
                    {category.id !== 'all' && errorStats[category.id] && 
                      <span className="ml-1.5 opacity-70">({errorStats[category.id]})</span>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Corrections List */}
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