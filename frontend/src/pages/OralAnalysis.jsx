import { Mic, Sparkles, Upload, Radio, CheckCircle } from 'lucide-react';

const OralAnalysis = ({ userEmail }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="p-8 max-w-7xl mx-auto">
          {/* Page Header with enhanced styling */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Analyse Vocale</h1>
              </div>
            </div>
            <p className="text-slate-600 text-lg leading-relaxed ml-[60px]">
              Enregistrez ou importez un fichier audio pour une analyse complète de votre production orale en français avec l'intelligence artificielle.
            </p>
          </div>

          {/* In Progress Banner - Enhanced */}
          <div className="relative bg-gradient-to-br from-amber-50 via-amber-100/50 to-orange-50 border-2 border-amber-300/50 rounded-3xl p-8 mb-10 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl"></div>
            <div className="relative flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Fonctionnalité en développement</h3>
                <p className="text-base text-slate-700 leading-relaxed">
                  Cette section sera bientôt disponible avec des fonctionnalités avancées d'analyse vocale et de transcription intelligente pour améliorer votre apprentissage du français.
                </p>
              </div>
            </div>
          </div>

          {/* Action Cards - New interactive section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Upload Audio Card */}
            <div className="group bg-white rounded-3xl border-2 border-slate-200 hover:border-indigo-300 transition-all duration-300 p-8 cursor-pointer hover:shadow-xl" style={{
              display: "none"
            }}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Importer un fichier</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Téléchargez votre enregistrement audio (MP3, WAV, M4A) pour une analyse détaillée
                </p>
              </div>
            </div>

            {/* Record Audio Card */}
            <div className="group bg-white rounded-3xl border-2 border-slate-200 hover:border-purple-300 transition-all duration-300 p-8 cursor-pointer hover:shadow-xl" style={{
              display: "none"
            }}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Radio className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Enregistrer maintenant</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Utilisez votre microphone pour enregistrer directement votre production orale
                </p>
              </div>
            </div>
          </div>

          {/* Google Meet Integration Card - Enhanced */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-10 text-white overflow-hidden" style={{
                display: "none"
              }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl"></div>
                <div className="relative flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-1">Google Meet</h3>
                    <p className="text-white/90 text-base">Intégration avancée</p>
                  </div>
                </div>
                <p className="relative text-white/80 text-sm leading-relaxed">
                  Connectez vos réunions Google Meet pour une transcription et analyse automatique de vos échanges en français
                </p>
              </div>

              <div className="p-10" style={{
                display: "none"
              }}>
                <div className="space-y-4 mb-8">
                  {['Transcription automatique des réunions Google Meet', 'Analyse en temps réel de vos productions orales', 'Calibrage TTS spécialisé pour le FLE', 'Sauvegarde automatique des transcriptions'].map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 text-slate-700 group">
                      <div className="mt-0.5">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-base leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
                  <p className="text-sm font-bold text-amber-800 text-center tracking-wide">
                    📅 Phase 4-5 - En développement actif
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Overview - Enhanced */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-10" style={{
            display: "none"
          }}>
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-slate-900 mb-3">Fonctionnalités à venir</h3>
              <p className="text-slate-600 text-base">Découvrez les outils avancés qui enrichiront votre expérience d'apprentissage</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="relative bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute top-4 right-4 w-12 h-12 bg-indigo-100 rounded-full opacity-50 group-hover:scale-125 transition-transform"></div>
                <div className="relative">
                  <div className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    Détection d'accents
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Identification des particularités phonétiques et recommandations ciblées pour améliorer votre prononciation et développer un français plus authentique
                  </p>
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-slate-50 to-purple-50/50 rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute top-4 right-4 w-12 h-12 bg-purple-100 rounded-full opacity-50 group-hover:scale-125 transition-transform"></div>
                <div className="relative">
                  <div className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Analyse de la fluidité
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Évaluation du rythme, des pauses et de la cohérence du discours pour un français plus naturel et une communication plus confiante
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default OralAnalysis;

