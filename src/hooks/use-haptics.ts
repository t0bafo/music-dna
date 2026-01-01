import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from '@/lib/platform';

/**
 * Hook for haptic feedback on native platforms
 */
export function useHaptics() {
  const isNative = isNativePlatform();

  /**
   * Trigger impact haptic feedback
   * @param style - Light, Medium, or Heavy impact
   */
  const impact = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  }, [isNative]);

  /**
   * Trigger notification haptic feedback
   * @param type - Success, Warning, or Error
   */
  const notification = useCallback(async (type: NotificationType = NotificationType.Success) => {
    if (isNative) {
      try {
        await Haptics.notification({ type });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  }, [isNative]);

  /**
   * Trigger selection changed haptic (for drag/scroll)
   */
  const selectionChanged = useCallback(async () => {
    if (isNative) {
      try {
        await Haptics.selectionChanged();
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  }, [isNative]);

  /**
   * Light tap for button presses
   */
  const lightTap = useCallback(() => impact(ImpactStyle.Light), [impact]);

  /**
   * Medium tap for confirmations
   */
  const mediumTap = useCallback(() => impact(ImpactStyle.Medium), [impact]);

  /**
   * Heavy tap for destructive actions
   */
  const heavyTap = useCallback(() => impact(ImpactStyle.Heavy), [impact]);

  /**
   * Success notification
   */
  const success = useCallback(() => notification(NotificationType.Success), [notification]);

  /**
   * Error notification
   */
  const error = useCallback(() => notification(NotificationType.Error), [notification]);

  /**
   * Warning notification
   */
  const warning = useCallback(() => notification(NotificationType.Warning), [notification]);

  return {
    impact,
    notification,
    selectionChanged,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
    warning,
    isNative
  };
}

// Re-export types for convenience
export { ImpactStyle, NotificationType } from '@capacitor/haptics';
