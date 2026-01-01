import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { isNativePlatform, isIOS, isAndroid } from '@/lib/platform';

/**
 * Spotify deep linking utilities for native apps
 */

type SpotifyContentType = 'track' | 'album' | 'artist' | 'playlist' | 'user';

interface SpotifyUriParts {
  type: SpotifyContentType;
  id: string;
}

/**
 * Parse a Spotify web URL to extract type and ID
 */
export function parseSpotifyUrl(url: string): SpotifyUriParts | null {
  const patterns: Record<SpotifyContentType, RegExp> = {
    track: /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    album: /spotify\.com\/album\/([a-zA-Z0-9]+)/,
    artist: /spotify\.com\/artist\/([a-zA-Z0-9]+)/,
    playlist: /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    user: /spotify\.com\/user\/([a-zA-Z0-9]+)/
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    const match = url.match(pattern);
    if (match) {
      return { type: type as SpotifyContentType, id: match[1] };
    }
  }
  return null;
}

/**
 * Build a Spotify URI from type and ID
 */
export function buildSpotifyUri(type: SpotifyContentType, id: string): string {
  return `spotify:${type}:${id}`;
}

/**
 * Build a Spotify web URL from type and ID
 */
export function buildSpotifyWebUrl(type: SpotifyContentType, id: string): string {
  return `https://open.spotify.com/${type}/${id}`;
}

/**
 * Open content in Spotify app or fallback to browser
 * @param spotifyUri - Spotify URI (e.g., spotify:track:4iV5W9uYEdYUVa79Axb7Rh)
 * @param webUrl - Fallback web URL
 */
export async function openInSpotify(spotifyUri: string, webUrl: string): Promise<void> {
  // Web platform - just open in new tab
  if (!isNativePlatform()) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    // Try to open Spotify app directly
    const canOpen = await App.canOpenUrl({ url: spotifyUri });
    
    if (canOpen.value) {
      await App.openUrl({ url: spotifyUri });
    } else {
      // Spotify app not installed - open in browser
      await Browser.open({ 
        url: webUrl,
        presentationStyle: 'popover'
      });
    }
  } catch (error) {
    console.warn('Failed to open Spotify:', error);
    // Final fallback
    await Browser.open({ url: webUrl });
  }
}

/**
 * Open a track in Spotify
 */
export async function openTrackInSpotify(trackId: string): Promise<void> {
  const uri = buildSpotifyUri('track', trackId);
  const webUrl = buildSpotifyWebUrl('track', trackId);
  await openInSpotify(uri, webUrl);
}

/**
 * Open an album in Spotify
 */
export async function openAlbumInSpotify(albumId: string): Promise<void> {
  const uri = buildSpotifyUri('album', albumId);
  const webUrl = buildSpotifyWebUrl('album', albumId);
  await openInSpotify(uri, webUrl);
}

/**
 * Open an artist in Spotify
 */
export async function openArtistInSpotify(artistId: string): Promise<void> {
  const uri = buildSpotifyUri('artist', artistId);
  const webUrl = buildSpotifyWebUrl('artist', artistId);
  await openInSpotify(uri, webUrl);
}

/**
 * Open a playlist in Spotify
 */
export async function openPlaylistInSpotify(playlistId: string): Promise<void> {
  const uri = buildSpotifyUri('playlist', playlistId);
  const webUrl = buildSpotifyWebUrl('playlist', playlistId);
  await openInSpotify(uri, webUrl);
}

/**
 * Get the Spotify app store URL for the current platform
 */
export function getSpotifyAppStoreUrl(): string {
  if (isIOS()) {
    return 'https://apps.apple.com/app/spotify-music-and-podcasts/id324684580';
  }
  if (isAndroid()) {
    return 'https://play.google.com/store/apps/details?id=com.spotify.music';
  }
  return 'https://www.spotify.com/download/';
}
