import { useCallback } from 'react';
import { Share, ShareOptions, ShareResult } from '@capacitor/share';
import { isNativePlatform } from '@/lib/platform';

/**
 * Hook for native share functionality
 */
export function useNativeShare() {
  const isNative = isNativePlatform();

  /**
   * Check if native sharing is available
   */
  const canShare = useCallback(async (): Promise<boolean> => {
    if (isNative) {
      try {
        const result = await Share.canShare();
        return result.value;
      } catch {
        return false;
      }
    }
    return !!navigator.share;
  }, [isNative]);

  /**
   * Share text content
   */
  const shareText = useCallback(async (
    title: string, 
    text: string, 
    url?: string
  ): Promise<ShareResult | null> => {
    const options: ShareOptions = {
      title,
      text,
      url,
      dialogTitle: title
    };

    if (isNative) {
      try {
        return await Share.share(options);
      } catch (error) {
        console.error('Native share failed:', error);
        return null;
      }
    }

    // Web fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return { activityType: 'web-share' };
      } catch (error) {
        // User cancelled or share failed
        console.log('Web share cancelled or failed:', error);
        return null;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text + (url ? `\n${url}` : ''));
      return { activityType: 'clipboard' };
    } catch {
      return null;
    }
  }, [isNative]);

  /**
   * Share Musical Identity card
   */
  const shareIdentity = useCallback(async (
    text: string,
    imageDataUrl?: string
  ): Promise<ShareResult | null> => {
    const options: ShareOptions = {
      title: 'My Music DNA',
      text,
      dialogTitle: 'Share your Musical Identity'
    };

    // Note: File sharing with base64 images requires native file handling
    // For now, we share the text. Image sharing can be enhanced with @capacitor/filesystem

    if (isNative) {
      try {
        return await Share.share(options);
      } catch (error) {
        console.error('Share failed:', error);
        return null;
      }
    }

    // Web fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Music DNA',
          text
        });
        return { activityType: 'web-share' };
      } catch {
        return null;
      }
    }

    return null;
  }, [isNative]);

  return {
    canShare,
    shareText,
    shareIdentity,
    isNative
  };
}
