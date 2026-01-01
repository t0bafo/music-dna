import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { isNativePlatform, isIOS } from '@/lib/platform';
import { exchangeCodeForTokens, storeTokens } from '@/lib/spotify-auth';

interface NativeAppProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that handles native app initialization
 * - Status bar configuration
 * - Keyboard handling
 * - Deep link OAuth callbacks
 */
export const NativeAppProvider: React.FC<NativeAppProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  /**
   * Handle OAuth callback from deep link
   */
  const handleOAuthCallback = useCallback(async (url: string) => {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const error = urlObj.searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/');
        return;
      }

      if (code) {
        console.log('Processing OAuth callback from deep link');
        const tokens = await exchangeCodeForTokens(code);
        
        if (tokens) {
          storeTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);
          navigate('/home');
        } else {
          console.error('Failed to exchange code for tokens');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      navigate('/');
    }
  }, [navigate]);

  /**
   * Configure native app on mount
   */
  useEffect(() => {
    if (!isNativePlatform()) return;

    const setupNativeApp = async () => {
      try {
        // Configure status bar
        await StatusBar.setStyle({ style: Style.Dark });
        
        // Set background color on Android
        if (!isIOS()) {
          await StatusBar.setBackgroundColor({ color: '#0f172a' });
        }

        // Configure keyboard on iOS
        if (isIOS()) {
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
        }
      } catch (error) {
        console.warn('Native app configuration failed:', error);
      }
    };

    setupNativeApp();

    // Listen for deep links (OAuth callback)
    const urlListener = App.addListener('appUrlOpen', ({ url }) => {
      console.log('Deep link received:', url);
      
      // Check if this is an OAuth callback
      if (url.includes('/callback') || url.includes('musicdna://callback')) {
        handleOAuthCallback(url);
      }
    });

    // Handle back button on Android
    const backListener = App.addListener('backButton', () => {
      // Let React Router handle navigation
      // Return false to allow default behavior
    });

    // App state changes (for analytics, refresh, etc.)
    const stateListener = App.addListener('appStateChange', ({ isActive }) => {
      console.log('App active:', isActive);
    });

    return () => {
      urlListener.then(l => l.remove());
      backListener.then(l => l.remove());
      stateListener.then(l => l.remove());
    };
  }, [handleOAuthCallback]);

  return <>{children}</>;
};
