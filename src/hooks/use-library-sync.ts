import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { extractMusicLibrary, ExtractionProgress } from '@/lib/music-intelligence';
import { useInvalidateMusicCache } from '@/hooks/use-music-intelligence';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'library_last_updated';
const STALE_DAYS = 7;

export interface LibrarySyncState {
  lastUpdated: Date | null;
  daysSinceUpdate: number | null;
  isStale: boolean;
  isSyncing: boolean;
  syncProgress: ExtractionProgress | null;
  triggerSync: () => Promise<void>;
}

// Get last updated timestamp from localStorage
const getLastUpdated = (): Date | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
};

// Save last updated timestamp to localStorage
export const setLastUpdated = (date: Date = new Date()): void => {
  try {
    localStorage.setItem(STORAGE_KEY, date.toISOString());
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('library-sync-updated'));
  } catch (error) {
    console.error('[LibrarySync] Failed to save timestamp:', error);
  }
};

// Calculate days since last update
const getDaysSinceUpdate = (lastUpdated: Date | null): number | null => {
  if (!lastUpdated) return null;
  return Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Hook to manage library sync state and auto-refresh
 * @param autoRefresh - Whether to automatically trigger refresh if stale (default: true)
 */
export const useLibrarySync = (autoRefresh = true): LibrarySyncState => {
  const { accessToken, user, isAuthenticated } = useAuth();
  const invalidateCache = useInvalidateMusicCache();
  
  const [lastUpdated, setLastUpdatedState] = useState<Date | null>(getLastUpdated);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<ExtractionProgress | null>(null);
  
  // Prevent duplicate auto-syncs
  const autoSyncTriggeredRef = useRef(false);
  const syncInProgressRef = useRef(false);

  const daysSinceUpdate = getDaysSinceUpdate(lastUpdated);
  const isStale = daysSinceUpdate === null || daysSinceUpdate > STALE_DAYS;

  // Listen for sync updates from other tabs/components
  useEffect(() => {
    const handleUpdate = () => {
      setLastUpdatedState(getLastUpdated());
    };
    
    window.addEventListener('library-sync-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('library-sync-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Sync function
  const triggerSync = useCallback(async () => {
    if (!accessToken || !user?.id || syncInProgressRef.current) {
      console.log('[LibrarySync] Skipping sync - no token, user, or sync in progress');
      return;
    }

    syncInProgressRef.current = true;
    setIsSyncing(true);
    
    console.log('[LibrarySync] Starting library sync...');
    
    try {
      await extractMusicLibrary(accessToken, user.id, setSyncProgress);
      
      // Update timestamp
      setLastUpdated();
      setLastUpdatedState(new Date());
      
      // Invalidate cache to refetch fresh data
      invalidateCache();
      
      console.log('[LibrarySync] Sync completed successfully');
      
      toast({
        title: "Library updated!",
        description: "Your music data is now fresh",
      });
    } catch (error) {
      console.error('[LibrarySync] Sync failed:', error);
      toast({
        title: "Sync failed",
        description: "Couldn't update your library. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      syncInProgressRef.current = false;
    }
  }, [accessToken, user?.id, invalidateCache]);

  // Auto-refresh when stale (non-blocking background sync)
  useEffect(() => {
    if (
      !autoRefresh ||
      !isAuthenticated ||
      !accessToken ||
      !user?.id ||
      !isStale ||
      autoSyncTriggeredRef.current ||
      syncInProgressRef.current
    ) {
      return;
    }

    // Mark as triggered to prevent duplicate syncs
    autoSyncTriggeredRef.current = true;
    
    console.log('[LibrarySync] Data is stale, triggering background sync...');
    
    // Show initial toast
    toast({
      title: "Syncing your music library...",
      description: "This won't interrupt what you're doing",
    });
    
    // Trigger sync in background (don't await)
    triggerSync();
    
  }, [isAuthenticated, accessToken, user?.id, isStale, autoRefresh, triggerSync]);

  // Reset auto-sync flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      autoSyncTriggeredRef.current = false;
    }
  }, [isAuthenticated]);

  return {
    lastUpdated,
    daysSinceUpdate,
    isStale,
    isSyncing,
    syncProgress,
    triggerSync,
  };
};

/**
 * Hook to just read sync status without triggering auto-refresh
 * Useful for display-only components
 */
export const useLibrarySyncStatus = () => {
  const [lastUpdated, setLastUpdatedState] = useState<Date | null>(getLastUpdated);

  useEffect(() => {
    const handleUpdate = () => {
      setLastUpdatedState(getLastUpdated());
    };
    
    window.addEventListener('library-sync-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('library-sync-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const daysSinceUpdate = getDaysSinceUpdate(lastUpdated);
  const isStale = daysSinceUpdate === null || daysSinceUpdate > STALE_DAYS;

  return {
    lastUpdated,
    daysSinceUpdate,
    isStale,
  };
};
