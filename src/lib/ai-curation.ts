/**
 * AI Curation Service - Generate crates with AI
 * Now with smart hybrid search: library → liked songs → recommendations → catalog
 */

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-curation`;

export interface GeneratedTrack {
  track_id: string;
  track_name: string;
  artist_name: string;
  artist_genres?: string[];
  album_name?: string;
  album_art_url?: string;
  bpm?: number;
  energy?: number;
  danceability?: number;
  valence?: number;
  popularity?: number;
  duration_ms?: number;
  source?: 'library' | 'liked' | 'recommendation' | 'catalog';
}

export interface GeneratedSection {
  name: string;
  emoji: string;
  description: string;
  vibeKeywords?: string[];
  tracks: GeneratedTrack[];
}

export interface GeneratedCrate {
  name: string;
  emoji: string;
  description: string;
  sections: GeneratedSection[];
  totalTracks: number;
  estimatedDuration: string;
  quality: {
    flow: number;
    balance: number;
    underground: number;
    length: number;
    total: number;
  };
  vibes?: string[];
  scenes?: string[];
}

export interface SavedCrate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  user_id: string;
  created_at: string;
}

/**
 * Generate a crate using AI based on natural language prompt
 */
export async function generateCrateWithAI(
  prompt: string,
  spotifyToken: string
): Promise<GeneratedCrate> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'generate_crate',
      data: { prompt },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate crate');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Save a generated crate to the database
 */
export async function saveGeneratedCrate(
  crate: GeneratedCrate,
  spotifyToken: string
): Promise<SavedCrate> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'save_crate',
      data: { crate },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save crate');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Backfill missing genre data for existing tracks
 */
export async function backfillGenres(
  spotifyToken: string
): Promise<{ processed: number; failed: number }> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'backfill_genres',
      data: {},
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to backfill genres');
  }

  const result = await response.json();
  return result.data;
}
