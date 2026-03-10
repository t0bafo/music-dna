import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { ARTIST_DATABASE, SET_BLUEPRINTS, SlotType, Segment } from "./artist-database.ts"

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

interface SegmentResult {
  segment: Segment
  tracks: TrackWithFeatures[]
}

// ─── Get Spotify token via client credentials ───
async function getSpotifyToken(): Promise<string> {
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

  if (!res.ok) throw new Error('Failed to get Spotify token')
  const data = await res.json()
  if (!data.access_token) throw new Error('No access token returned')
  return data.access_token
}

// ─── Search Spotify by artist names ───
async function searchByArtists(
  artists: string[],
  token: string,
  limit: number = 10
): Promise<SpotifyTrack[]> {
  const allTracks: SpotifyTrack[] = []
  const seen = new Set<string>()

  for (const artist of artists.slice(0, 20)) {
    try {
      const query = encodeURIComponent(`artist:${artist}`)
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=20&market=US`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) continue

      const data = await res.json()
      for (const track of data.tracks?.items || []) {
        if (!seen.has(track.id)) {
          seen.add(track.id)
          allTracks.push(track)
        }
      }
    } catch { /* skip */ }
  }

  return allTracks
}

// ─── Enrich with audio features ───
async function enrichWithAudioFeatures(
  tracks: SpotifyTrack[],
  supabase: ReturnType<typeof createClient>
): Promise<TrackWithFeatures[]> {
  const trackIds = tracks.map(t => t.id)

  // Check cache
  const { data: cached } = await supabase
    .from('track_cache')
    .select('track_id, bpm, energy, danceability, valence')
    .in('track_id', trackIds)

  const cachedMap = new Map<string, { bpm: number | null; energy: number | null; danceability: number | null; valence: number | null }>()
  for (const c of cached || []) cachedMap.set(c.track_id, c)

  // Fetch uncached from ReccoBeats
  const uncachedIds = trackIds.filter(id => !cachedMap.has(id))
  if (uncachedIds.length > 0) {
    const BATCH = 40
    for (let i = 0; i < uncachedIds.length; i += BATCH) {
      const batch = uncachedIds.slice(i, i + BATCH)
      try {
        const res = await fetch(`https://api.reccobeats.com/v1/audio-features?ids=${batch.join(',')}`)
        if (res.ok) {
          const data = await res.json()
          const features = Array.isArray(data) ? data : (data?.content ?? [])
          for (const f of features) {
            const spotifyId = typeof f?.href === 'string' ? f.href.split('/track/')[1]?.split('?')[0] : undefined
            if (spotifyId && batch.includes(spotifyId)) {
              const feat = { bpm: f.tempo ?? null, energy: f.energy ?? null, danceability: f.danceability ?? null, valence: f.valence ?? null }
              cachedMap.set(spotifyId, feat)
              const track = tracks.find(t => t.id === spotifyId)
              if (track) {
                supabase.from('track_cache').upsert({
                  track_id: spotifyId, name: track.name,
                  artist_name: track.artists[0]?.name || '',
                  album_name: track.album?.name || '',
                  album_art_url: track.album?.images?.[0]?.url || '',
                  bpm: feat.bpm, energy: feat.energy, danceability: feat.danceability, valence: feat.valence,
                }, { onConflict: 'track_id' }).then(() => {})
              }
            }
          }
        }
      } catch { /* skip */ }
    }
  }

  return tracks.map(track => ({
    ...track,
    bpm: cachedMap.get(track.id)?.bpm ?? null,
    energy: cachedMap.get(track.id)?.energy ?? null,
    danceability: cachedMap.get(track.id)?.danceability ?? null,
    valence: cachedMap.get(track.id)?.valence ?? null,
  }))
}

// ─── Filter tracks by segment criteria (with tolerance fallback) ───
function filterForSegment(tracks: TrackWithFeatures[], seg: Segment): TrackWithFeatures[] {
  // Strict filter
  let filtered = tracks.filter(t => {
    if (t.energy === null && t.bpm === null) return false
    if (t.bpm !== null && (t.bpm < seg.bpm.min - 2 || t.bpm > seg.bpm.max + 2)) return false
    if (t.energy !== null && (t.energy < seg.energy.min - 0.05 || t.energy > seg.energy.max + 0.05)) return false
    return true
  })

  // Relaxed if too few
  if (filtered.length < 3) {
    filtered = tracks.filter(t => {
      if (t.energy === null && t.bpm === null) return false
      if (t.bpm !== null && (t.bpm < seg.bpm.min - 8 || t.bpm > seg.bpm.max + 8)) return false
      if (t.energy !== null && (t.energy < seg.energy.min - 0.15 || t.energy > seg.energy.max + 0.15)) return false
      return true
    })
  }

  return filtered
}

// ─── Pick N tracks sorted by energy ───
function pickTracks(tracks: TrackWithFeatures[], count: number, ascending: boolean): TrackWithFeatures[] {
  const sorted = [...tracks].sort((a, b) => ascending
    ? (a.energy ?? 0.5) - (b.energy ?? 0.5)
    : (b.energy ?? 0.5) - (a.energy ?? 0.5)
  )
  if (sorted.length <= count) return sorted
  const step = sorted.length / count
  return Array.from({ length: count }, (_, i) => sorted[Math.floor(i * step)])
}

// ─── Parse track count from segment range like "1-3" ───
function segmentTrackCount(seg: Segment): number {
  const parts = seg.tracks.split('-').map(Number)
  const base = parts.length === 2 ? parts[1] - parts[0] + 1 : 3
  // Scale up by ~2.5x with minimum 5 per segment to target 25-30 total
  return Math.max(5, Math.round(base * 2.5))
}

// ─── Slot name mapping ───
function slotName(slot: SlotType): string {
  const bp = SET_BLUEPRINTS[slot]
  return `SNITC: ${bp.dj} — ${bp.role} (${bp.time})`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { slot } = await req.json() as { slot: SlotType }
    const blueprint = SET_BLUEPRINTS[slot]

    if (!blueprint) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid slot: ${slot}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[SNITC] Generating for ${blueprint.dj} — ${slot}`)
    const warnings: string[] = []

    const spotifyToken = await getSpotifyToken()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Collect ALL unique artists from all segments
    const allSegArtists = [...new Set(blueprint.segments.flatMap(s => s.artists))]
    console.log(`[SNITC] Searching ${allSegArtists.length} segment artists`)

    // Search Spotify for all segment artists
    const rawTracks = await searchByArtists(allSegArtists, spotifyToken, 20)
    console.log(`[SNITC] Found ${rawTracks.length} raw tracks`)

    if (rawTracks.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No tracks found from Spotify search' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enrich all tracks at once
    const enriched = await enrichWithAudioFeatures(rawTracks, supabase)
    const withFeatures = enriched.filter(t => t.energy !== null || t.bpm !== null)
    if (enriched.length - withFeatures.length > 0) {
      warnings.push(`${enriched.length - withFeatures.length} tracks excluded (no audio features)`)
    }

    // Generate per-segment
    const isAscending = blueprint.energy_arc.start <= blueprint.energy_arc.end
    const segmentResults: SegmentResult[] = []
    const usedIds = new Set<string>()

    for (const seg of blueprint.segments) {
      // Prefer segment-specific artists
      const segArtistSet = new Set(seg.artists.map(a => a.toLowerCase()))
      const segTracks = withFeatures.filter(t =>
        !usedIds.has(t.id) &&
        t.artists.some(a => segArtistSet.has(a.name.toLowerCase()))
      )

      // Also include any matching by criteria if not enough segment-specific tracks
      const allAvailable = withFeatures.filter(t => !usedIds.has(t.id))
      const pool = segTracks.length >= 3 ? segTracks : allAvailable

      const filtered = filterForSegment(pool, seg)
      const count = segmentTrackCount(seg)
      const picked = pickTracks(filtered, count, isAscending)

      for (const t of picked) usedIds.add(t.id)

      segmentResults.push({ segment: seg, tracks: picked })
      console.log(`[SNITC] Segment "${seg.tracks}": ${picked.length}/${count} tracks (${seg.sound.slice(0, 40)}...)`)
    }

    // Flatten all tracks in order
    const arranged = segmentResults.flatMap(sr => sr.tracks)
    console.log(`[SNITC] Final playlist: ${arranged.length} tracks for ${blueprint.dj}`)

    // Build response
    const totalDurationMs = arranged.reduce((sum, t) => sum + t.duration_ms, 0)
    const energyValues = arranged.map(t => t.energy ?? 0).filter(e => e > 0)
    const bpmValues = arranged.map(t => t.bpm ?? 0).filter(b => b > 0)

    const playlist = {
      name: slotName(slot),
      slot,
      dj: blueprint.dj,
      role: blueprint.role,
      genre: blueprint.genre,
      time: blueprint.time,
      energy_arc: blueprint.energy_arc,
      segments: segmentResults.map(sr => ({
        label: sr.segment.tracks,
        sound: sr.segment.sound,
        energy: sr.segment.energy,
        bpm: sr.segment.bpm,
        trackCount: sr.tracks.length,
        transition_to: sr.segment.transition_to || null,
        handoff_notes: sr.segment.handoff_notes || null,
      })),
      rules: blueprint.rules,
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
          genre: blueprint.genre,
          time: blueprint.time,
          bpmRange: blueprint.bpm_range,
          energyRange: { min: blueprint.energy_arc.start, max: blueprint.energy_arc.end },
          characteristics: blueprint.segments.map(s => s.sound).join(' → '),
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
