import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, Menu, X, Twitter, Linkedin, Globe, BookOpen, Brain, Target, Languages, Sparkles, Users } from 'lucide-react';

// --- Constants ---

const NAV_LINKS = [{
  label: 'Features',
  href: '#features'
}, {
  label: 'How It Works',
  href: '#how-it-works'
}, {
  label: 'For Students',
  href: '#students'
}, {
  label: 'For Teachers',
  href: '#teachers'
}];

const FOOTER_LINKS = {
  Platform: ['For Learners', 'For Teachers', 'AI Analysis', 'Progress Tracking'],
  Resources: ['Blog', 'Learning Tips', 'French Grammar', 'Success Stories'],
  Learn: ['Getting Started', 'Documentation', 'Video Tutorials', 'FAQ'],
  'Help & Support': ['Contact Us', 'Help Center', 'Privacy Policy', 'Terms of Service']
};

// --- Helper Components ---

const NavItem = ({ link }) => (
  <a href={link.href} className="group relative flex items-center gap-1 cursor-pointer text-slate-700 hover:text-indigo-600 transition-colors font-medium">
    <span>{link.label}</span>
    {link.hasDropdown && <ChevronDown size={14} className="mt-0.5" />}
  </a>
);

const SectionHeading = ({ children, className = "" }) => (
  <h2 className={`text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight ${className}`}>
    {children}
  </h2>
);

// --- Main Component ---

const Home = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="ProfElite" className="w-10 h-10 rounded-lg" />
              <span className="font-bold text-xl text-slate-800 tracking-tight">ProfElite</span>
            </Link>
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map(link => <NavItem key={link.label} link={link} />)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/signup" className="hidden sm:block px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all active:scale-95">
              Start Learning
            </Link>
            <button className="lg:hidden p-2 text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 lg:hidden"
          >
            <div className="flex flex-col gap-6 text-xl font-medium text-slate-700">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} className="border-b border-slate-100 pb-4">
                  {link.label}
                </a>
              ))}
              <Link to="/signup" className="w-full py-4 bg-indigo-600 text-white rounded-xl text-center">Start Learning</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <SectionHeading className="mb-8">
                Learn or Teach French with{' '}
                <span className="text-indigo-600">ProfElite</span>
              </SectionHeading>
              <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-xl mb-10">
                An advanced linguistic analysis platform for students and teachers that combines artificial intelligence and pedagogical expertise to accelerate French learning.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup" className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  Start Free Trial
                </Link>
                <Link to="/login" className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-lg text-lg font-semibold hover:bg-slate-50 transition-colors">
                  For Teachers
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="relative aspect-square flex items-center justify-center"
            >
              {/* French Language Learning Illustration */}
              <div className="relative w-full h-full max-w-md">
                {/* Neuronal Network Animation */}
                <motion.svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full opacity-20">
                  {/* Define gradient for connections */}
                  <defs>
                    <linearGradient id="neuronGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Animated connection lines */}
                  <motion.line
                    x1="80" y1="100" x2="160" y2="200"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                  />
                  <motion.line
                    x1="160" y1="200" x2="240" y2="180"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.2 }}
                  />
                  <motion.line
                    x1="240" y1="180" x2="320" y2="100"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.4 }}
                  />
                  <motion.line
                    x1="80" y1="100" x2="120" y2="300"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 2.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.6 }}
                  />
                  <motion.line
                    x1="120" y1="300" x2="240" y2="180"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 2.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.8 }}
                  />
                  <motion.line
                    x1="240" y1="180" x2="280" y2="300"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
                  />
                  <motion.line
                    x1="320" y1="100" x2="280" y2="300"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.5 }}
                  />
                  <motion.line
                    x1="160" y1="200" x2="120" y2="300"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.4 }}
                    transition={{ duration: 2.3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.3 }}
                  />
                  <motion.line
                    x1="160" y1="200" x2="280" y2="300"
                    stroke="url(#neuronGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.4 }}
                    transition={{ duration: 2.7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.7 }}
                  />

                  {/* Neuron nodes with pulsing animation */}
                  <motion.circle
                    cx="80" cy="100" r="12"
                    fill="#6366f1"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.circle
                    cx="160" cy="200" r="16"
                    fill="#8b5cf6"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  />
                  <motion.circle
                    cx="240" cy="180" r="14"
                    fill="#6366f1"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  />
                  <motion.circle
                    cx="320" cy="100" r="13"
                    fill="#8b5cf6"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                  />
                  <motion.circle
                    cx="120" cy="300" r="11"
                    fill="#6366f1"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  />
                  <motion.circle
                    cx="280" cy="300" r="12"
                    fill="#8b5cf6"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                </motion.svg>
                <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-500 fill-current">
                  {/* Book/Learning visual */}
                  <motion.g
                    animate={{ rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <rect x="60" y="80" width="80" height="60" rx="4" className="text-indigo-400" />
                    <rect x="65" y="85" width="70" height="50" rx="2" fill="#ffffff" opacity="0.3" />
                    <line x1="100" y1="85" x2="100" y2="135" stroke="currentColor" strokeWidth="2" />
                  </motion.g>
                  
                  {/* AI Brain/Connection nodes */}
                  <motion.circle
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    cx="50" cy="50" r="8" className="text-indigo-600"
                  />
                  <motion.circle
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                    cx="150" cy="60" r="6" className="text-indigo-500"
                  />
                  <motion.circle
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    cx="160" cy="140" r="7" className="text-indigo-400"
                  />
                  
                  {/* Connection lines */}
                  <path d="M50 50 L60 80" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
                  <path d="M150 60 L140 80" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
                  <path d="M160 140 L140 140" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
                  
                  {/* French flag inspiration - subtle stripes */}
                  <path d="M30 160 L50 160" stroke="#0055A4" strokeWidth="3" opacity="0.3" />
                  <path d="M55 160 L75 160" stroke="#FFFFFF" strokeWidth="3" opacity="0.3" />
                  <path d="M80 160 L100 160" stroke="#EF4135" strokeWidth="3" opacity="0.3" />
                </svg>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                How It Works
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Get started with ProfElite in three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-indigo-600">1</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">Submit Your Text</h4>
                <p className="text-slate-600 leading-relaxed">
                  Write or upload your French text. You can save it for later or analyze it immediately.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-indigo-600">2</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h4>
                <p className="text-slate-600 leading-relaxed">
                  Our AI analyzes your text for grammar, vocabulary, and style errors, providing comprehensive feedback.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-indigo-600">3</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">Track Progress</h4>
                <p className="text-slate-600 leading-relaxed">
                  View detailed reports, track your improvement over time, and get personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Product Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-3xl p-8 md:p-16 flex flex-col md:flex-row justify-between gap-12 border border-slate-200 shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-6">
                  <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full tracking-widest uppercase">
                    New Feature
                  </div>
                </div>
                <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                  AI-Powered Analysis
                </h3>
                <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-md">
                  Advanced linguistic analysis that adapts to your learning style, identifies patterns, and provides personalized feedback.
                </p>
                <Link to="/signup" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 inline-block">
                  Learn More
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-6">
                <div className="text-sm font-bold text-slate-500 tracking-wider uppercase mb-2">Key Features</div>
                {["Personalized Learning Paths", "Grammar & Vocabulary Mastery", "Progress Tracking"].map((item, i) => (
                  <Link key={i} to="/signup" className="group cursor-pointer flex items-center justify-between py-6 border-t border-slate-100 hover:text-indigo-600 transition-colors">
                    <span className="text-xl font-medium">{item}</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust/Features Section */}
        <section id="features" className="py-24 px-6 border-y border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Why ProfElite Works
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Combining cutting-edge AI with proven pedagogical methods for effective language learning
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <Brain className="text-indigo-600 w-12 h-12" />
                <h4 className="text-2xl font-bold text-slate-900">AI-Powered Intelligence</h4>
                <p className="text-slate-600 leading-relaxed">
                  Advanced linguistic analysis adapts to your unique learning style and provides instant, contextual feedback.
                </p>
              </div>
              <div className="space-y-4">
                <Target className="text-indigo-600 w-12 h-12" />
                <h4 className="text-2xl font-bold text-slate-900">Personalized Learning</h4>
                <p className="text-slate-600 leading-relaxed">
                  Tailored learning paths that adapt to your progress and learning pace. Focus on areas that need improvement with targeted exercises.
                </p>
              </div>
              <div className="space-y-4">
                <BookOpen className="text-indigo-600 w-12 h-12" />
                <h4 className="text-2xl font-bold text-slate-900">Expert Pedagogy</h4>
                <p className="text-slate-600 leading-relaxed">
                  Developed by language teaching professionals using research-backed methodologies for optimal retention.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For Students Section */}
        <section id="students" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-sm mb-6">
                <BookOpen className="w-4 h-4" />
                For Learners
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Master French with AI-Powered Learning
              </h3>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                ProfElite helps students improve their French writing skills through comprehensive AI analysis, personalized feedback, and detailed progress tracking.
              </p>
              <ul className="space-y-4 mb-10">
                {["Comprehensive text analysis with error categorization", "Save texts for later analysis", "Track improvement over time with visual dashboards", "Upload PDF/Word/TXT files for automatic transcription"].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Sparkles className="text-indigo-600 w-5 h-5 mt-1 flex-shrink-0" />
                    <span className="text-lg text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 inline-block">
                Start Learning Free
              </Link>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-3xl p-12 border border-slate-200">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Your Progress</div>
                    <div className="text-sm text-indigo-600">Student Dashboard</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-700">Texts Analyzed</span>
                    <span className="font-bold text-indigo-600">12</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-700">Improvement Rate</span>
                    <span className="font-bold text-indigo-600">+28%</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-700">Grammar Score</span>
                    <span className="font-bold text-indigo-600">85/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Teachers Section */}
        <section id="teachers" className="py-24 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-sm mb-6">
                <Users className="w-4 h-4" />
                For Educators
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Empower Your Teaching with AI
              </h3>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                ProfElite helps teachers track student progress, identify learning gaps, and provide personalized feedback at scale.
              </p>
              <ul className="space-y-4 mb-10">
                {["Student progress analytics", "Automated assignment grading", "Personalized feedback generation"].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Sparkles className="text-indigo-600 w-5 h-5 mt-1 flex-shrink-0" />
                    <span className="text-lg text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 inline-block">
                Request Teacher Access
              </Link>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-3xl p-12 border border-slate-200">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">ProfElite Analytics</div>
                    <div className="text-sm text-indigo-600">Classroom Dashboard</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-700">Average Progress</span>
                    <span className="font-bold text-indigo-600">+32%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100" style={{ display: "none" }}>
                    <span className="text-slate-700">Active Students</span>
                    <span className="font-bold text-indigo-600">24/28</span>
                  </div>
                  <div className="flex justify-between items-center py-3" style={{ display: "none" }}>
                    <span className="text-slate-700">Completion Rate</span>
                    <span className="font-bold text-indigo-600">89%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <SectionHeading className="mb-8">
              Ready to master French?
            </SectionHeading>
            <p className="text-xl text-slate-600 mb-12">
              Join thousands of learners and teachers using ProfElite to achieve fluency faster.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="px-10 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200">
                Start Free Trial
              </Link>
              <Link to="/login" className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-lg text-lg font-semibold hover:bg-slate-50 transition-all active:scale-95">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-2">
                <img src="/logo.svg" alt="ProfElite" className="w-10 h-10 rounded-lg" />
                <span className="font-bold text-xl text-white tracking-tight">ProfElite</span>
              </Link>
              <p className="text-slate-400 text-sm mb-6">Learn French with AI</p>
              <div className="flex gap-4">
                <Twitter className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
                <Linkedin className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
                <Globe className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>

            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h5 className="font-bold mb-6 text-slate-300 uppercase tracking-widest text-xs">{category}</h5>
                <ul className="space-y-4">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-slate-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Globe size={16} />
              <span>English & Français</span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <span>© 2025 ProfElite</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
