import { useState, useEffect, useRef } from 'react';
import { Mic, Video, Square, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import JitsiMeetComponent from '../components/JitsiMeetComponent';
import AudioRecorderService from '../services/audioRecorderService';
import { uploadAudioRecording } from '../services/audioService';
import { getJitsiToken } from '../services/jitsiService';

const PUBLIC_JITSI_DOMAIN = 'meet.jit.si';
const normalizeJitsiDomain = (value) => {
  if (!value) {
    return PUBLIC_JITSI_DOMAIN;
  }
  const trimmed = String(value).trim();
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const withoutPath = withoutProtocol.split('/')[0];
  return withoutPath || PUBLIC_JITSI_DOMAIN;
};
const DEFAULT_JITSI_DOMAIN = normalizeJitsiDomain(
  import.meta.env.VITE_JITSI_DOMAIN || PUBLIC_JITSI_DOMAIN
);
const USE_JAAS = import.meta.env.VITE_USE_JAAS === 'true';

const OralAnalysis = ({ userEmail }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [roomName, setRoomName] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [jitsiDomain, setJitsiDomain] = useState(DEFAULT_JITSI_DOMAIN);
  const [jitsiJwt, setJitsiJwt] = useState(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  
  const audioRecorderRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const jitsiApiRef = useRef(null);

  // Initialize audio recorder service
  useEffect(() => {
    if (!AudioRecorderService.isSupported()) {
      setError('Votre navigateur ne supporte pas l\'enregistrement audio. Veuillez utiliser Chrome, Firefox ou Edge.');
    }
  }, []);

  // Update recording duration
  useEffect(() => {
    if (isRecording && audioRecorderRef.current) {
      durationIntervalRef.current = setInterval(() => {
        if (audioRecorderRef.current) {
          setRecordingDuration(audioRecorderRef.current.getDuration());
        }
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  const generateRoomName = () => {
    // Generate a short, random room name to avoid "members only" issues
    // and reduce the chance of pattern-based filtering.
    const getRandomHex = (length) => {
      if (window.crypto && window.crypto.getRandomValues) {
        const bytes = new Uint8Array(length);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
      return Math.random().toString(16).substring(2, 2 + length * 2);
    };

    const part1 = getRandomHex(8);
    const part2 = getRandomHex(8);
    return `room-${part1}-${part2}`;
  };

  const generateSessionId = () => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const fetchJitsiToken = async (room) => {
    if (!USE_JAAS) {
      setJitsiJwt(null);
      return null;
    }
    if (!userEmail) {
      throw new Error('Utilisateur non identifié pour la vidéoconférence.');
    }

    setIsFetchingToken(true);
    try {
      const data = await getJitsiToken(room, userEmail);
      if (data?.room_name) {
        setRoomName(data.room_name);
      }
      const normalizedDomain = normalizeJitsiDomain(data?.domain || jitsiDomain);
      setJitsiDomain(normalizedDomain);
      setJitsiJwt(data?.token || null);
      return data;
    } finally {
      setIsFetchingToken(false);
    }
  };

  const handleRetry = async (options = {}) => {
    console.log('Retrying with new room name...');
    const { reason } = options;
    const shouldFallbackDomain = reason === 'membersOnly' && jitsiDomain !== PUBLIC_JITSI_DOMAIN;

    // First, end the current call to clean up
    setIsCallActive(false);
    
    // Generate new room name and session ID
    const newRoomName = generateRoomName();
    const newSessionId = generateSessionId();
    
    // Clear errors and reset state
    setError(null);
    setUploadStatus(null);
    setIsRecording(false);
    setRecordingDuration(0);
    setJitsiJwt(null);
    
    // Cleanup audio recorder
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
      audioRecorderRef.current = null;
    }
    
    // Fallback to public domain if current domain requires auth
    if (shouldFallbackDomain) {
      console.warn('Switching Jitsi domain to meet.jit.si after membersOnly error');
      setJitsiDomain(PUBLIC_JITSI_DOMAIN);
    }

    // Set new room name and session ID
    setRoomName(newRoomName);
    setSessionId(newSessionId);
    
    // Wait a bit for cleanup, then restart
    try {
      if (USE_JAAS && !shouldFallbackDomain) {
        await fetchJitsiToken(newRoomName);
      }
      setTimeout(() => {
        setIsCallActive(true);
      }, 500);
    } catch (err) {
      console.error('Error fetching Jitsi token on retry:', err);
      setError(`Impossible de générer le token Jitsi: ${err.message}`);
      setIsCallActive(false);
    }
  };

  const startCall = async () => {
    try {
      setError(null);
      setUploadStatus(null);
      
      // Generate room name and session ID
      const newRoomName = generateRoomName();
      const newSessionId = generateSessionId();
      setRoomName(newRoomName);
      setSessionId(newSessionId);

      if (USE_JAAS) {
        await fetchJitsiToken(newRoomName);
      }

      // Initialize audio recorder service (but don't request mic access yet)
      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new AudioRecorderService();
        
        // Setup callbacks
        audioRecorderRef.current.onStop(async (audioBlob, duration) => {
          setIsRecording(false);
          setRecordingDuration(0);
          
          // Upload audio
          try {
            setUploadStatus('uploading');
            await uploadAudioRecording(audioBlob, userEmail, newSessionId, duration);
            setUploadStatus('success');
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            setUploadStatus('error');
            setError(`Erreur lors de l'upload: ${uploadError.message}`);
          }
        });

        audioRecorderRef.current.onError((error) => {
          console.error('Recording error:', error);
          setError(`Erreur d'enregistrement: ${error.message}`);
          setIsRecording(false);
        });
      }
      
      // Start the call - Jitsi will handle microphone access for the video call
      setIsCallActive(true);
    } catch (err) {
      console.error('Error starting call:', err);
      setError(`Impossible de démarrer l'appel: ${err.message}`);
    }
  };

  const startRecording = async () => {
    if (!hasConsent) {
      setError('Veuillez accepter l\'enregistrement audio avant de commencer.');
      return;
    }

    try {
      // Initialize recorder if not already initialized
      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new AudioRecorderService();
        
        // Setup callbacks
        audioRecorderRef.current.onStop(async (audioBlob, duration) => {
          setIsRecording(false);
          setRecordingDuration(0);
          
          // Upload audio
          try {
            setUploadStatus('uploading');
            await uploadAudioRecording(audioBlob, userEmail, sessionId, duration);
            setUploadStatus('success');
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            setUploadStatus('error');
            setError(`Erreur lors de l'upload: ${uploadError.message}`);
          }
        });

        audioRecorderRef.current.onError((error) => {
          console.error('Recording error:', error);
          setError(`Erreur d'enregistrement: ${error.message}`);
          setIsRecording(false);
        });
      }

      // Request microphone access and initialize recorder
      await audioRecorderRef.current.initialize();
      
      // Start recording
      audioRecorderRef.current.startRecording(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingDuration(0);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Impossible de démarrer l'enregistrement: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (audioRecorderRef.current && isRecording) {
      audioRecorderRef.current.stopRecording();
    }
  };

  const endCall = () => {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Cleanup audio recorder
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
      audioRecorderRef.current = null;
    }

    // Reset state
    setIsCallActive(false);
    setIsRecording(false);
    setRecordingDuration(0);
    setRoomName(null);
    setSessionId(null);
    setJitsiJwt(null);
    setIsFetchingToken(false);
    setError(null);
    setUploadStatus(null);
    setHasConsent(false);
  };

  const handleCallEnd = () => {
    endCall();
  };

  const handleParticipantJoined = (participant) => {
    console.log('Participant joined:', participant);
  };

  const handleParticipantLeft = (participant) => {
    console.log('Participant left:', participant);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Page Header */}
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
            Lancez un appel vidéo avec votre professeur et enregistrez votre production orale pour une analyse complète en français avec l'intelligence artificielle.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isFetchingToken && (
          <div className="mb-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <p className="text-indigo-700 text-sm">Génération du token Jitsi en cours...</p>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus === 'uploading' && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-700 text-sm">Téléchargement de l'enregistrement...</p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 text-sm">Enregistrement sauvegardé avec succès !</p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 text-sm">Erreur lors de la sauvegarde de l'enregistrement.</p>
          </div>
        )}

        {/* Call Interface */}
        {!isCallActive ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Appel Vidéo avec Enregistrement</h2>
              <p className="text-slate-600 mb-6">
                Lancez un appel vidéo via Jitsi Meet. L'audio de votre microphone sera enregistré pour analyse.
              </p>
            </div>

            {/* Consent Checkbox */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    Consentement à l'enregistrement audio
                  </p>
                  <p className="text-xs text-amber-700">
                    J'accepte que mon audio soit enregistré pendant l'appel vidéo pour analyse ultérieure. 
                    L'enregistrement sera sauvegardé de manière sécurisée.
                  </p>
                </div>
              </label>
            </div>

            {/* Start Call Button */}
            <div className="flex justify-center">
              <button
                onClick={startCall}
                disabled={!hasConsent}
                className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center gap-3 ${
                  hasConsent
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Video className="w-5 h-5" />
                Démarrer l'appel vidéo
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-600 text-center">
                <strong>Note importante :</strong> Seul l'audio de votre microphone sera enregistré. 
                L'audio des autres participants ne sera pas capturé avec cette solution.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recording Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Mic className="w-5 h-5" />
                      Démarrer l'enregistrement
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={stopRecording}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Square className="w-5 h-5" />
                        Arrêter l'enregistrement
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-slate-700 font-mono font-semibold">
                          {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={endCall}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Terminer l'appel
                </button>
              </div>
            </div>

            {/* Jitsi Meet Component */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden" style={{ minHeight: '600px', height: '600px' }}>
              {roomName && (
                <JitsiMeetComponent
                  key={roomName} // Force re-render when roomName changes
                  roomName={roomName}
                  userEmail={userEmail}
                  displayName={userEmail?.split('@')[0] || 'User'}
                  domain={normalizeJitsiDomain(jitsiDomain)}
                  jwt={jitsiJwt}
                  onCallEnd={handleCallEnd}
                  onParticipantJoined={handleParticipantJoined}
                  onParticipantLeft={handleParticipantLeft}
                  onRetry={handleRetry}
                  config={{
                    configOverwrite: {
                      startWithAudioMuted: false,
                      startWithVideoMuted: false,
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OralAnalysis;

