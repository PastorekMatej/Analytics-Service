import { useEffect, useRef, useState } from 'react';

/**
 * JitsiMeetComponent - Component for integrating Jitsi Meet video calls
 * Uses Jitsi Meet External API to embed video conferencing
 * 
 * @param {Object} props
 * @param {string} props.roomName - Name of the Jitsi room
 * @param {string} props.userEmail - Email of the current user
 * @param {string} props.displayName - Display name for the user
 * @param {Function} props.onCallEnd - Callback when call ends
 * @param {Function} props.onParticipantJoined - Callback when participant joins
 * @param {Function} props.onParticipantLeft - Callback when participant leaves
 * @param {Object} props.config - Additional Jitsi config options
 * @param {string} props.jwt - Optional JaaS JWT token
 */
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

const JitsiMeetComponent = ({
  roomName,
  userEmail,
  displayName,
  onCallEnd,
  onParticipantJoined,
  onParticipantLeft,
  onRetry,
  domain = DEFAULT_JITSI_DOMAIN,
  config = {},
  jwt
}) => {
  const normalizedDomain = normalizeJitsiDomain(domain);
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const membersOnlyRetriesRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't initialize if roomName is not set yet
    if (!roomName) {
      return;
    }
    membersOnlyRetriesRef.current = 0;
    
    // Generate unique room name if not provided
    const finalRoomName = roomName || `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Initializing Jitsi with room name:', finalRoomName);
    
    // Load Jitsi Meet External API script
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        // Check if script already loaded
        const existingScript = document.querySelector('script[src*="external_api.js"]');
        const hasMatchingScript = existingScript && existingScript.src.includes(normalizedDomain);
        if (window.JitsiMeetExternalAPI && hasMatchingScript) {
          resolve();
          return;
        }

        if (existingScript && !hasMatchingScript) {
          console.warn('Removing mismatched Jitsi script:', existingScript.src);
          existingScript.remove();
          if (window.JitsiMeetExternalAPI) {
            delete window.JitsiMeetExternalAPI;
          }
        }

        const script = document.createElement('script');
        script.src = `https://${normalizedDomain}/external_api.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet script'));
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for script to load
        await loadJitsiScript();

        if (!jitsiContainerRef.current) {
          return;
        }

        // Default configuration
        const defaultConfig = {
          roomName: finalRoomName,
          jwt,
          parentNode: jitsiContainerRef.current,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
            disableDeepLinking: true,
            enableLobbyChat: false,
            enableNoAudioDetection: false,
            enableNoisyMicDetection: false,
            enablePrejoinPage: true,
            enableInsecureRoomNameWarning: false,
            enableLayerSuspension: true,
            disableInviteFunctions: false,
            // Prevent "members only" issues - use random room names
            requireDisplayName: false,
            ...config.configOverwrite
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'profile',
              'recording',
              'settings',
              'raisehand',
              'videoquality',
              'filmstrip',
              'feedback',
              'stats',
              'shortcuts',
              'tileview',
              'videobackgroundblur',
              'download',
              'help',
              'mute-everyone',
              'security'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
            DEFAULT_BACKGROUND: '#1a1a1a',
            ...config.interfaceConfigOverwrite
          },
          userInfo: {
            email: userEmail,
            displayName: displayName || userEmail?.split('@')[0] || 'User'
          }
        };

        // Merge with provided config
        const jitsiConfig = {
          ...defaultConfig,
          ...config,
          configOverwrite: {
            ...defaultConfig.configOverwrite,
            ...config.configOverwrite
          },
          interfaceConfigOverwrite: {
            ...defaultConfig.interfaceConfigOverwrite,
            ...config.interfaceConfigOverwrite
          }
        };

        // Initialize Jitsi Meet API
        if (!window.JitsiMeetExternalAPI) {
          throw new Error('Jitsi Meet External API not loaded');
        }
        const api = new window.JitsiMeetExternalAPI(normalizedDomain, jitsiConfig);
        apiRef.current = api;

        // Ensure iframe has proper permissions after creation
        setTimeout(() => {
          const iframe = jitsiContainerRef.current?.querySelector('iframe');
          if (iframe) {
            // Add required permissions if not already present
            const currentAllow = iframe.getAttribute('allow') || '';
            const requiredPermissions = [
              'camera',
              'microphone',
              'display-capture',
              'autoplay',
              'clipboard-write'
            ];
            const missingPermissions = requiredPermissions.filter(
              perm => !currentAllow.toLowerCase().includes(perm.toLowerCase())
            );
            if (missingPermissions.length > 0) {
              const newAllow = currentAllow 
                ? `${currentAllow}; ${missingPermissions.join('; ')}`
                : missingPermissions.join('; ');
              iframe.setAttribute('allow', newAllow);
              console.log('Added permissions to Jitsi iframe:', missingPermissions);
            }
            
            // Listen for postMessage from iframe to detect errors
            window.addEventListener('message', (event) => {
              // Only process messages from Jitsi domain
              if (event.origin.includes(normalizedDomain)) {
                if (event.data && typeof event.data === 'object') {
                  // Check for error messages
                  const dataStr = JSON.stringify(event.data).toLowerCase();
                  if (dataStr.includes('error') || dataStr.includes('permission') || dataStr.includes('denied')) {
                    console.log('Jitsi iframe message (potential error):', event.data);
                  }
                }
              }
            });
          }
        }, 1000);

        // Hide loading after API is initialized (iframe is created)
        // The iframe will be visible even if permissions are pending
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);

        // Set a timeout to detect if conference doesn't start
        connectionTimeoutRef.current = setTimeout(() => {
          // If still loading after 30 seconds, there might be an issue
          console.warn('Conference connection timeout - checking status');
          // Don't set error here, let user try to join manually
        }, 30000);

        // Event listeners
        api.addEventListener('videoConferenceJoined', () => {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          setIsLoading(false);
          setError(null);
        });

        api.addEventListener('videoConferenceLeft', () => {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          if (onCallEnd) {
            onCallEnd();
          }
          // Cleanup
          if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
          }
        });

        api.addEventListener('participantJoined', (participant) => {
          if (onParticipantJoined) {
            onParticipantJoined(participant);
          }
        });

        api.addEventListener('participantLeft', (participant) => {
          if (onParticipantLeft) {
            onParticipantLeft(participant);
          }
        });

        api.addEventListener('readyToClose', () => {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
          }
        });

        api.addEventListener('errorOccurred', (error) => {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          console.error('[Jitsi Event] errorOccurred:', error);
          console.error('Jitsi Meet error type:', typeof error);
          console.error('Jitsi Meet error keys:', error ? Object.keys(error) : 'no error');
          
          let errorMessage = 'Une erreur est survenue lors de la connexion';
          
          // Handle specific error types - extract from different possible structures
          if (error) {
            let errorType = null;
            
            // Try different ways to extract the error type
            if (typeof error === 'string') {
              errorType = error;
            } else if (error.error) {
              // error.error can be a string or an object
              if (typeof error.error === 'string') {
                errorType = error.error;
              } else if (typeof error.error === 'object' && error.error !== null) {
                // If error.error is an object, try to extract meaningful info
                // Check for common properties
                if (error.error.name) {
                  errorType = error.error.name;
                } else if (error.error.message) {
                  errorType = error.error.message;
                } else if (error.error.type) {
                  errorType = error.error.type;
                } else {
                  // Try to stringify and extract
                  try {
                    const errorStr = JSON.stringify(error.error);
                    // Look for error type patterns in the stringified object
                    const membersOnlyMatch = errorStr.match(/membersOnly|members.?only/i);
                    const connectionFailedMatch = errorStr.match(/connectionFailed|connection.?failed/i);
                    if (membersOnlyMatch) {
                      errorType = 'conference.connectionError.membersOnly';
                    } else if (connectionFailedMatch) {
                      errorType = 'conference.connectionError.connectionFailed';
                    } else {
                      errorType = errorStr;
                    }
                  } catch (e) {
                    errorType = String(error.error);
                  }
                }
              } else {
                errorType = String(error.error);
              }
            } else if (error.message) {
              errorType = String(error.message);
            } else if (error.type) {
              errorType = String(error.type);
            } else {
              // Try to stringify the whole error object
              try {
                const errorStr = JSON.stringify(error);
                if (errorStr !== '{}') {
                  // Check for known error patterns in the stringified object
                  if (errorStr.includes('membersOnly') || errorStr.includes('members only')) {
                    errorType = 'conference.connectionError.membersOnly';
                  } else if (errorStr.includes('connectionFailed') || errorStr.includes('connection failed')) {
                    errorType = 'conference.connectionError.connectionFailed';
                  } else {
                    errorType = errorStr;
                  }
                }
              } catch (e) {
                errorType = String(error);
              }
            }
            
            console.error('Extracted error type:', errorType);
            
            if (errorType) {
              const errorTypeStr = String(errorType).toLowerCase();

              if (errorTypeStr.includes('notallowed') || errorTypeStr.includes('permission denied')) {
                errorMessage = 'Permission refusée. Veuillez autoriser l\'accès au microphone et à la caméra dans les paramètres de votre navigateur, puis réessayez.';
              } else if (
                errorTypeStr.includes('authentication') ||
                errorTypeStr.includes('authentification') ||
                errorTypeStr.includes('jwt') ||
                errorTypeStr.includes('token') ||
                errorTypeStr.includes('unauthorized') ||
                errorTypeStr.includes('forbidden') ||
                errorTypeStr.includes('notauthorized') ||
                errorTypeStr.includes('not authorized')
              ) {
                errorMessage = 'Authentification requise. Le domaine Jitsi utilisé exige un JWT ou une configuration serveur autorisée. Essayez meet.jit.si ou un domaine approuvé.';
              } else if (errorTypeStr.includes('membersonly') || errorTypeStr.includes('members only')) {
                if (onRetry && membersOnlyRetriesRef.current < 2) {
                  membersOnlyRetriesRef.current += 1;
                  console.warn('Members-only detected, retrying with a new room name...');
                  setError(null);
                  setIsLoading(true);
                  if (apiRef.current) {
                    try {
                      apiRef.current.dispose();
                    } catch (err) {
                      console.error('Error disposing API:', err);
                    }
                    apiRef.current = null;
                  }
                  setTimeout(() => onRetry({ reason: 'membersOnly' }), 800);
                  return;
                }
                errorMessage = 'La conférence nécessite une authentification. Le serveur public peut limiter certaines salles. Essayez un domaine Jitsi dédié.';
              } else if (errorTypeStr.includes('connectionfailed') || errorTypeStr.includes('connection failed')) {
                errorMessage = 'Échec de la connexion. Vérifiez votre connexion internet.';
              } else if (errorTypeStr.includes('domainnotwhitelisted') || errorTypeStr.includes('domain not whitelisted')) {
                errorMessage = 'Le domaine n\'est pas autorisé. Veuillez contacter le support.';
              } else if (errorTypeStr.includes('timeout') || errorTypeStr.includes('timed out')) {
                errorMessage = 'Délai d\'attente dépassé. Vérifiez votre connexion internet et réessayez.';
              } else {
                // Extract readable message from error type
                const readableError = String(errorType)
                  .replace(/conference\.connectionError\./g, '')
                  .replace(/\[object object\]/gi, '')
                  .replace(/\./g, ' ')
                  .trim();
                
                if (readableError && readableError.length > 0 && readableError !== '{}') {
                  errorMessage = `Erreur de connexion: ${readableError}`;
                }
              }
            }
          }
          
        setError(errorMessage);
          setIsLoading(false);
        });

      } catch (err) {
        console.error('Error initializing Jitsi Meet:', err);
        setError('Impossible de charger la vidéoconférence');
        setIsLoading(false);
      }
    };

    initializeJitsi();

    // Cleanup on unmount or when roomName changes
    return () => {
      console.log('Cleaning up Jitsi instance for room:', finalRoomName);
      // Clear any pending timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
          console.log('Jitsi API disposed');
        } catch (err) {
          console.error('Error disposing Jitsi API:', err);
        }
        apiRef.current = null;
      }
      membersOnlyRetriesRef.current = 0;
      // Reset loading state
      setIsLoading(true);
      setError(null);
    };
  }, [roomName, userEmail, displayName, normalizedDomain, jwt]);

  const leaveCall = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
    }
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Connexion à la vidéoconférence...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
          <div className="text-center p-6 max-w-md">
            <div className="mb-4">
              <svg className="w-16 h-16 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-700 font-semibold mb-2 text-lg">{error}</p>
            {roomName && (
              <p className="text-xs text-red-600 mb-2">
                Domaine actuel : <span className="font-mono">{normalizedDomain}</span> • Salle : <span className="font-mono">{roomName}</span>
              </p>
            )}
            {error.toLowerCase().includes('authentification') && roomName && (
              <p className="text-sm text-red-600">
                Essayez <span className="font-mono">meet.jit.si</span> ou un domaine Jitsi autorisé via <span className="font-mono">VITE_JITSI_DOMAIN</span>.
              </p>
            )}
            {error.toLowerCase().includes('permission') && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <p className="text-sm text-amber-800 font-medium mb-2">Comment autoriser les permissions :</p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                  <li>Cliquez sur l'icône de cadenas ou "i" dans la barre d'adresse</li>
                  <li>Autorisez l'accès au microphone et à la caméra</li>
                  <li>Rechargez la page et réessayez</li>
                </ul>
              </div>
            )}
            <div className="flex gap-3 justify-center mt-6">
              {onRetry && normalizedDomain !== PUBLIC_JITSI_DOMAIN && (
                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    if (apiRef.current) {
                      try {
                        apiRef.current.dispose();
                      } catch (err) {
                        console.error('Error disposing API:', err);
                      }
                      apiRef.current = null;
                    }
                    onRetry({ reason: 'membersOnly' });
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Basculer vers meet.jit.si
                </button>
              )}
              {onRetry && (
                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    if (apiRef.current) {
                      try {
                        apiRef.current.dispose();
                      } catch (err) {
                        console.error('Error disposing API:', err);
                      }
                      apiRef.current = null;
                    }
                    onRetry({ reason: 'manual' });
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Réessayer avec nouvelle salle
                </button>
              )}
              {roomName && (
                <button
                  onClick={() => {
                    window.open(`https://${normalizedDomain}/${roomName}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Ouvrir dans un nouvel onglet
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        ref={jitsiContainerRef}
        className="w-full h-full min-h-[500px] rounded-lg overflow-hidden"
        style={{ display: error ? 'none' : 'block' }}
      />
    </div>
  );
};

// Export leaveCall method for external use
JitsiMeetComponent.leaveCall = () => {
  // This will be handled by the component instance
};

export default JitsiMeetComponent;

