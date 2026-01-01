import { useCallback, useEffect, useState } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { isNativePlatform, getPlatformName } from '@/lib/platform';
import { supabase } from '@/integrations/supabase/client';

interface UsePushNotificationsOptions {
  userId?: string;
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationAction?: (action: ActionPerformed) => void;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const { userId, onNotificationReceived, onNotificationAction } = options;
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [token, setToken] = useState<string | null>(null);

  const isNative = isNativePlatform();

  /**
   * Request push notification permissions
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      const result = await PushNotifications.requestPermissions();
      const granted = result.receive === 'granted';
      setPermissionStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Failed to request push permissions:', error);
      return false;
    }
  }, [isNative]);

  /**
   * Register for push notifications
   */
  const register = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      // Check current permission status
      const permCheck = await PushNotifications.checkPermissions();
      
      if (permCheck.receive !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Register with APNs/FCM
      await PushNotifications.register();
      setIsRegistered(true);
      return true;
    } catch (error) {
      console.error('Push registration failed:', error);
      return false;
    }
  }, [isNative, requestPermission]);

  /**
   * Save token to database using raw SQL via RPC or direct insert
   */
  const saveToken = useCallback(async (pushToken: string, spotifyUserId: string) => {
    try {
      const platform = getPlatformName();
      
      // Use type assertion to bypass strict typing since table was just created
      const { error } = await (supabase as any).from('push_tokens').upsert({
        user_id: spotifyUserId,
        token: pushToken,
        platform,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'token'
      });

      if (error) {
        console.error('Failed to save push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }, []);

  /**
   * Remove token from database (for logout)
   */
  const removeToken = useCallback(async () => {
    if (!token) return;

    try {
      await (supabase as any).from('push_tokens').delete().eq('token', token);
      setToken(null);
      console.log('Push token removed');
    } catch (error) {
      console.error('Failed to remove push token:', error);
    }
  }, [token]);

  // Set up listeners
  useEffect(() => {
    if (!isNative) return;

    // Registration success
    const registrationListener = PushNotifications.addListener('registration', async (tokenData: Token) => {
      console.log('Push registration successful:', tokenData.value);
      setToken(tokenData.value);

      // Save to database if user ID is available
      if (userId) {
        await saveToken(tokenData.value, userId);
      }
    });

    // Registration error
    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setIsRegistered(false);
    });

    // Notification received while app is in foreground
    const receivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // Notification action performed (user tapped notification)
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action:', action);
      onNotificationAction?.(action);
    });

    // Check initial permission status
    PushNotifications.checkPermissions().then((result) => {
      setPermissionStatus(result.receive as 'granted' | 'denied' | 'prompt');
    });

    return () => {
      registrationListener.then(l => l.remove());
      errorListener.then(l => l.remove());
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [isNative, userId, onNotificationReceived, onNotificationAction, saveToken]);

  // Auto-save token when userId becomes available
  useEffect(() => {
    if (token && userId) {
      saveToken(token, userId);
    }
  }, [token, userId, saveToken]);

  return {
    isNative,
    isRegistered,
    permissionStatus,
    token,
    register,
    requestPermission,
    removeToken
  };
}
