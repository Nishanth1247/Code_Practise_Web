import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export function GoogleSignInButton({ onSuccess, onError, loading = false, disabled = false }) {
  const buttonContainerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [configError, setConfigError] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Check script availability and load if needed
  useEffect(() => {
    if (!clientId) {
      setConfigError('Google Sign-In is not configured. Missing VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    // Function to initialize button once Google Identity Services is available
    const initGsi = () => {
      if (window.google?.accounts?.id && buttonContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (response && response.credential) {
                onSuccess?.(response.credential);
              } else {
                onError?.('Google authentication failed: No credentials returned.');
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Clear previous render to avoid duplicate buttons on re-render
          buttonContainerRef.current.innerHTML = '';

          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: buttonContainerRef.current.offsetWidth || 384
          });

          setScriptLoaded(true);
        } catch (err) {
          console.error('Failed to initialize Google Sign-In:', err);
          setConfigError('Failed to initialize Google Sign-In.');
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      // Poll briefly for script load if not immediately ready
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGsi();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.accounts?.id) {
          setConfigError('Google Identity Services script failed to load. Check your network connection.');
        }
      }, 5000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [clientId, onSuccess, onError]);

  // Handle fallback click if official button is clicked before script or in prompt mode
  const handleFallbackClick = () => {
    if (!clientId) {
      onError?.('Google Client ID is missing. Please configure VITE_GOOGLE_CLIENT_ID in client/.env.');
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      onError?.('Google Sign-In is still initializing. Please try again in a moment.');
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Loading Overlay */}
      {loading ? (
        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-50 border border-[#DBEAFE] text-[#1E3A8A] text-sm font-semibold flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></span>
          <span>Verifying Google account...</span>
        </div>
      ) : (
        <>
          {/* Target container for Google's official rendered button */}
          <div
            ref={buttonContainerRef}
            className={`w-full flex justify-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ minHeight: '44px' }}
          >
            {/* Fallback branded button while GSI script initializes */}
            {!scriptLoaded && !configError && (
              <button
                type="button"
                onClick={handleFallbackClick}
                disabled={disabled}
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#1E293B] font-semibold text-sm transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          {/* Config Error notice if VITE_GOOGLE_CLIENT_ID is not configured */}
          {configError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{configError}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GoogleSignInButton;
