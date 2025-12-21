// Spotify API utilities
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string; height: number; width: number }[];
  country: string;
  product: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  popularity: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  tracks: { total: number };
  owner: { display_name: string };
}

export interface AudioFeatures {
  tempo: number;
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  speechiness: number;
  instrumentalness: number;
  liveness: number;
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

const spotifyFetch = async <T>(endpoint: string, accessToken: string): Promise<T> => {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Spotify API error: ${response.status}`);
  }

  return response.json();
};

export const getCurrentUser = async (accessToken: string): Promise<SpotifyUser> => {
  return spotifyFetch<SpotifyUser>('/me', accessToken);
};

export const getTopTracks = async (
  accessToken: string,
  timeRange: TimeRange = 'medium_term',
  limit: number = 50
): Promise<{ items: SpotifyTrack[] }> => {
  return spotifyFetch(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`, accessToken);
};

export const getUserPlaylists = async (
  accessToken: string,
  limit: number = 50
): Promise<{ items: SpotifyPlaylist[] }> => {
  return spotifyFetch(`/me/playlists?limit=${limit}`, accessToken);
};

export const getPlaylistTracks = async (
  accessToken: string,
  playlistId: string,
  limit: number = 100
): Promise<{ items: { track: SpotifyTrack }[] }> => {
  return spotifyFetch(`/playlists/${playlistId}/tracks?limit=${limit}`, accessToken);
};

export const getAudioFeatures = async (
  accessToken: string,
  trackIds: string[]
): Promise<{ audio_features: (AudioFeatures & { id: string })[] }> => {
  const ids = trackIds.join(',');
  return spotifyFetch(`/audio-features?ids=${ids}`, accessToken);
};

export const getRecommendations = async (
  accessToken: string,
  seedTrackIds: string[],
  targetFeatures?: Partial<AudioFeatures>,
  limit: number = 20
): Promise<{ tracks: SpotifyTrack[] }> => {
  const params = new URLSearchParams({
    seed_tracks: seedTrackIds.slice(0, 5).join(','),
    limit: limit.toString(),
  });

  if (targetFeatures) {
    Object.entries(targetFeatures).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(`target_${key}`, value.toString());
      }
    });
  }

  return spotifyFetch(`/recommendations?${params.toString()}`, accessToken);
};

// Fetch audio features from ReccoBeats API (free alternative)
export const getAudioFeaturesFromReccoBeats = async (
  trackIds: string[]
): Promise<Map<string, AudioFeatures>> => {
  const BATCH_SIZE = 40;
  const featuresBySpotifyId = new Map<string, AudioFeatures>();

  for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
    const batch = trackIds.slice(i, i + BATCH_SIZE);
    const batchIds = batch.join(',');

    try {
      const response = await fetch(
        `https://api.reccobeats.com/v1/audio-features?ids=${batchIds}`
      );

      if (response.ok) {
        const data = await response.json();
        const features = Array.isArray(data) ? data : (data?.content ?? []);

        for (const f of features) {
          const href: string | undefined = f?.href;
          const spotifyId = typeof href === 'string'
            ? href.split('/track/')[1]?.split('?')[0]
            : undefined;
          
          if (spotifyId) {
            featuresBySpotifyId.set(spotifyId, {
              tempo: f.tempo,
              danceability: f.danceability,
              energy: f.energy,
              valence: f.valence,
              acousticness: f.acousticness,
              speechiness: f.speechiness,
              instrumentalness: f.instrumentalness,
              liveness: f.liveness,
            });
          }
        }
      }
    } catch (error) {
      console.warn('ReccoBeats batch error:', error);
    }
  }

  return featuresBySpotifyId;
};

// Fetch Nigeria Top 100 playlist (public, no auth needed)
export const getNigeriaTop100 = async (): Promise<{
  tracks: (SpotifyTrack & AudioFeatures)[];
  features: Map<string, AudioFeatures>;
}> => {
  const PLAYLIST_ID = '46iQn1DHoYNlHwBIOnfAxi';
  const CLIENT_ID = 'a0c70af1576b40bbb8d899ebdf9b8e08';
  const CLIENT_SECRET = 'bf06180c93c149c8ab6eabd2ce8a5924';

  // Get public access token
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to authenticate with Spotify');
  }

  const { access_token } = await tokenResponse.json();

  // Fetch playlist tracks
  const playlistData = await spotifyFetch<{ items: { track: SpotifyTrack }[] }>(
    `/playlists/${PLAYLIST_ID}/tracks?limit=100`,
    access_token
  );

  const tracks = playlistData.items
    .filter(item => item.track)
    .map(item => item.track);

  // Fetch audio features from ReccoBeats
  const trackIds = tracks.map(t => t.id);
  const features = await getAudioFeaturesFromReccoBeats(trackIds);

  // Merge features into tracks
  const enrichedTracks = tracks.map(track => ({
    ...track,
    ...(features.get(track.id) || {}),
  })) as (SpotifyTrack & AudioFeatures)[];

  return { tracks: enrichedTracks, features };
};
