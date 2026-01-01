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
  const systemPrompt = `You are a professional music curator. Given a user's description of a playlist/crate they want, create a detailed structure plan.

Create a crate with 3-4 sections that flow naturally. Consider:
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
  "scenes": ["afrobeats", "rnb"],
  "totalTargetTracks": 18
}

Guidelines:
- Most crates: 15-25 tracks total
- Workout/party: 3 sections (Warmup/Peak/Cooldown)
- Mood/vibe: 4 sections (Opening/Build/Peak/Wind Down)
- BPM and energy should progress naturally
- Each section: 3-8 tracks depending on total`

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
    
    return structure
  } catch (error) {
    console.error('[ai-curation] Failed to parse structure:', jsonText)
    throw new Error('Failed to analyze crate structure. Please try a different description.')
  }
}

async function selectBestTracks(
  candidates: any[],
  sectionPlan: SectionPlan,
  targetCount: number
): Promise<string[]> {
  if (candidates.length <= targetCount) {
    return candidates.map(t => t.track_id)
  }

  const candidateInfo = candidates.slice(0, 30).map(t => ({
    id: t.track_id,
    name: t.name || t.track_name,
    artist: t.artist || t.artist_name,
    bpm: t.tempo || t.bpm,
    energy: Math.round((t.energy || 0.5) * 100),
    popularity: t.popularity,
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
2. Avoid repetitive artists (prefer variety)
3. Balance underground and popular tracks
4. Create smooth flow

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

      // Step 2: For each section, find and select tracks
      const sections = []
      const usedTrackIds: string[] = []
      let totalDurationMs = 0

      for (const sectionPlan of structure.sections) {
        console.log(`[ai-curation] Finding tracks for section: ${sectionPlan.name}`)

        // Build query with filters
        let query = supabaseAdmin
          .from('music_library')
          .select('track_id, name, artist, album, tempo, energy, danceability, valence, popularity')
          .eq('user_id', userId)

        // Exclude already used tracks
        if (usedTrackIds.length > 0) {
          query = query.not('track_id', 'in', `(${usedTrackIds.join(',')})`)
        }

        // Apply BPM filter with some tolerance
        const bpmMin = Math.max(60, sectionPlan.bpmRange[0] - 15)
        const bpmMax = sectionPlan.bpmRange[1] + 15
        query = query.gte('tempo', bpmMin).lte('tempo', bpmMax)

        // Apply energy filter with tolerance
        const energyMin = Math.max(0, sectionPlan.energyRange[0] - 0.15)
        const energyMax = Math.min(1, sectionPlan.energyRange[1] + 0.15)
        query = query.gte('energy', energyMin).lte('energy', energyMax)

        // Fetch more candidates than needed
        query = query.limit(sectionPlan.trackCount * 4)

        const { data: candidates, error: queryError } = await query

        if (queryError) {
          console.error(`[ai-curation] Query error:`, queryError)
          throw queryError
        }

        if (!candidates || candidates.length === 0) {
          console.warn(`[ai-curation] No candidates for section ${sectionPlan.name}, trying without filters`)
          
          // Fallback: fetch any tracks not used
          const { data: fallbackCandidates } = await supabaseAdmin
            .from('music_library')
            .select('track_id, name, artist, album, tempo, energy, danceability, valence, popularity')
            .eq('user_id', userId)
            .not('track_id', 'in', usedTrackIds.length > 0 ? `(${usedTrackIds.join(',')})` : '()')
            .limit(sectionPlan.trackCount * 2)

          if (!fallbackCandidates || fallbackCandidates.length === 0) {
            console.warn(`[ai-curation] No tracks available for section ${sectionPlan.name}`)
            continue
          }

          candidates.push(...fallbackCandidates)
        }

        // Use AI to select best tracks
        const selectedIds = await selectBestTracks(
          candidates,
          sectionPlan,
          sectionPlan.trackCount
        )

        // Get full track data for selected tracks
        const selectedTracks = selectedIds
          .map(id => candidates.find(c => c.track_id === id))
          .filter((t): t is NonNullable<typeof t> => t != null)

        // Add to used list
        selectedTracks.forEach(t => usedTrackIds.push(t.track_id))

        // Calculate duration (estimate 3.5 min per track if unknown)
        const sectionDuration = selectedTracks.reduce((sum, t) => sum + 210000, 0)
        totalDurationMs += sectionDuration

        sections.push({
          name: sectionPlan.name,
          emoji: sectionPlan.emoji,
          description: sectionPlan.description,
          vibeKeywords: sectionPlan.vibeKeywords,
          tracks: selectedTracks.map(t => ({
            track_id: t.track_id,
            track_name: t.name,
            artist_name: t.artist,
            album_name: t.album,
            bpm: t.tempo,
            energy: t.energy,
            danceability: t.danceability,
            valence: t.valence,
            popularity: t.popularity,
            duration_ms: 210000,
          }))
        })

        console.log(`[ai-curation] Section ${sectionPlan.name}: ${selectedTracks.length} tracks`)
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
      }

      console.log(`[ai-curation] Generated crate: ${result.totalTracks} tracks, quality ${quality.total.toFixed(1)}`)

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
          vibe_keywords: crate.vibes || [],
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
          // Rollback crate creation
          await supabaseAdmin.from('crates').delete().eq('id', newCrate.id)
          throw tracksError
        }

        // Cache track metadata
        const trackCacheData = crate.sections.flatMap((section: any) =>
          section.tracks.map((track: any) => ({
            track_id: track.track_id,
            name: track.track_name,
            artist_name: track.artist_name,
            album_name: track.album_name,
            bpm: track.bpm,
            energy: track.energy,
            danceability: track.danceability,
            valence: track.valence,
            popularity: track.popularity,
            duration_ms: track.duration_ms,
          }))
        )

        // Upsert to track_cache
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
