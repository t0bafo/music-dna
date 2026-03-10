import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { ARTIST_DATABASE, DJ_SET_CRITERIA, SlotType } from "./artist-database.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface SpotifyTrack {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: { name: string; images: { url: string }[] }
  duration_ms: number
  popularity: number
  external_urls: { spotify: string }
}

interface TrackWithFeatures extends SpotifyTrack {
  bpm: number | null
  energy: number | null
  danceability: number | null
  valence: number | null
}

// ─── Get Spotify token via existing edge function ───
async function getSpotifyToken(): Promise<string> {
  // Use client credentials directly since we're server-side
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

  if (!clientId || !clientSecret) throw new Error('Missing Spotify credentials')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Spotify token error:', err)
    throw new Error('Failed to get Spotify token')
  }
  const data = await res.json()
  if (!data.access_token) throw new Error('No access token returned')
  return data.access_token
}

// ─── Get artists for a given slot ───
function getArtistsForSlot(slot: SlotType): string[] {
  const criteria = DJ_SET_CRITERIA[slot]
  const db = ARTIST_DATABASE

  switch (slot) {
    case 'foundation_setter':
    case 'energy_builder':
      return [
        ...db.afro_house.tier_1_established,
        ...db.afro_house.tier_2_rising,
      ]
    case 'peak_energy':
      return [
        ...db.amapiano.tier_1_established,
        ...db.amapiano.tier_2_rising,
      ]
    case 'late_peak_curator':
      return [
        ...db.amapiano.tier_1_established,
        ...db.amapiano.tier_2_rising.slice(0, 15),
        ...db.afrobeats.tier_1_global_superstars.slice(0, 10),
        ...db.afrobeats_club_edits_producers,
      ]
    case 'deep_dive':
      return [
        ...db.afrobeats.tier_1_global_superstars,
        ...db.afrobeats.tier_2_established_rising,
        ...db.afrobeats.tier_3_alte_afro_fusion,
      ]
    case 'global_closer':
      return [
        ...db.global_sounds.afro_tech,
        ...db.afro_house.tier_1_established,
        ...db.afro_house.tier_2_rising.slice(0, 10),
        ...db.global_sounds.uk_afrobeats_afro_swing.slice(0, 5),
      ]
    default:
      return []
  }
}

// ─── Search Spotify by artist names (batched) ───
async function searchSpotifyByArtists(
  artists: string[],
  token: string,
  limit: number = 100
): Promise<SpotifyTrack[]> {
  const allTracks: SpotifyTrack[] = []
  const seen = new Set<string>()

  // Search individual artists, cap at 20 to stay within timeout
  const artistsToSearch = artists.slice(0, 20)

  for (const artist of artistsToSearch) {
    try {
      const query = encodeURIComponent(`artist:${artist}`)
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10&market=US`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) {
        console.warn(`Spotify search failed for "${artist}":`, res.status, await res.text())
        continue
      }

      const data = await res.json()
      for (const track of data.tracks?.items || []) {
        if (!seen.has(track.id)) {
          seen.add(track.id)
          allTracks.push(track)
        }
      }
    } catch (err) {
      console.warn(`Search error for "${artist}":`, err)
    }

    if (allTracks.length >= limit) break
  }

  console.log(`[SNITC] Searched ${artistsToSearch.length} artists, found ${allTracks.length} unique tracks`)
  return allTracks.slice(0, limit)
}

// ─── Enrich tracks with audio features (cache + ReccoBeats) ───
async function enrichWithAudioFeatures(
  tracks: SpotifyTrack[],
  supabase: ReturnType<typeof createClient>
): Promise<TrackWithFeatures[]> {
  const trackIds = tracks.map(t => t.id)
  const warnings: string[] = []

  // 1. Check track_cache first
  const { data: cached } = await supabase
    .from('track_cache')
    .select('track_id, bpm, energy, danceability, valence')
    .in('track_id', trackIds)

  const cachedMap = new Map<string, { bpm: number | null; energy: number | null; danceability: number | null; valence: number | null }>()
  for (const c of cached || []) {
    cachedMap.set(c.track_id, c)
  }

  // 2. Find uncached tracks
  const uncachedIds = trackIds.filter(id => !cachedMap.has(id))

  // 3. Fetch from ReccoBeats in batches of 40
  if (uncachedIds.length > 0) {
    const BATCH = 40
    for (let i = 0; i < uncachedIds.length; i += BATCH) {
      const batch = uncachedIds.slice(i, i + BATCH)
      try {
        const res = await fetch(
          `https://api.reccobeats.com/v1/audio-features?ids=${batch.join(',')}`
        )
        if (res.ok) {
          const data = await res.json()
          const features = Array.isArray(data) ? data : (data?.content ?? [])

          for (const f of features) {
            const href: string | undefined = f?.href
            const spotifyId = typeof href === 'string'
              ? href.split('/track/')[1]?.split('?')[0]
              : undefined

            if (spotifyId && batch.includes(spotifyId)) {
              const feat = {
                bpm: f.tempo ?? null,
                energy: f.energy ?? null,
                danceability: f.danceability ?? null,
                valence: f.valence ?? null,
              }
              cachedMap.set(spotifyId, feat)

              // Cache for future use
              const track = tracks.find(t => t.id === spotifyId)
              if (track) {
                await supabase.from('track_cache').upsert({
                  track_id: spotifyId,
                  name: track.name,
                  artist_name: track.artists[0]?.name || '',
                  album_name: track.album?.name || '',
                  album_art_url: track.album?.images?.[0]?.url || '',
                  bpm: feat.bpm,
                  energy: feat.energy,
                  danceability: feat.danceability,
                  valence: feat.valence,
                }, { onConflict: 'track_id' }).then(() => {})
              }
            }
          }
        }
      } catch (err) {
        console.warn('ReccoBeats batch error:', err)
      }
    }
  }

  // 4. Merge features into tracks
  return tracks.map(track => ({
    ...track,
    bpm: cachedMap.get(track.id)?.bpm ?? null,
    energy: cachedMap.get(track.id)?.energy ?? null,
    danceability: cachedMap.get(track.id)?.danceability ?? null,
    valence: cachedMap.get(track.id)?.valence ?? null,
  }))
}

// ─── Filter by slot criteria ───
function filterByCriteria(
  tracks: TrackWithFeatures[],
  criteria: typeof DJ_SET_CRITERIA[SlotType]
): TrackWithFeatures[] {
  return tracks.filter(t => {
    // Must have at least energy or bpm data
    if (t.energy === null && t.bpm === null) return false

    // BPM filter (with tolerance)
    if (t.bpm !== null) {
      if (t.bpm < criteria.tempo.min - 2 || t.bpm > criteria.tempo.max + 2) return false
    }

    // Energy filter (with tolerance)
    if (t.energy !== null) {
      if (t.energy < criteria.energy.min - 0.05 || t.energy > criteria.energy.max + 0.05) return false
    }

    return true
  })
}

// ─── Arrange by energy progression ───
function arrangeByEnergyProgression(
  tracks: TrackWithFeatures[],
  energyArc: { min: number; max: number }
): TrackWithFeatures[] {
  // Sort by energy ascending for a building arc
  const sorted = [...tracks].sort((a, b) => (a.energy ?? 0.5) - (b.energy ?? 0.5))

  // Target ~18 tracks for a 60-min set
  const targetCount = Math.min(sorted.length, 18)
  
  if (sorted.length <= targetCount) return sorted

  // Evenly sample across the energy range
  const step = sorted.length / targetCount
  const selected: TrackWithFeatures[] = []
  for (let i = 0; i < targetCount; i++) {
    selected.push(sorted[Math.floor(i * step)])
  }

  return selected
}

// ─── Slot name mapping ───
const SLOT_NAMES: Record<SlotType, string> = {
  foundation_setter: 'SNITC: Foundation Setter (10-11PM)',
  energy_builder: 'SNITC: Energy Builder (11PM-12AM)',
  peak_energy: 'SNITC: Peak Energy (12-1AM)',
  late_peak_curator: 'SNITC: Late Peak Curator (1-2AM)',
  deep_dive: 'SNITC: Deep Dive (2-3AM)',
  global_closer: 'SNITC: Global Closer (3-4AM)',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { slot } = await req.json() as { slot: SlotType }

    if (!DJ_SET_CRITERIA[slot]) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid slot: ${slot}. Valid: ${Object.keys(DJ_SET_CRITERIA).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const criteria = DJ_SET_CRITERIA[slot]
    const warnings: string[] = []

    console.log(`[SNITC] Generating playlist for slot: ${slot}`)

    // 1. Get Spotify token
    const spotifyToken = await getSpotifyToken()
    console.log(`[SNITC] Got Spotify token`)

    // 2. Get artists for this slot
    const artists = getArtistsForSlot(slot)
    console.log(`[SNITC] ${artists.length} artists for slot ${slot}`)

    // 3. Search Spotify catalog
    const rawTracks = await searchSpotifyByArtists(artists, spotifyToken, 100)
    console.log(`[SNITC] Found ${rawTracks.length} raw tracks from Spotify`)

    if (rawTracks.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No tracks found from Spotify search', warnings }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Enrich with audio features
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const enriched = await enrichWithAudioFeatures(rawTracks, supabase)
    const withFeatures = enriched.filter(t => t.energy !== null || t.bpm !== null)
    const withoutFeatures = enriched.filter(t => t.energy === null && t.bpm === null)

    if (withoutFeatures.length > 0) {
      warnings.push(`${withoutFeatures.length} tracks had no audio features available and were excluded`)
    }

    console.log(`[SNITC] ${withFeatures.length} tracks with features, ${withoutFeatures.length} without`)

    // 5. Filter by criteria
    let filtered = filterByCriteria(withFeatures, criteria)
    console.log(`[SNITC] ${filtered.length} tracks match criteria (BPM ${criteria.tempo.min}-${criteria.tempo.max}, energy ${criteria.energy.min}-${criteria.energy.max})`)

    // If too few results, relax criteria
    if (filtered.length < 10) {
      warnings.push(`Only ${filtered.length} tracks matched strict criteria. Relaxing filters.`)
      // Relax by ±5 BPM and ±0.1 energy
      filtered = withFeatures.filter(t => {
        if (t.bpm !== null && (t.bpm < criteria.tempo.min - 5 || t.bpm > criteria.tempo.max + 5)) return false
        if (t.energy !== null && (t.energy < criteria.energy.min - 0.1 || t.energy > criteria.energy.max + 0.1)) return false
        return true
      })
      console.log(`[SNITC] After relaxing: ${filtered.length} tracks`)
    }

    // 6. Arrange by energy progression
    const arranged = arrangeByEnergyProgression(filtered, criteria.energy)
    console.log(`[SNITC] Final playlist: ${arranged.length} tracks`)

    // 7. Build response
    const totalDurationMs = arranged.reduce((sum, t) => sum + t.duration_ms, 0)
    const energyValues = arranged.map(t => t.energy ?? 0).filter(e => e > 0)
    const bpmValues = arranged.map(t => t.bpm ?? 0).filter(b => b > 0)

    const playlist = {
      name: SLOT_NAMES[slot],
      slot,
      tracks: arranged.map(t => ({
        id: t.id,
        name: t.name,
        artists: t.artists.map(a => a.name),
        duration_ms: t.duration_ms,
        bpm: t.bpm ? Math.round(t.bpm) : null,
        energy: t.energy ? Math.round(t.energy * 100) / 100 : null,
        danceability: t.danceability ? Math.round(t.danceability * 100) / 100 : null,
        valence: t.valence ? Math.round(t.valence * 100) / 100 : null,
        spotify_url: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
        album_art: t.album?.images?.[0]?.url || null,
        album_name: t.album?.name || null,
      })),
      metadata: {
        totalTracks: arranged.length,
        totalDurationMs,
        totalDurationMin: Math.round(totalDurationMs / 60000),
        averageBPM: bpmValues.length > 0 ? Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length) : null,
        energyProgression: energyValues,
        criteria: {
          genre: criteria.genre,
          time: criteria.time,
          bpmRange: criteria.tempo,
          energyRange: criteria.energy,
          characteristics: criteria.characteristics,
        },
      },
      warnings,
    }

    return new Response(
      JSON.stringify({ success: true, playlist }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[SNITC] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
