import { useEffect, useCallback } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { isNativePlatform, isIOS } from '@/lib/platform';

interface UseNativeAppOptions {
  onDeepLink?: (url: string) => void;
  onBackButton?: () => boolean;
  statusBarStyle?: Style;
  statusBarColor?: string;
}

/**
 * Hook for native app lifecycle and configuration
 */
export function useNativeApp(options: UseNativeAppOptions = {}) {
  const { 
    onDeepLink, 
    onBackButton,
    statusBarStyle = Style.Dark,
    statusBarColor = '#0f172a' // Match app background
  } = options;

  const isNative = isNativePlatform();

  /**
   * Configure status bar appearance
   */
  const configureStatusBar = useCallback(async () => {
    if (!isNative) return;

    try {
      await StatusBar.setStyle({ style: statusBarStyle });
      
      // Background color only works on Android
      if (!isIOS()) {
        await StatusBar.setBackgroundColor({ color: statusBarColor });
      }
    } catch (error) {
      console.warn('StatusBar configuration failed:', error);
    }
  }, [isNative, statusBarStyle, statusBarColor]);

  /**
   * Configure keyboard behavior (iOS)
   */
  const configureKeyboard = useCallback(async () => {
    if (!isNative || !isIOS()) return;

    try {
      // Show accessory bar (done button) on iOS
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
    } catch (error) {
      console.warn('Keyboard configuration failed:', error);
    }
  }, [isNative]);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    if (!isNative) return;

    // Configure on mount
    configureStatusBar();
    configureKeyboard();

    // Listen for deep links
    const urlListener = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('Deep link received:', event.url);
      onDeepLink?.(event.url);
    });

    // Listen for back button (Android)
    const backListener = App.addListener('backButton', () => {
      // Return true from callback to prevent default behavior
      const handled = onBackButton?.() ?? false;
      if (!handled) {
        // Default: let the app handle it normally
      }
    });

    // Listen for app state changes
    const stateListener = App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed, active:', isActive);
    });

    return () => {
      urlListener.then(l => l.remove());
      backListener.then(l => l.remove());
      stateListener.then(l => l.remove());
    };
  }, [isNative, onDeepLink, onBackButton, configureStatusBar, configureKeyboard]);

  return {
    isNative,
    configureStatusBar,
    configureKeyboard
  };
}
