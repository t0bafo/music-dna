import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-spotify-token',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Spotify access token from header
    const spotifyToken = req.headers.get('x-spotify-token')
    if (!spotifyToken) {
      console.error('[music-intelligence] Missing Spotify access token')
      return new Response(
        JSON.stringify({ error: 'Missing Spotify access token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate Spotify token by fetching user profile
    console.log('[music-intelligence] Validating Spotify token...')
    const spotifyResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${spotifyToken}` }
    })

    if (!spotifyResponse.ok) {
      console.error('[music-intelligence] Invalid Spotify token:', spotifyResponse.status)
      return new Response(
        JSON.stringify({ error: 'Invalid Spotify token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const spotifyUser = await spotifyResponse.json()
    const userId = spotifyUser.id // Spotify user ID
    console.log(`[music-intelligence] Authenticated user: ${userId}`)

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Parse request
    const { action, data } = await req.json()
    console.log(`[music-intelligence] Action: ${action}`)

    let result

    switch (action) {
      case 'store_tracks': {
        // Store tracks with user_id enforcement
        const tracksToStore = data.tracks.map((track: any) => ({
          ...track,
          user_id: userId // Force user_id to authenticated user
        }))
        
        console.log(`[music-intelligence] Storing ${tracksToStore.length} tracks for user ${userId}`)
        
        // Upsert in batches to avoid payload size issues
        const batchSize = 100
        for (let i = 0; i < tracksToStore.length; i += batchSize) {
          const batch = tracksToStore.slice(i, i + batchSize)
          const { error } = await supabaseAdmin
            .from('music_library')
            .upsert(batch, { onConflict: 'track_id,user_id' })
          
          if (error) {
            console.error(`[music-intelligence] Error storing batch ${i}:`, error)
            throw error
          }
        }
        
        result = { data: { stored: tracksToStore.length } }
        break
      }

      case 'get_library': {
        // Get ALL user's tracks using pagination (bypass 1000 row limit)
        console.log(`[music-intelligence] Fetching library for user ${userId}`)
        
        let allTracks: any[] = []
        let offset = 0
        const pageSize = 1000
        
        while (true) {
          const { data: batch, error } = await supabaseAdmin
            .from('music_library')
            .select('*')
            .eq('user_id', userId)
            .range(offset, offset + pageSize - 1)
            .order('added_at', { ascending: false })
          
          if (error) throw error
          if (!batch || batch.length === 0) break
          
          allTracks = allTracks.concat(batch)
          console.log(`[music-intelligence] Fetched batch: ${batch.length} tracks (total: ${allTracks.length})`)
          
          if (batch.length < pageSize) break
          offset += pageSize
        }
        
        console.log(`[music-intelligence] Total tracks fetched: ${allTracks.length}`)
        result = { data: allTracks }
        break
      }

      case 'get_library_stats': {
        // Get library statistics using pagination (bypass 1000 row limit)
        console.log(`[music-intelligence] Fetching library stats for user ${userId}`)
        
        let allTracks: any[] = []
        let offset = 0
        const pageSize = 1000
        
        while (true) {
          const { data: batch, error } = await supabaseAdmin
            .from('music_library')
            .select('id, tempo, added_at')
            .eq('user_id', userId)
            .range(offset, offset + pageSize - 1)
          
          if (error) throw error
          if (!batch || batch.length === 0) break
          
          allTracks = allTracks.concat(batch)
          if (batch.length < pageSize) break
          offset += pageSize
        }
        
        console.log(`[music-intelligence] Stats: analyzed ${allTracks.length} tracks`)
        
        if (allTracks.length === 0) {
          result = { data: null }
        } else {
          const tracksWithFeatures = allTracks.filter((t: any) => t.tempo != null).length
          const latestDate = allTracks.reduce((latest: Date, t: any) => {
            const date = new Date(t.added_at)
            return date > latest ? date : latest
          }, new Date(0))
          
          result = {
            data: {
              totalTracks: allTracks.length,
              totalPlaylists: 0,
              likedSongs: 0,
              tracksWithFeatures,
              lastUpdated: latestDate.getTime() > 0 ? latestDate.toISOString() : null,
            }
          }
        }
        break
      }

      case 'get_taste_profile': {
        // Get taste profile from ALL tracks using pagination (bypass 1000 row limit)
        console.log(`[music-intelligence] Calculating taste profile for user ${userId}`)
        
        let allTracks: any[] = []
        let offset = 0
        const pageSize = 1000
        
        while (true) {
          const { data: batch, error } = await supabaseAdmin
            .from('music_library')
            .select('*')
            .eq('user_id', userId)
            .range(offset, offset + pageSize - 1)
          
          if (error) throw error
          if (!batch || batch.length === 0) break
          
          allTracks = allTracks.concat(batch)
          if (batch.length < pageSize) break
          offset += pageSize
        }
        
        console.log(`[music-intelligence] Taste profile: analyzing ${allTracks.length} tracks`)
        
        if (allTracks.length === 0) {
          result = { data: null }
        } else {
          const validTracks = allTracks.filter((t: any) => t.tempo != null && t.energy != null)
          
          if (validTracks.length === 0) {
            result = { data: null }
          } else {
            const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
            
            const tempos = validTracks.map((t: any) => t.tempo).filter(Boolean)
            const energies = validTracks.map((t: any) => t.energy).filter(Boolean)
            
            const lowEnergy = energies.filter((e: number) => e < 0.4).length
            const medEnergy = energies.filter((e: number) => e >= 0.4 && e < 0.7).length
            const highEnergy = energies.filter((e: number) => e >= 0.7).length
            
            const undergroundTracks = allTracks.filter((t: any) => (t.popularity || 100) < 40).length
            
            result = {
              data: {
                avgBpm: avg(tempos),
                avgEnergy: avg(energies),
                avgDanceability: avg(validTracks.map((t: any) => t.danceability).filter(Boolean)),
                avgValence: avg(validTracks.map((t: any) => t.valence).filter(Boolean)),
                avgAcousticness: avg(validTracks.map((t: any) => t.acousticness).filter(Boolean)),
                avgSpeechiness: avg(validTracks.map((t: any) => t.speechiness).filter(Boolean)),
                avgInstrumentalness: avg(validTracks.map((t: any) => t.instrumentalness).filter(Boolean)),
                avgLiveness: avg(validTracks.map((t: any) => t.liveness).filter(Boolean)),
                undergroundRatio: allTracks.length > 0 ? undergroundTracks / allTracks.length : 0,
                totalTracks: allTracks.length,
                bpmRange: { min: Math.min(...tempos), max: Math.max(...tempos) },
                energyDistribution: {
                  low: lowEnergy / energies.length,
                  medium: medEnergy / energies.length,
                  high: highEnergy / energies.length,
                },
              }
            }
          }
        }
        break
      }

      case 'store_events': {
        const eventsToStore = data.events.map((event: any) => ({
          ...event,
          user_id: userId
        }))
        
        console.log(`[music-intelligence] Storing ${eventsToStore.length} events for user ${userId}`)
        result = await supabaseAdmin
          .from('listening_events')
          .insert(eventsToStore)
        break
      }

      case 'get_events': {
        console.log(`[music-intelligence] Fetching events for user ${userId}`)
        result = await supabaseAdmin
          .from('listening_events')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
        break
      }

      case 'create_snapshot': {
        // Create taste snapshot based on ALL library tracks using pagination
        console.log(`[music-intelligence] Creating snapshot for user ${userId}`)
        
        let allTracks: any[] = []
        let offset = 0
        const pageSize = 1000
        
        while (true) {
          const { data: batch, error } = await supabaseAdmin
            .from('music_library')
            .select('tempo, energy, danceability, valence, popularity')
            .eq('user_id', userId)
            .range(offset, offset + pageSize - 1)
          
          if (error) throw error
          if (!batch || batch.length === 0) break
          
          allTracks = allTracks.concat(batch)
          if (batch.length < pageSize) break
          offset += pageSize
        }
        
        console.log(`[music-intelligence] Snapshot: analyzing ${allTracks.length} tracks`)
        
        if (allTracks.length === 0) {
          result = { data: null }
        } else {
          const validTracks = allTracks.filter((t: any) => t.tempo != null)
          
          const avgBpm = validTracks.reduce((sum: number, t: any) => sum + (t.tempo || 0), 0) / validTracks.length || 0
          const avgEnergy = validTracks.reduce((sum: number, t: any) => sum + (t.energy || 0), 0) / validTracks.length || 0
          const avgDanceability = validTracks.reduce((sum: number, t: any) => sum + (t.danceability || 0), 0) / validTracks.length || 0
          const avgValence = validTracks.reduce((sum: number, t: any) => sum + (t.valence || 0), 0) / validTracks.length || 0
          
          const undergroundTracks = allTracks.filter((t: any) => (t.popularity || 100) < 40).length
          const undergroundRatio = allTracks.length > 0 ? undergroundTracks / allTracks.length : 0
          
          const today = new Date().toISOString().split('T')[0]
          
          const snapshotData = {
            user_id: userId,
            snapshot_date: today,
            avg_bpm: avgBpm,
            avg_energy: avgEnergy,
            avg_danceability: avgDanceability,
            avg_valence: avgValence,
            underground_ratio: undergroundRatio,
            total_tracks: allTracks.length,
          }
          
          const { error: snapshotError } = await supabaseAdmin
            .from('taste_snapshots')
            .upsert(snapshotData, { onConflict: 'user_id,snapshot_date' })
          
          if (snapshotError) throw snapshotError
          
          result = { data: snapshotData }
        }
        break
      }

      case 'get_snapshots': {
        const limit = data?.limit || 12
        console.log(`[music-intelligence] Fetching ${limit} snapshots for user ${userId}`)
        result = await supabaseAdmin
          .from('taste_snapshots')
          .select('*')
          .eq('user_id', userId)
          .order('snapshot_date', { ascending: false })
          .limit(limit)
        break
      }

      case 'delete_library': {
        // Delete user's library (for re-extraction)
        console.log(`[music-intelligence] Deleting library for user ${userId}`)
        result = await supabaseAdmin
          .from('music_library')
          .delete()
          .eq('user_id', userId)
        break
      }

      case 'search_tracks': {
        // Smart Discovery: Search with filters
        const { filters } = data
        console.log(`[music-intelligence] Searching tracks for user ${userId} with filters:`, filters)

        let query = supabaseAdmin
          .from('music_library')
          .select('track_id, name, artist, album, tempo, energy, danceability, popularity')
          .eq('user_id', userId)

        // Apply filters
        if (filters.minBpm > 0) query = query.gte('tempo', filters.minBpm)
        if (filters.maxBpm < 300) query = query.lte('tempo', filters.maxBpm)
        if (filters.minEnergy > 0) query = query.gte('energy', filters.minEnergy / 100)
        if (filters.maxEnergy < 100) query = query.lte('energy', filters.maxEnergy / 100)
        if (filters.minDance > 0) query = query.gte('danceability', filters.minDance / 100)
        if (filters.maxDance < 100) query = query.lte('danceability', filters.maxDance / 100)
        if (filters.undergroundOnly) query = query.lt('popularity', 50)
        if (filters.limit) query = query.limit(filters.limit)

        result = await query.order('popularity', { ascending: true })
        break
      }

      case 'generate_playlist': {
        // Context Playlist Generator
        const { context, durationMinutes } = data
        console.log(`[music-intelligence] Generating ${context} playlist for user ${userId}, ${durationMinutes} mins`)

        const contexts: Record<string, { minBpm: number; maxBpm: number; minEnergy: number; maxEnergy: number; undergroundRatio: number }> = {
          'event_opener': { minBpm: 95, maxBpm: 115, minEnergy: 50, maxEnergy: 75, undergroundRatio: 0.4 },
          'peak_energy': { minBpm: 120, maxBpm: 140, minEnergy: 75, maxEnergy: 95, undergroundRatio: 0.3 },
          'wind_down': { minBpm: 85, maxBpm: 110, minEnergy: 40, maxEnergy: 70, undergroundRatio: 0.5 },
          'creative_focus': { minBpm: 90, maxBpm: 105, minEnergy: 40, maxEnergy: 60, undergroundRatio: 0.6 },
          'late_night': { minBpm: 100, maxBpm: 115, minEnergy: 50, maxEnergy: 65, undergroundRatio: 0.5 },
        }

        const ctx = contexts[context]
        if (!ctx) {
          return new Response(
            JSON.stringify({ error: 'Invalid context' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Calculate tracks needed (~3.5 min per track)
        const tracksNeeded = Math.ceil(durationMinutes / 3.5)

        // Fetch tracks matching context
        const { data: tracks, error: fetchError } = await supabaseAdmin
          .from('music_library')
          .select('track_id, name, artist, tempo, energy, popularity')
          .eq('user_id', userId)
          .gte('tempo', ctx.minBpm)
          .lte('tempo', ctx.maxBpm)
          .gte('energy', ctx.minEnergy / 100)
          .lte('energy', ctx.maxEnergy / 100)
          .not('tempo', 'is', null)
          .not('energy', 'is', null)
          .limit(tracksNeeded * 2)

        if (fetchError) throw fetchError

        if (!tracks || tracks.length === 0) {
          result = { data: [] }
          break
        }

        // Sort by BPM for progression
        const ordered = tracks.sort((a: any, b: any) => (a.tempo || 0) - (b.tempo || 0))

        // Apply underground ratio
        const undergroundCount = Math.floor(tracksNeeded * ctx.undergroundRatio)
        const underground = ordered.filter((t: any) => (t.popularity || 100) < 50).slice(0, undergroundCount)
        const mainstream = ordered.filter((t: any) => (t.popularity || 0) >= 50).slice(0, tracksNeeded - undergroundCount)

        // Interleave for variety
        const playlist: any[] = []
        const undergroundCopy = [...underground]
        const mainstreamCopy = [...mainstream]
        
        for (let i = 0; i < tracksNeeded && (undergroundCopy.length > 0 || mainstreamCopy.length > 0); i++) {
          if (i % 3 === 0 && undergroundCopy.length > 0) {
            playlist.push({ ...undergroundCopy.shift(), position: i + 1 })
          } else if (mainstreamCopy.length > 0) {
            playlist.push({ ...mainstreamCopy.shift(), position: i + 1 })
          } else if (undergroundCopy.length > 0) {
            playlist.push({ ...undergroundCopy.shift(), position: i + 1 })
          }
        }

        result = { data: playlist.slice(0, tracksNeeded) }
        break
      }

      case 'get_suggestions': {
        // Get track suggestions for a playlist
        const { playlistTrackIds, playlistAverages } = data
        console.log(`[music-intelligence] Getting suggestions for user ${userId}`)

        const { data: tracks, error: fetchError } = await supabaseAdmin
          .from('music_library')
          .select('track_id, name, artist, tempo, energy, danceability, popularity')
          .eq('user_id', userId)
          .gte('tempo', playlistAverages.avgBpm - 15)
          .lte('tempo', playlistAverages.avgBpm + 15)
          .gte('energy', (playlistAverages.avgEnergy - 15) / 100)
          .lte('energy', (playlistAverages.avgEnergy + 15) / 100)
          .limit(50)

        if (fetchError) throw fetchError

        // Filter out tracks already in playlist and calculate fit scores
        const suggestions = (tracks || [])
          .filter((track: any) => !playlistTrackIds.includes(track.track_id))
          .map((track: any) => {
            const bpmDiff = Math.abs((track.tempo || playlistAverages.avgBpm) - playlistAverages.avgBpm)
            const energyDiff = Math.abs(((track.energy || 0) * 100) - playlistAverages.avgEnergy)
            const danceDiff = Math.abs(((track.danceability || 0) * 100) - playlistAverages.avgDanceability)
            const fitScore = Math.max(0, 1 - (bpmDiff / 50 + energyDiff / 100 + danceDiff / 100) / 3)

            let reason = ''
            if (bpmDiff < 5) {
              reason = `Matches your ${Math.round(playlistAverages.avgBpm)} BPM zone perfectly`
            } else if ((track.popularity || 0) < 40) {
              reason = 'Underground gem that fits your vibe'
            } else if (Math.abs(((track.energy || 0) * 100) - playlistAverages.avgEnergy) < 10) {
              reason = 'Energy level aligns with your playlist'
            } else {
              reason = 'Similar audio profile to your playlist'
            }

            return { ...track, fitScore, reason }
          })
          .sort((a: any, b: any) => b.fitScore - a.fitScore)
          .slice(0, 10)

        result = { data: suggestions }
        break
      }

      default:
        console.error(`[music-intelligence] Invalid action: ${action}`)
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    if (result.error) {
      console.error(`[music-intelligence] Database error:`, result.error)
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[music-intelligence] Success: ${action}`)
    return new Response(
      JSON.stringify({ data: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[music-intelligence] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
