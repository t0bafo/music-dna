import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCrates,
  getCrate,
  createCrate,
  updateCrate,
  deleteCrate,
  addTracksToCrate,
  removeTrackFromCrate,
  reorderCrateTracks,
  Crate,
  CrateWithTracks,
  TrackToAdd
} from '@/lib/crates-api';
import { toast } from 'sonner';

/**
 * Hook to fetch all crates
 */
export function useCrates() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ['crates', accessToken],
    queryFn: () => getCrates(accessToken!),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch single crate with tracks
 */
export function useCrate(crateId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ['crate', crateId, accessToken],
    queryFn: () => getCrate(crateId!, accessToken!),
    enabled: !!accessToken && !!crateId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to create a new crate
 */
export function useCreateCrate() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description: string | null; emoji: string; color: string; vibe_keywords?: string[] }) =>
      createCrate(data.name, data.description, data.emoji, data.color, accessToken!, data.vibe_keywords),
    onSuccess: (newCrate) => {
      queryClient.invalidateQueries({ queryKey: ['crates'] });
      toast.success(`Created "${newCrate.name}"`, {
        description: 'Your new crate is ready!'
      });
    },
    onError: (error) => {
      toast.error('Failed to create crate', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  });
}

/**
 * Hook to update a crate
 */
export function useUpdateCrate() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { crateId: string; name: string; description: string | null; emoji: string; color: string }) =>
      updateCrate(data.crateId, data.name, data.description, data.emoji, data.color, accessToken!),
    onSuccess: (updatedCrate) => {
      queryClient.invalidateQueries({ queryKey: ['crates'] });
      queryClient.invalidateQueries({ queryKey: ['crate', updatedCrate.id] });
      toast.success('Crate updated');
    },
    onError: (error) => {
      toast.error('Failed to update crate', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  });
}

/**
 * Hook to delete a crate
 */
export function useDeleteCrate() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (crateId: string) => deleteCrate(crateId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crates'] });
      toast.success('Crate deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete crate', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  });
}

/**
 * Hook to add tracks to a crate (with auto-sync trigger)
 */
export function useAddTracksToCrate() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { crateId: string; tracks: TrackToAdd[] }) =>
      addTracksToCrate(data.crateId, data.tracks, accessToken!),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crates'] });
      queryClient.invalidateQueries({ queryKey: ['crate', variables.crateId] });
      toast.success(`Added ${variables.tracks.length} track${variables.tracks.length !== 1 ? 's' : ''}`);
      
      // Trigger sync in background if enabled
      triggerSyncIfEnabled(variables.crateId, accessToken!);
    },
    onError: (error) => {
      toast.error('Failed to add tracks', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  });
}

/**
 * Hook to remove track from crate (with auto-sync trigger)
 */
export function useRemoveTrackFromCrate() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { crateId: string; trackId: string }) =>
      removeTrackFromCrate(data.crateId, data.trackId, accessToken!),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crates'] });
      queryClient.invalidateQueries({ queryKey: ['crate', variables.crateId] });
      toast.success('Track removed');
      
      // Trigger sync in background if enabled
      triggerSyncIfEnabled(variables.crateId, accessToken!);
    },
    onError: (error) => {
      toast.error('Failed to remove track', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  });
}

/**
 * Hook to reorder tracks in crate (with auto-sync trigger)
 */
export function useReorderCrateTracks() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { crateId: string; trackIds: string[] }) =>
      reorderCrateTracks(data.crateId, data.trackIds, accessToken!),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crate', variables.crateId] });
      
      // Trigger sync in background if enabled
      triggerSyncIfEnabled(variables.crateId, accessToken!);
    },
    onError: (error) => {
      toast.error('Failed to reorder tracks', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  });
}

/**
 * Helper to trigger sync if crate has sync enabled
 */
async function triggerSyncIfEnabled(crateId: string, accessToken: string) {
  try {
    // Import dynamically to avoid circular deps
    const { syncCrateToSpotify } = await import('@/lib/spotify-sync');
    const { getCrate } = await import('@/lib/crates-api');
    
    const crate = await getCrate(crateId, accessToken);
    
    if (crate.sync_enabled && crate.spotify_playlist_id) {
      // Debounce: wait 1 second before syncing
      setTimeout(async () => {
        try {
          await syncCrateToSpotify(crateId, accessToken);
          console.log('[use-crates] Auto-synced crate:', crateId);
        } catch (syncError) {
          console.error('[use-crates] Auto-sync failed:', syncError);
        }
      }, 1000);
    }
  } catch (error) {
    console.error('[use-crates] Failed to check sync status:', error);
  }
}
