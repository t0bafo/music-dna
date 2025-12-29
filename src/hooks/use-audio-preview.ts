/**
 * useAudioPreview - Hook for managing 30-second track previews
 * Only one track can play at a time across the app
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioPreviewReturn {
  currentTrackId: string | null;
  isPlaying: boolean;
  play: (trackId: string, previewUrl: string) => void;
  pause: () => void;
  toggle: (trackId: string, previewUrl: string) => void;
  stop: () => void;
}

// Global audio element to ensure only one plays at a time
let globalAudio: HTMLAudioElement | null = null;
let globalSetCurrentTrack: ((id: string | null) => void) | null = null;
let globalSetIsPlaying: ((playing: boolean) => void) | null = null;

export function useAudioPreview(): UseAudioPreviewReturn {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isActiveHook = useRef(false);

  // Take control of the global state when this hook is active
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (isActiveHook.current) {
        globalAudio?.pause();
        globalAudio = null;
        globalSetCurrentTrack = null;
        globalSetIsPlaying = null;
      }
    };
  }, []);

  const play = useCallback((trackId: string, previewUrl: string) => {
    // Stop any currently playing audio
    if (globalAudio) {
      globalAudio.pause();
      globalAudio = null;
    }

    // Notify previous hook that playback stopped
    if (globalSetCurrentTrack && globalSetCurrentTrack !== setCurrentTrackId) {
      globalSetCurrentTrack(null);
    }
    if (globalSetIsPlaying && globalSetIsPlaying !== setIsPlaying) {
      globalSetIsPlaying(false);
    }

    // Create new audio element
    const audio = new Audio(previewUrl);
    globalAudio = audio;
    globalSetCurrentTrack = setCurrentTrackId;
    globalSetIsPlaying = setIsPlaying;
    isActiveHook.current = true;

    // Set up event listeners
    audio.addEventListener('ended', () => {
      setCurrentTrackId(null);
      setIsPlaying(false);
      globalAudio = null;
    });

    audio.addEventListener('error', () => {
      setCurrentTrackId(null);
      setIsPlaying(false);
      globalAudio = null;
    });

    audio.addEventListener('play', () => {
      setIsPlaying(true);
    });

    audio.addEventListener('pause', () => {
      setIsPlaying(false);
    });

    // Start playback
    setCurrentTrackId(trackId);
    audio.play().catch(() => {
      setCurrentTrackId(null);
      setIsPlaying(false);
      globalAudio = null;
    });
  }, []);

  const pause = useCallback(() => {
    if (globalAudio && isActiveHook.current) {
      globalAudio.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio = null;
    }
    if (isActiveHook.current) {
      setCurrentTrackId(null);
      setIsPlaying(false);
    }
  }, []);

  const toggle = useCallback((trackId: string, previewUrl: string) => {
    if (currentTrackId === trackId && isPlaying) {
      pause();
    } else if (currentTrackId === trackId && !isPlaying) {
      globalAudio?.play();
    } else {
      play(trackId, previewUrl);
    }
  }, [currentTrackId, isPlaying, pause, play]);

  return {
    currentTrackId,
    isPlaying,
    play,
    pause,
    toggle,
    stop,
  };
}
