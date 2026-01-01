import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-spotify-token',
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions'

interface SectionPlan {
  name: string
  emoji: string
  description: string
  trackCount: number
  bpmRange: [number, number]
  energyRange: [number, number]
  vibeKeywords: string[]
}

interface CrateStructure {
  name: string
  emoji: string
  description: string
  sections: SectionPlan[]
  vibes: string[]
  scenes: string[]
  totalTargetTracks: number
}

interface CachedTrack {
  track_id: string
  name?: string
  track_name?: string
  artist?: string
  artist_name?: string
  artist_id?: string
  artist_genres?: string[]
  album?: string
  album_name?: string
  album_art_url?: string
  duration_ms?: number
  popularity?: number
  preview_url?: string
  bpm?: number
  tempo?: number
  energy?: number
  valence?: number
  danceability?: number
  source?: string
}

// ============= AI FUNCTIONS =============

async function callLovableAI(messages: { role: string; content: string }[]): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured')
  }

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[ai-curation] AI gateway error:', response.status, errorText)
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.')
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits to your workspace.')
    }
    throw new Error('AI service temporarily unavailable')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function analyzeCrateStructure(prompt: string): Promise<CrateStructure> {
  const systemPrompt = `You are a professional music curator. Given a user's description of a playlist/crate, create a detailed structure plan.

CRITICAL GENRE EXTRACTION RULES:
1. Extract EXACT genre names for "scenes" field
2. "amapiano" → scenes: ["amapiano"]
3. "afrobeats" → scenes: ["afrobeats"]
4. "underground hip-hop" → scenes: ["hip-hop"], vibes: ["underground"]
5. "R&B and soul" → scenes: ["rnb", "soul"]
6. "deep Amapiano only" → scenes: ["amapiano"], vibes: ["deep", "underground"]

Valid scene keywords (use these EXACT terms):
- afrobeats, amapiano, alte, afro-fusion, afro-house
- rnb, soul, hip-hop, rap, trap
- dancehall, reggae, soca
- electronic, house, techno, deep-house
- pop, indie, rock, alternative
- traditional, highlife, juju
- afropop, afroswing, afrofusion

DO NOT use vague terms like "music" or "vibes" in scenes - only actual genres.

Create a crate with 3-4 sections that flow naturally:
- Opening: Sets the mood, slightly lower energy
- Build: Gradually increases energy/intensity
- Peak: Highest energy point
- Wind Down (optional): Brings energy back down

Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "Catchy crate name (4-6 words max)",
  "emoji": "Single emoji that represents the vibe",
  "description": "Brief description of the vibe (1 sentence)",
  "sections": [
    {
      "name": "Section name (e.g., Opening, Build, Peak)",
      "emoji": "Emoji for this section",
      "description": "What this section accomplishes",
      "trackCount": 5,
      "bpmRange": [90, 110],
      "energyRange": [0.4, 0.6],
      "vibeKeywords": ["smooth", "warm"]
    }
  ],
  "vibes": ["overall", "vibe", "keywords"],
  "scenes": ["EXACT", "GENRE", "NAMES"],
  "totalTargetTracks": 18
}

Guidelines:
- Most crates: 15-25 tracks total
- Workout/party: 3 sections (Warmup/Peak/Cooldown)
- Mood/vibe: 4 sections (Opening/Build/Peak/Wind Down)
- BPM and energy should progress naturally
- Each section: 3-8 tracks depending on total

Examples:
- "Late night drive" → scenes: ["afrobeats", "rnb"], vibes: ["late-night", "smooth"]
- "HIIT workout" → scenes: ["hip-hop", "trap"], vibes: ["energy", "intense"]
- "Deep underground Amapiano only" → scenes: ["amapiano"], vibes: ["underground", "deep"]
- "Afrobeats party mix" → scenes: ["afrobeats", "afropop"], vibes: ["party", "upbeat"]`

  const responseText = await callLovableAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Create a crate structure for: "${prompt}"` }
  ])

  // Parse JSON (strip markdown if present)
  let jsonText = responseText.trim()
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
  }

  try {
    const structure = JSON.parse(jsonText)
    
    if (!structure.name || !structure.sections || structure.sections.length === 0) {
      throw new Error('Invalid structure')
    }

    // Ensure scenes are lowercase for matching
    if (structure.scenes) {
      structure.scenes = structure.scenes.map((s: string) => s.toLowerCase())
    }
    
    return structure
  } catch (error) {
    console.error('[ai-curation] Failed to parse structure:', jsonText)
    throw new Error('Failed to analyze crate structure. Please try a different description.')
  }
}

async function selectBestTracks(
  candidates: CachedTrack[],
  sectionPlan: SectionPlan,
  targetCount: number
): Promise<string[]> {
  if (candidates.length <= targetCount) {
    return candidates.map(t => t.track_id)
  }

  const candidateInfo = candidates.slice(0, 40).map(t => ({
    id: t.track_id,
    name: t.name || t.track_name,
    artist: t.artist || t.artist_name,
    genres: (t.artist_genres || []).slice(0, 3).join(', '),
    bpm: t.tempo || t.bpm,
    energy: Math.round((t.energy || 0.5) * 100),
    popularity: t.popularity,
    source: t.source || 'library',
  }))

  const systemPrompt = `You are selecting tracks for a music crate section.

Section: ${sectionPlan.name}
Goal: ${sectionPlan.description}
Target: ${targetCount} tracks
Target BPM: ${sectionPlan.bpmRange[0]}-${sectionPlan.bpmRange[1]}
Target Energy: ${Math.round(sectionPlan.energyRange[0] * 100)}%-${Math.round(sectionPlan.energyRange[1] * 100)}%
Vibe: ${sectionPlan.vibeKeywords.join(', ')}

Select the ${targetCount} BEST tracks considering:
1. Match target BPM and energy closely
2. PRIORITIZE tracks with matching genres
3. Avoid repetitive artists (prefer variety)
4. Balance underground (low popularity) and popular tracks
5. Prefer "library" or "liked" source over "recommendation" or "catalog"
6. Create smooth flow between tracks

Return ONLY a JSON array of track IDs (no explanation):
["track_id_1", "track_id_2", ...]`

  try {
    const responseText = await callLovableAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Available tracks:\n${JSON.stringify(candidateInfo)}` }
    ])

    let jsonText = responseText.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
    }

    const selectedIds: string[] = JSON.parse(jsonText)
    return selectedIds.slice(0, targetCount)
  } catch (error) {
    console.error('[ai-curation] Track selection fallback:', error)
    // Fallback: just take first N tracks
    return candidates.slice(0, targetCount).map(t => t.track_id)
  }
}

// ============= SPOTIFY API FUNCTIONS =============

async function fetchArtistGenres(artistId: string, spotifyToken: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
    )

    if (!response.ok) return []

    const artist = await response.json()
    return artist.genres || []
  } catch (error) {
    console.error('[ai-curation] Failed to fetch artist genres:', error)
    return []
  }
}

async function cacheTrackWithGenres(
  spotifyTrack: any,
  spotifyToken: string,
  supabaseAdmin: any
): Promise<CachedTrack> {
  const trackId = spotifyTrack.id
  const artistId = spotifyTrack.artists?.[0]?.id

  // Check if already cached with genres
  const { data: existing } = await supabaseAdmin
    .from('track_cache')
    .select('*')
    .eq('track_id', trackId)
    .maybeSingle()

  if (existing && existing.artist_genres?.length > 0) {
    return { ...existing, source: 'cache' }
  }

  // Fetch artist genres
  const artistGenres = artistId ? await fetchArtistGenres(artistId, spotifyToken) : []

  const trackData = {
    track_id: trackId,
    name: spotifyTrack.name,
    artist_name: spotifyTrack.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
    artist_id: artistId || null,
    artist_genres: artistGenres,
    album_name: spotifyTrack.album?.name || '',
    album_art_url: spotifyTrack.album?.images?.[0]?.url || '',
    duration_ms: spotifyTrack.duration_ms || 210000,
    popularity: spotifyTrack.popularity || 50,
    preview_url: spotifyTrack.preview_url || null,
  }

  // Upsert to cache
  await supabaseAdmin
    .from('track_cache')
    .upsert(trackData, { onConflict: 'track_id' })

  return { ...trackData, source: 'spotify' }
}

// ============= SEARCH FUNCTIONS (PRIORITY ORDER) =============

// Map user-friendly scene names to Spotify genre seeds
function mapScenesToSpotifyGenres(scenes: string[]): string[] {
  const genreMap: Record<string, string> = {
    'afrobeats': 'afrobeat',
    'afropop': 'afrobeat',
    'afro-fusion': 'afrobeat',
    'afrofusion': 'afrobeat',
    'amapiano': 'afrobeat', // Spotify doesn't have amapiano, use closest
    'alte': 'afrobeat',
    'afro-house': 'house',
    'rnb': 'r-n-b',
    'r&b': 'r-n-b',
    'soul': 'soul',
    'hip-hop': 'hip-hop',
    'rap': 'hip-hop',
    'trap': 'hip-hop',
    'dancehall': 'dancehall',
    'reggae': 'reggae',
    'soca': 'dancehall',
    'electronic': 'electronic',
    'house': 'house',
    'deep-house': 'deep-house',
    'techno': 'techno',
    'pop': 'pop',
    'indie': 'indie',
    'rock': 'rock',
    'alternative': 'alternative',
  }

  return scenes
    .map(scene => genreMap[scene.toLowerCase()] || scene.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
}

// Check if track matches any of the target genres
function trackMatchesGenres(trackGenres: string[], targetScenes: string[]): boolean {
  if (!targetScenes || targetScenes.length === 0) return true
  if (!trackGenres || trackGenres.length === 0) return false

  const normalizedTargets = targetScenes.map(s => s.toLowerCase())
  
  return trackGenres.some(genre => {
    const g = genre.toLowerCase()
    return normalizedTargets.some(target => 
      g.includes(target) || target.includes(g)
    )
  })
}

// Priority 1: Search user's music library
async function searchUserLibrary(
  userId: string,
  sectionPlan: SectionPlan,
  scenes: string[],
  excludeIds: string[],
  supabaseAdmin: any
): Promise<CachedTrack[]> {
  console.log(`[ai-curation] Searching user library for genres: ${scenes.join(', ')}`)

  let query = supabaseAdmin
    .from('music_library')
    .select('*')
    .eq('user_id', userId)

  // Exclude already used tracks
  if (excludeIds.length > 0) {
    query = query.not('track_id', 'in', `(${excludeIds.join(',')})`)
  }

  // Apply BPM filter with tolerance
  if (sectionPlan.bpmRange) {
    const bpmMin = Math.max(60, sectionPlan.bpmRange[0] - 20)
    const bpmMax = sectionPlan.bpmRange[1] + 20
    query = query.gte('tempo', bpmMin).lte('tempo', bpmMax)
  }

  // Apply energy filter with tolerance
  if (sectionPlan.energyRange) {
    const energyMin = Math.max(0, sectionPlan.energyRange[0] - 0.2)
    const energyMax = Math.min(1, sectionPlan.energyRange[1] + 0.2)
    query = query.gte('energy', energyMin).lte('energy', energyMax)
  }

  query = query.limit(100)

  const { data, error } = await query

  if (error || !data) {
    console.error('[ai-curation] Library query error:', error)
    return []
  }

  // Filter by genre if scenes specified
  let filtered = data
  if (scenes.length > 0) {
    filtered = data.filter((t: any) => 
      trackMatchesGenres(t.artist_genres || [], scenes)
    )
    console.log(`[ai-curation] Genre-filtered library: ${filtered.length}/${data.length} tracks`)
  }

  return filtered.map((t: any) => ({
    ...t,
    track_name: t.name,
    bpm: t.tempo,
    source: 'library'
  }))
}

// Priority 2: Search user's liked songs from Spotify
async function searchLikedSongs(
  sectionPlan: SectionPlan,
  scenes: string[],
  excludeIds: string[],
  spotifyToken: string,
  supabaseAdmin: any
): Promise<CachedTrack[]> {
  console.log('[ai-curation] Searching liked songs...')

  try {
    const response = await fetch(
      'https://api.spotify.com/v1/me/tracks?limit=50',
      { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
    )

    if (!response.ok) {
      console.error('[ai-curation] Liked songs API error:', response.status)
      return []
    }

    const data = await response.json()
    const tracks = data.items?.map((item: any) => item.track).filter(Boolean) || []

    const matchingTracks: CachedTrack[] = []

    for (const track of tracks) {
      if (excludeIds.includes(track.id)) continue

      const cached = await cacheTrackWithGenres(track, spotifyToken, supabaseAdmin)

      // Check genre match
      const genreMatch = scenes.length === 0 || trackMatchesGenres(cached.artist_genres || [], scenes)
      if (!genreMatch) continue

      // Check audio features match (relaxed)
      const bpmMatch = !sectionPlan.bpmRange || !cached.bpm || (
        cached.bpm >= sectionPlan.bpmRange[0] - 25 &&
        cached.bpm <= sectionPlan.bpmRange[1] + 25
      )

      const energyMatch = !sectionPlan.energyRange || cached.energy === undefined || cached.energy === null || (
        (cached.energy as number) >= sectionPlan.energyRange[0] - 0.25 &&
        (cached.energy as number) <= sectionPlan.energyRange[1] + 0.25
      )

      if (bpmMatch && energyMatch) {
        matchingTracks.push({ ...cached, source: 'liked' })
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 30))
    }

    console.log(`[ai-curation] Found ${matchingTracks.length} matching liked songs`)
    return matchingTracks

  } catch (error) {
    console.error('[ai-curation] Liked songs error:', error)
    return []
  }
}

// Priority 3: Get Spotify recommendations based on user's top tracks
async function getSpotifyRecommendations(
  sectionPlan: SectionPlan,
  scenes: string[],
  spotifyToken: string,
  supabaseAdmin: any
): Promise<CachedTrack[]> {
  console.log('[ai-curation] Getting Spotify recommendations...')

  try {
    // Get user's top tracks for seed
    const topResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term',
      { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
    )

    if (!topResponse.ok) {
      console.error('[ai-curation] Top tracks API error:', topResponse.status)
      return []
    }

    const topData = await topResponse.json()
    const seedTracks = topData.items?.slice(0, 2).map((t: any) => t.id) || []

    // Build recommendation parameters
    const params = new URLSearchParams({ limit: '30' })

    if (seedTracks.length > 0) {
      params.set('seed_tracks', seedTracks.join(','))
    }

    // Add genre seeds
    if (scenes.length > 0) {
      const genreSeeds = mapScenesToSpotifyGenres(scenes)
      if (genreSeeds.length > 0) {
        params.set('seed_genres', genreSeeds.slice(0, 3).join(','))
      }
    }

    // Add audio feature targets
    if (sectionPlan.bpmRange) {
      const avgBpm = (sectionPlan.bpmRange[0] + sectionPlan.bpmRange[1]) / 2
      params.set('target_tempo', avgBpm.toString())
      params.set('min_tempo', (sectionPlan.bpmRange[0] - 10).toString())
      params.set('max_tempo', (sectionPlan.bpmRange[1] + 10).toString())
    }

    if (sectionPlan.energyRange) {
      const avgEnergy = (sectionPlan.energyRange[0] + sectionPlan.energyRange[1]) / 2
      params.set('target_energy', avgEnergy.toString())
    }

    const recResponse = await fetch(
      `https://api.spotify.com/v1/recommendations?${params}`,
      { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
    )

    if (!recResponse.ok) {
      console.error('[ai-curation] Recommendations API error:', recResponse.status)
      return []
    }

    const recData = await recResponse.json()
    const tracks = recData.tracks || []

    // Cache all tracks
    const cachedTracks: CachedTrack[] = []
    for (const track of tracks) {
      const cached = await cacheTrackWithGenres(track, spotifyToken, supabaseAdmin)
      cachedTracks.push({ ...cached, source: 'recommendation' })
      await new Promise(r => setTimeout(r, 30))
    }

    console.log(`[ai-curation] Got ${cachedTracks.length} recommendations`)
    return cachedTracks

  } catch (error) {
    console.error('[ai-curation] Recommendations error:', error)
    return []
  }
}

// Priority 4: Search Spotify catalog
async function searchSpotifyCatalog(
  sectionPlan: SectionPlan,
  scenes: string[],
  spotifyToken: string,
  supabaseAdmin: any
): Promise<CachedTrack[]> {
  console.log('[ai-curation] Searching Spotify catalog...')

  try {
    // Build search query
    let searchQuery = ''

    if (scenes.length > 0) {
      // Use genre as search term
      searchQuery = `genre:${scenes[0]}`
      if (scenes.length > 1) {
        searchQuery += ` OR genre:${scenes[1]}`
      }
    }

    // Add vibe keywords
    if (sectionPlan.vibeKeywords?.length > 0) {
      searchQuery += ' ' + sectionPlan.vibeKeywords.slice(0, 2).join(' ')
    }

    searchQuery = searchQuery.trim()
    if (!searchQuery) {
      console.warn('[ai-curation] No search query for catalog')
      return []
    }

    console.log(`[ai-curation] Catalog search query: "${searchQuery}"`)

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=30`,
      { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
    )

    if (!response.ok) {
      console.error('[ai-curation] Catalog search API error:', response.status)
      return []
    }

    const data = await response.json()
    const tracks = data.tracks?.items || []

    // Cache all tracks
    const cachedTracks: CachedTrack[] = []
    for (const track of tracks) {
      const cached = await cacheTrackWithGenres(track, spotifyToken, supabaseAdmin)
      cachedTracks.push({ ...cached, source: 'catalog' })
      await new Promise(r => setTimeout(r, 30))
    }

    console.log(`[ai-curation] Found ${cachedTracks.length} catalog tracks`)
    return cachedTracks

  } catch (error) {
    console.error('[ai-curation] Catalog search error:', error)
    return []
  }
}

// ============= MAIN SEARCH ORCHESTRATOR =============

async function findTracksForSection(
  userId: string,
  sectionPlan: SectionPlan,
  globalScenes: string[],
  excludeTrackIds: string[],
  spotifyToken: string,
  supabaseAdmin: any
): Promise<CachedTrack[]> {
  const targetCount = sectionPlan.trackCount
  const allCandidates: CachedTrack[] = []

  console.log(`\n[ai-curation] 🔍 Finding ${targetCount} tracks for section: ${sectionPlan.name}`)
  console.log(`[ai-curation] Target genres: ${globalScenes.join(', ') || 'any'}`)
  console.log(`[ai-curation] Target BPM: ${sectionPlan.bpmRange[0]}-${sectionPlan.bpmRange[1]}`)
  console.log(`[ai-curation] Target energy: ${Math.round(sectionPlan.energyRange[0] * 100)}%-${Math.round(sectionPlan.energyRange[1] * 100)}%`)

  // Priority 1: User's library
  const libraryTracks = await searchUserLibrary(
    userId, sectionPlan, globalScenes, excludeTrackIds, supabaseAdmin
  )
  
  const newLibraryTracks = libraryTracks.filter(t => 
    !allCandidates.some(c => c.track_id === t.track_id)
  )
  allCandidates.push(...newLibraryTracks)
  console.log(`[ai-curation] ✓ Library: ${newLibraryTracks.length} tracks (total: ${allCandidates.length})`)

  // Stop if we have enough
  if (allCandidates.length >= targetCount * 3) {
    console.log('[ai-curation] ✓ Enough candidates from library')
  } else {
    // Priority 2: Liked songs
    const likedTracks = await searchLikedSongs(
      sectionPlan, globalScenes, [...excludeTrackIds, ...allCandidates.map(t => t.track_id)],
      spotifyToken, supabaseAdmin
    )
    
    const newLikedTracks = likedTracks.filter(t => 
      !allCandidates.some(c => c.track_id === t.track_id)
    )
    allCandidates.push(...newLikedTracks)
    console.log(`[ai-curation] ✓ Liked songs: ${newLikedTracks.length} tracks (total: ${allCandidates.length})`)
  }

  // Stop if we have enough
  if (allCandidates.length >= targetCount * 3) {
    console.log('[ai-curation] ✓ Enough candidates')
  } else {
    // Priority 3: Spotify recommendations
    const recTracks = await getSpotifyRecommendations(
      sectionPlan, globalScenes, spotifyToken, supabaseAdmin
    )
    
    const newRecTracks = recTracks.filter(t => 
      !allCandidates.some(c => c.track_id === t.track_id) &&
      !excludeTrackIds.includes(t.track_id)
    )
    allCandidates.push(...newRecTracks)
    console.log(`[ai-curation] ✓ Recommendations: ${newRecTracks.length} tracks (total: ${allCandidates.length})`)
  }

  // Stop if we have enough
  if (allCandidates.length >= targetCount * 3) {
    console.log('[ai-curation] ✓ Enough candidates')
  } else {
    // Priority 4: Spotify catalog search
    const catalogTracks = await searchSpotifyCatalog(
      sectionPlan, globalScenes, spotifyToken, supabaseAdmin
    )
    
    const newCatalogTracks = catalogTracks.filter(t => 
      !allCandidates.some(c => c.track_id === t.track_id) &&
      !excludeTrackIds.includes(t.track_id)
    )
    allCandidates.push(...newCatalogTracks)
    console.log(`[ai-curation] ✓ Catalog: ${newCatalogTracks.length} tracks (total: ${allCandidates.length})`)
  }

  // Check if we found any tracks
  if (allCandidates.length === 0) {
    throw new Error(
      `No tracks found for "${sectionPlan.name}". ` +
      `Requested genres: ${globalScenes.join(', ')}. ` +
      `Try a different description or add more music to your library.`
    )
  }

  console.log(`[ai-curation] ✅ Total candidates: ${allCandidates.length}`)

  // If we have fewer candidates than target, return all
  if (allCandidates.length <= targetCount) {
    return allCandidates
  }

  // Use AI to select best tracks
  const selectedIds = await selectBestTracks(allCandidates, sectionPlan, targetCount)
  
  return selectedIds
    .map(id => allCandidates.find(t => t.track_id === id))
    .filter((t): t is CachedTrack => t != null)
}

// ============= QUALITY SCORING =============

function calculateQualityScore(tracks: any[]) {
  let flowScore = 3
  let balanceScore = 3
  let undergroundScore = 2
  let lengthScore = 2

  if (tracks.length < 3) {
    return { flow: flowScore, balance: balanceScore, underground: undergroundScore, length: lengthScore, total: 10 }
  }

  // Flow score (smooth energy transitions)
  const energyValues = tracks.filter(t => t.energy != null).map(t => t.energy)
  
  if (energyValues.length >= 2) {
    let sharpJumps = 0
    for (let i = 1; i < energyValues.length; i++) {
      if (Math.abs(energyValues[i] - energyValues[i - 1]) > 0.3) {
        sharpJumps++
      }
    }
    flowScore = Math.max(0, 3 - (sharpJumps * 0.5))
  }

  // Balance score (variety in energy)
  if (energyValues.length > 0) {
    const avgEnergy = energyValues.reduce((a, b) => a + b, 0) / energyValues.length
    const varietyCount = energyValues.filter(e => Math.abs(e - avgEnergy) > 0.2).length
    const varietyRatio = varietyCount / energyValues.length

    if (varietyRatio < 0.2) balanceScore = 1.5
    else if (varietyRatio < 0.4) balanceScore = 2.5
    else balanceScore = 3
  }

  // Underground score
  const undergroundPercent = (tracks.filter(t => (t.popularity || 100) < 50).length / tracks.length) * 100
  if (undergroundPercent < 20) undergroundScore = 0.5
  else if (undergroundPercent < 40) undergroundScore = 1
  else if (undergroundPercent < 60) undergroundScore = 1.5
  else undergroundScore = 2

  // Length score (15-25 tracks is ideal)
  if (tracks.length < 10) lengthScore = 1
  else if (tracks.length < 15) lengthScore = 1.5
  else if (tracks.length <= 30) lengthScore = 2
  else lengthScore = 1.5

  return {
    flow: flowScore,
    balance: balanceScore,
    underground: undergroundScore,
    length: lengthScore,
    total: flowScore + balanceScore + undergroundScore + lengthScore,
  }
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, data } = body

    // Validate Spotify token
    const spotifyToken = req.headers.get('x-spotify-token')
    if (!spotifyToken) {
      return new Response(
        JSON.stringify({ error: 'Missing Spotify access token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token with Spotify
    const spotifyResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${spotifyToken}` }
    })

    if (!spotifyResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid Spotify token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const spotifyUser = await spotifyResponse.json()
    const userId = spotifyUser.id
    console.log(`[ai-curation] User: ${userId}, Action: ${action}`)

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    if (action === 'generate_crate') {
      const { prompt } = data
      
      if (!prompt || prompt.trim().length < 5) {
        return new Response(
          JSON.stringify({ error: 'Please provide a more detailed description' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[ai-curation] Generating crate for prompt: "${prompt}"`)

      // Step 1: Analyze structure
      const structure = await analyzeCrateStructure(prompt)
      console.log(`[ai-curation] Structure: ${structure.name} with ${structure.sections.length} sections`)
      console.log(`[ai-curation] Extracted scenes: ${structure.scenes?.join(', ') || 'none'}`)

      // Step 2: For each section, find and select tracks using smart hybrid search
      const sections = []
      const usedTrackIds: string[] = []
      let totalDurationMs = 0

      for (const sectionPlan of structure.sections) {
        console.log(`\n[ai-curation] ========== Section: ${sectionPlan.name} ==========`)

        // Use smart hybrid search
        const selectedTracks = await findTracksForSection(
          userId,
          sectionPlan,
          structure.scenes || [],
          usedTrackIds,
          spotifyToken,
          supabaseAdmin
        )

        // Add to used list
        selectedTracks.forEach(t => usedTrackIds.push(t.track_id))

        // Calculate duration
        const sectionDuration = selectedTracks.reduce((sum, t) => 
          sum + (t.duration_ms || 210000), 0
        )
        totalDurationMs += sectionDuration

        sections.push({
          name: sectionPlan.name,
          emoji: sectionPlan.emoji,
          description: sectionPlan.description,
          vibeKeywords: sectionPlan.vibeKeywords,
          tracks: selectedTracks.map(t => ({
            track_id: t.track_id,
            track_name: t.name || t.track_name,
            artist_name: t.artist || t.artist_name,
            artist_genres: t.artist_genres || [],
            album_name: t.album || t.album_name,
            album_art_url: t.album_art_url,
            bpm: t.tempo || t.bpm,
            energy: t.energy,
            danceability: t.danceability,
            valence: t.valence,
            popularity: t.popularity,
            duration_ms: t.duration_ms || 210000,
            source: t.source,
          }))
        })

        console.log(`[ai-curation] Section ${sectionPlan.name}: ${selectedTracks.length} tracks selected`)
      }

      // Calculate quality score
      const allTracks = sections.flatMap(s => s.tracks)
      const quality = calculateQualityScore(allTracks)

      // Format duration
      const totalMinutes = Math.round(totalDurationMs / 1000 / 60)
      const estimatedDuration = totalMinutes >= 60 
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
        : `${totalMinutes} min`

      const result = {
        name: structure.name,
        emoji: structure.emoji,
        description: structure.description,
        sections,
        totalTracks: allTracks.length,
        estimatedDuration,
        quality,
        vibes: structure.vibes,
        scenes: structure.scenes,
      }

      console.log(`\n[ai-curation] ✅ Generated crate: ${result.totalTracks} tracks, quality ${quality.total.toFixed(1)}`)

      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'save_crate') {
      const { crate } = data
      
      console.log(`[ai-curation] Saving crate: ${crate.name}`)

      // Create crate
      const { data: newCrate, error: crateError } = await supabaseAdmin
        .from('crates')
        .insert({
          user_id: userId,
          name: crate.name,
          emoji: crate.emoji,
          description: crate.description,
          vibe_keywords: [...(crate.vibes || []), ...(crate.scenes || [])],
          color: '#a855f7', // Purple for AI-generated
        })
        .select()
        .single()

      if (crateError) {
        console.error('[ai-curation] Crate creation error:', crateError)
        throw crateError
      }

      // Add tracks with positions
      const allTracks = crate.sections.flatMap((section: any, sectionIdx: number) =>
        section.tracks.map((track: any, trackIdx: number) => ({
          crate_id: newCrate.id,
          track_id: track.track_id,
          position: sectionIdx * 100 + trackIdx + 1,
        }))
      )

      if (allTracks.length > 0) {
        const { error: tracksError } = await supabaseAdmin
          .from('crate_tracks')
          .insert(allTracks)

        if (tracksError) {
          console.error('[ai-curation] Tracks insert error:', tracksError)
          await supabaseAdmin.from('crates').delete().eq('id', newCrate.id)
          throw tracksError
        }

        // Cache track metadata with genres
        const trackCacheData = crate.sections.flatMap((section: any) =>
          section.tracks.map((track: any) => ({
            track_id: track.track_id,
            name: track.track_name,
            artist_name: track.artist_name,
            artist_id: track.artist_id || null,
            artist_genres: track.artist_genres || [],
            album_name: track.album_name,
            album_art_url: track.album_art_url,
            bpm: track.bpm,
            energy: track.energy,
            danceability: track.danceability,
            valence: track.valence,
            popularity: track.popularity,
            duration_ms: track.duration_ms,
          }))
        )

        await supabaseAdmin
          .from('track_cache')
          .upsert(trackCacheData, { onConflict: 'track_id' })
      }

      console.log(`[ai-curation] Saved crate ${newCrate.id} with ${allTracks.length} tracks`)

      return new Response(
        JSON.stringify({ data: newCrate }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'backfill_genres') {
      console.log('[ai-curation] Starting genre backfill...')

      // Get tracks missing genres
      const { data: tracks, error } = await supabaseAdmin
        .from('track_cache')
        .select('track_id, artist_id, name, artist_name')
        .or('artist_genres.is.null,artist_genres.eq.{}')
        .not('artist_id', 'is', null)
        .limit(100)

      if (error || !tracks || tracks.length === 0) {
        return new Response(
          JSON.stringify({ data: { processed: 0, failed: 0, message: 'No tracks need backfill' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let processed = 0
      let failed = 0

      for (const track of tracks) {
        try {
          const genres = await fetchArtistGenres(track.artist_id, spotifyToken)

          await supabaseAdmin
            .from('track_cache')
            .update({ artist_genres: genres })
            .eq('track_id', track.track_id)

          processed++
          console.log(`[ai-curation] ✓ ${track.name}: ${genres.join(', ')}`)

          await new Promise(r => setTimeout(r, 100))
        } catch (e) {
          failed++
          console.error(`[ai-curation] Failed: ${track.name}`)
        }
      }

      console.log(`[ai-curation] Backfill complete: ${processed} processed, ${failed} failed`)

      return new Response(
        JSON.stringify({ data: { processed, failed } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('[ai-curation] Error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
