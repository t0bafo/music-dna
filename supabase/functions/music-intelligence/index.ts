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
    // Parse request body first to check if it's a public action
    const body = await req.json()
    const { action, data } = body

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Handle public actions (no auth required)
    if (action === 'get_public_crate') {
      const { crate_id } = data
      console.log(`[music-intelligence] Fetching public crate: ${crate_id}`)
      
      if (!crate_id) {
        return new Response(
          JSON.stringify({ error: 'Missing crate_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch crate (public - no user_id filter)
      const { data: crate, error: crateError } = await supabaseAdmin
        .from('crates')
        .select('*')
        .eq('id', crate_id)
        .maybeSingle()
      
      if (crateError) {
        console.error('[music-intelligence] Error fetching public crate:', crateError)
        throw crateError
      }
      
      if (!crate) {
        return new Response(
          JSON.stringify({ error: 'Crate not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch tracks with cache
      const { data: crateTracks } = await supabaseAdmin
        .from('crate_tracks')
        .select('*')
        .eq('crate_id', crate_id)
        .order('position', { ascending: true })

      const trackIds = (crateTracks || []).map((ct: any) => ct.track_id)
      let trackDetails: Record<string, any> = {}
      
      if (trackIds.length > 0) {
        const { data: cached } = await supabaseAdmin
          .from('track_cache')
          .select('*')
          .in('track_id', trackIds)
        
        if (cached) {
          for (const t of cached) {
            trackDetails[t.track_id] = t
          }
        }
      }

      const tracks = (crateTracks || []).map((ct: any) => ({
        ...ct,
        ...trackDetails[ct.track_id]
      }))

      // Calculate total duration
      const totalDurationMs = tracks.reduce((sum: number, t: any) => sum + (t.duration_ms || 0), 0)

      console.log(`[music-intelligence] Public crate ${crate_id}: ${tracks.length} tracks`)
      
      return new Response(
        JSON.stringify({ 
          data: { 
            ...crate, 
            tracks,
            total_duration_ms: totalDurationMs
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For all other actions, require Spotify token
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
        // Get track suggestions for a playlist (legacy - used by PlaylistDetail)
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

      // ========== CRATES ACTIONS ==========
      
      case 'get_crates': {
        console.log(`[music-intelligence] Fetching crates for user ${userId}`)
        const { data: crates, error: cratesError } = await supabaseAdmin.from('crates').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
        if (cratesError) throw cratesError
        const crateIds = (crates || []).map((c: any) => c.id)
        let trackCounts: Record<string, number> = {}
        if (crateIds.length > 0) {
          const { data: counts } = await supabaseAdmin.from('crate_tracks').select('crate_id').in('crate_id', crateIds)
          if (counts) { for (const row of counts) { trackCounts[row.crate_id] = (trackCounts[row.crate_id] || 0) + 1 } }
        }
        result = { data: (crates || []).map((c: any) => ({ ...c, track_count: trackCounts[c.id] || 0 })) }
        break
      }

      case 'get_crate': {
        const { crate_id } = data
        const { data: crate, error: crateError } = await supabaseAdmin.from('crates').select('*').eq('id', crate_id).eq('user_id', userId).maybeSingle()
        if (crateError) throw crateError
        if (!crate) return new Response(JSON.stringify({ error: 'Crate not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        const { data: crateTracks } = await supabaseAdmin.from('crate_tracks').select('*').eq('crate_id', crate_id).order('position', { ascending: true })
        const trackIds = (crateTracks || []).map((ct: any) => ct.track_id)
        let trackDetails: Record<string, any> = {}
        if (trackIds.length > 0) {
          const { data: cached } = await supabaseAdmin.from('track_cache').select('*').in('track_id', trackIds)
          if (cached) { for (const t of cached) { trackDetails[t.track_id] = t } }
          
          // Find tracks missing critical data (preview_url OR duration_ms)
          const tracksMissingData = trackIds.filter((id: string) => {
            const track = trackDetails[id]
            if (!track) return true // Track not in cache at all
            const missingPreview = !track.preview_url && track.preview_url !== null
            const missingDuration = !track.duration_ms || track.duration_ms === 0
            return missingPreview || missingDuration
          })
          
          if (tracksMissingData.length > 0) {
            console.log(`[music-intelligence] Backfilling data for ${tracksMissingData.length} tracks (missing duration/preview)`)
            try {
              // Spotify allows up to 50 tracks per request
              const batches = []
              for (let i = 0; i < tracksMissingData.length; i += 50) {
                batches.push(tracksMissingData.slice(i, i + 50))
              }
              
              for (const batch of batches) {
                const spotifyTracksResponse = await fetch(
                  `https://api.spotify.com/v1/tracks?ids=${batch.join(',')}`,
                  { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
                )
                
                if (spotifyTracksResponse.ok) {
                  const spotifyData = await spotifyTracksResponse.json()
                  const updates: any[] = []
                  
                  for (const track of spotifyData.tracks || []) {
                    if (track && track.id) {
                      // Update local cache object
                      if (!trackDetails[track.id]) {
                        trackDetails[track.id] = {}
                      }
                      trackDetails[track.id].preview_url = track.preview_url
                      trackDetails[track.id].duration_ms = track.duration_ms
                      trackDetails[track.id].popularity = track.popularity
                      trackDetails[track.id].album_art_url = track.album?.images?.[0]?.url
                      trackDetails[track.id].name = track.name
                      trackDetails[track.id].artist_name = track.artists?.map((a: any) => a.name).join(', ')
                      trackDetails[track.id].album_name = track.album?.name
                      
                      // Prepare DB update with all fields
                      updates.push({
                        track_id: track.id,
                        name: track.name,
                        artist_name: track.artists?.map((a: any) => a.name).join(', '),
                        album_name: track.album?.name,
                        album_art_url: track.album?.images?.[0]?.url,
                        duration_ms: track.duration_ms,
                        popularity: track.popularity,
                        preview_url: track.preview_url,
                        fetched_at: new Date().toISOString()
                      })
                    }
                  }
                  
                  // Update track_cache with backfilled data
                  if (updates.length > 0) {
                    await supabaseAdmin.from('track_cache').upsert(updates, { onConflict: 'track_id' })
                    console.log(`[music-intelligence] Backfilled ${updates.length} tracks with duration/preview data`)
                  }
                }
              }
            } catch (backfillError) {
              console.error('[music-intelligence] Error backfilling track data:', backfillError)
              // Continue without backfill - non-critical error
            }
          }
        }
        result = { data: { ...crate, tracks: (crateTracks || []).map((ct: any) => ({ ...ct, ...trackDetails[ct.track_id] })) } }
        break
      }

      case 'create_crate': {
        const { name, description, emoji, color } = data
        const { data: crate, error: createError } = await supabaseAdmin.from('crates').insert({ user_id: userId, name, description: description || null, emoji: emoji || '📦', color: color || '#1DB954' }).select().single()
        if (createError) throw createError
        result = { data: { ...crate, track_count: 0 } }
        break
      }

      case 'update_crate': {
        const { crate_id, name, description, emoji, color } = data
        const { data: crate, error: updateError } = await supabaseAdmin.from('crates').update({ name, description, emoji, color }).eq('id', crate_id).eq('user_id', userId).select().single()
        if (updateError) throw updateError
        result = { data: crate }
        break
      }

      case 'delete_crate': {
        const { crate_id } = data
        const { error: deleteError } = await supabaseAdmin.from('crates').delete().eq('id', crate_id).eq('user_id', userId)
        if (deleteError) throw deleteError
        result = { data: { deleted: true } }
        break
      }

      case 'add_tracks_to_crate': {
        const { crate_id, tracks } = data
        const { data: crate } = await supabaseAdmin.from('crates').select('id').eq('id', crate_id).eq('user_id', userId).maybeSingle()
        if (!crate) return new Response(JSON.stringify({ error: 'Crate not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        const { data: maxPos } = await supabaseAdmin.from('crate_tracks').select('position').eq('crate_id', crate_id).order('position', { ascending: false }).limit(1)
        let position = (maxPos && maxPos.length > 0) ? maxPos[0].position + 1 : 0
        const trackCacheData = tracks.map((t: any) => ({ track_id: t.track_id, name: t.name, artist_name: t.artist_name, album_name: t.album_name, album_art_url: t.album_art_url, duration_ms: t.duration_ms, popularity: t.popularity, bpm: t.bpm, energy: t.energy, danceability: t.danceability, valence: t.valence, preview_url: t.preview_url || null, fetched_at: new Date().toISOString() }))
        await supabaseAdmin.from('track_cache').upsert(trackCacheData, { onConflict: 'track_id' })
        await supabaseAdmin.from('crate_tracks').delete().eq('crate_id', crate_id).in('track_id', tracks.map((t: any) => t.track_id))
        const crateTrackData = tracks.map((t: any, i: number) => ({ crate_id, track_id: t.track_id, position: position + i }))
        await supabaseAdmin.from('crate_tracks').insert(crateTrackData)
        await supabaseAdmin.from('crates').update({ updated_at: new Date().toISOString() }).eq('id', crate_id)
        result = { data: { added: tracks.length } }
        break
      }

      case 'remove_track_from_crate': {
        const { crate_id, track_id } = data
        const { data: crate } = await supabaseAdmin.from('crates').select('id').eq('id', crate_id).eq('user_id', userId).maybeSingle()
        if (!crate) return new Response(JSON.stringify({ error: 'Crate not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        await supabaseAdmin.from('crate_tracks').delete().eq('crate_id', crate_id).eq('track_id', track_id)
        await supabaseAdmin.from('crates').update({ updated_at: new Date().toISOString() }).eq('id', crate_id)
        result = { data: { removed: true } }
        break
      }

      case 'reorder_crate_tracks': {
        const { crate_id, track_ids } = data
        const { data: crate } = await supabaseAdmin.from('crates').select('id').eq('id', crate_id).eq('user_id', userId).maybeSingle()
        if (!crate) return new Response(JSON.stringify({ error: 'Crate not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        for (let i = 0; i < track_ids.length; i++) { await supabaseAdmin.from('crate_tracks').update({ position: i }).eq('crate_id', crate_id).eq('track_id', track_ids[i]) }
        result = { data: { reordered: true } }
        break
      }

      case 'suggest_tracks_for_crate': {
        // Smart Track Suggestions for new Crates
        const { crate_name, crate_description } = data
        console.log(`[music-intelligence] Suggesting tracks for crate "${crate_name}" for user ${userId}`)
        
        const text = `${crate_name} ${crate_description || ''}`.toLowerCase()
        
        // Define vibe keywords and their associations
        const vibeKeywords: Record<string, string[]> = {
          night: ['night', 'midnight', 'evening', 'late', 'dark', 'moon', 'nocturnal'],
          chill: ['chill', 'relax', 'calm', 'soft', 'smooth', 'easy', 'mellow', 'lounge'],
          energy: ['energy', 'hype', 'pump', 'party', 'club', 'workout', 'gym', 'turn up', 'lit'],
          drive: ['drive', 'driving', 'road', 'journey', 'travel', 'cruise', 'highway'],
          sunday: ['sunday', 'morning', 'weekend', 'brunch', 'lazy'],
          sad: ['sad', 'heartbreak', 'lonely', 'blue', 'melancholy', 'emotional', 'cry', 'miss'],
          happy: ['happy', 'joy', 'upbeat', 'positive', 'bright', 'sunshine', 'good vibes'],
          focus: ['focus', 'study', 'work', 'concentration', 'deep', 'productive'],
          romance: ['love', 'romance', 'romantic', 'date', 'intimate', 'sensual'],
          underground: ['underground', 'indie', 'alternative', 'discover', 'hidden', 'gems'],
          summer: ['summer', 'beach', 'tropical', 'vacation', 'hot', 'sunny'],
          winter: ['winter', 'cold', 'cozy', 'snow', 'holiday']
        }
        
        // Genre keywords
        const genreKeywords: Record<string, string[]> = {
          afrobeats: ['afrobeats', 'afro', 'african', 'lagos', 'naija', 'amapiano'],
          rnb: ['r&b', 'rnb', 'soul', 'neo soul', 'neo-soul'],
          hiphop: ['hip hop', 'hip-hop', 'rap', 'trap', 'bars'],
          electronic: ['electronic', 'edm', 'house', 'techno', 'dance'],
          pop: ['pop', 'mainstream', 'hits']
        }
        
        // Determine target audio profile based on keywords
        let targetEnergy = 0.5
        let targetValence = 0.5
        let targetTempo = 110
        let energyImportance = 0
        let valenceImportance = 0
        let tempoImportance = 0
        let undergroundBoost = false
        
        // Night/chill = low energy
        if (text.match(/night|midnight|evening|late|dark|chill|relax|calm|soft|smooth|mellow/)) {
          targetEnergy = 0.4
          energyImportance = 3
        }
        
        // Energy/party = high energy
        if (text.match(/energy|hype|pump|party|club|workout|gym|turn up|lit/)) {
          targetEnergy = 0.8
          energyImportance = 4
        }
        
        // Sad = low valence
        if (text.match(/sad|heartbreak|lonely|blue|melancholy|emotional|cry|miss/)) {
          targetValence = 0.3
          valenceImportance = 4
        }
        
        // Happy = high valence
        if (text.match(/happy|joy|upbeat|positive|bright|sunshine|good vibes/)) {
          targetValence = 0.75
          valenceImportance = 3
        }
        
        // Underground preference
        if (text.match(/underground|indie|alternative|discover|hidden|gems/)) {
          undergroundBoost = true
        }
        
        // Drive = medium tempo
        if (text.match(/drive|driving|road|cruise|highway/)) {
          targetTempo = 100
          tempoImportance = 2
        }
        
        // Focus = medium-low energy
        if (text.match(/focus|study|work|concentration|productive/)) {
          targetEnergy = 0.45
          energyImportance = 3
        }
        
        // Fetch all user tracks with audio features
        let allTracks: any[] = []
        let offset = 0
        const pageSize = 1000
        
        while (true) {
          const { data: batch, error } = await supabaseAdmin
            .from('music_library')
            .select('track_id, name, artist, album, tempo, energy, danceability, valence, popularity, added_at')
            .eq('user_id', userId)
            .range(offset, offset + pageSize - 1)
          
          if (error) throw error
          if (!batch || batch.length === 0) break
          
          allTracks = allTracks.concat(batch)
          if (batch.length < pageSize) break
          offset += pageSize
        }
        
        console.log(`[music-intelligence] Scoring ${allTracks.length} library tracks`)
        
        if (allTracks.length === 0) {
          result = { data: [] }
          break
        }
        
        // Score each track
        const scoredTracks = allTracks.map((track: any) => {
          let score = 0
          const trackText = `${track.name} ${track.artist}`.toLowerCase()
          
          // Check vibe keyword matches
          Object.values(vibeKeywords).forEach((keywords: string[]) => {
            keywords.forEach(keyword => {
              if (text.includes(keyword) && trackText.includes(keyword)) {
                score += 3
              }
            })
          })
          
          // Check genre keyword matches
          Object.entries(genreKeywords).forEach(([genre, keywords]) => {
            keywords.forEach(keyword => {
              if (text.includes(keyword)) {
                if (trackText.includes(genre) || trackText.includes(keyword)) {
                  score += 5
                }
              }
            })
          })
          
          // Audio feature scoring if available
          if (track.energy != null && energyImportance > 0) {
            const energyDiff = Math.abs(track.energy - targetEnergy)
            if (energyDiff < 0.15) score += energyImportance
            else if (energyDiff < 0.3) score += energyImportance * 0.5
          }
          
          if (track.valence != null && valenceImportance > 0) {
            const valenceDiff = Math.abs(track.valence - targetValence)
            if (valenceDiff < 0.15) score += valenceImportance
            else if (valenceDiff < 0.3) score += valenceImportance * 0.5
          }
          
          if (track.tempo != null && tempoImportance > 0) {
            const tempoDiff = Math.abs(track.tempo - targetTempo)
            if (tempoDiff < 10) score += tempoImportance
            else if (tempoDiff < 20) score += tempoImportance * 0.5
          }
          
          // Underground boost
          if (undergroundBoost && (track.popularity || 100) < 40) {
            score += 2
          }
          
          // Boost recently saved tracks
          if (track.added_at) {
            const daysSinceSaved = Math.floor((Date.now() - new Date(track.added_at).getTime()) / (1000 * 60 * 60 * 24))
            if (daysSinceSaved < 7) score += 3
            else if (daysSinceSaved < 30) score += 2
          }
          
          // Small boost for tracks with decent popularity (more likely to be good)
          if ((track.popularity || 0) > 50 && (track.popularity || 0) < 80) {
            score += 1
          }
          
          return { ...track, score }
        })
        
        // Sort by score and return top 15
        const suggestions: any[] = scoredTracks
          .filter((t: any) => t.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 15)
          .map((t: any) => ({
            track_id: t.track_id,
            name: t.name,
            artist: t.artist,
            album: t.album,
            tempo: t.tempo,
            energy: t.energy,
            danceability: t.danceability,
            valence: t.valence,
            popularity: t.popularity,
            score: t.score,
            album_art_url: null as string | null,
            duration_ms: null as number | null,
            preview_url: null as string | null
          }))
        
        // Fetch album art from track_cache or Spotify
        if (suggestions.length > 0) {
          const trackIds = suggestions.map((s: any) => s.track_id)
          
          // Try cache first
          const { data: cached } = await supabaseAdmin
            .from('track_cache')
            .select('track_id, album_art_url, duration_ms, preview_url')
            .in('track_id', trackIds)
          
          const cacheMap: Record<string, any> = {}
          if (cached) {
            for (const c of cached) {
              cacheMap[c.track_id] = c
            }
          }
          
          // Fetch missing from Spotify
          const missingIds = trackIds.filter((id: string) => !cacheMap[id]?.album_art_url)
          if (missingIds.length > 0) {
            try {
              const spotifyRes = await fetch(
                `https://api.spotify.com/v1/tracks?ids=${missingIds.join(',')}`,
                { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
              )
              if (spotifyRes.ok) {
                const spotifyData = await spotifyRes.json()
                const updates: any[] = []
                for (const track of spotifyData.tracks || []) {
                  if (track && track.id) {
                    cacheMap[track.id] = {
                      album_art_url: track.album?.images?.[0]?.url,
                      duration_ms: track.duration_ms,
                      preview_url: track.preview_url
                    }
                    updates.push({
                      track_id: track.id,
                      name: track.name,
                      artist_name: track.artists?.[0]?.name,
                      album_name: track.album?.name,
                      album_art_url: track.album?.images?.[0]?.url,
                      duration_ms: track.duration_ms,
                      preview_url: track.preview_url,
                      fetched_at: new Date().toISOString()
                    })
                  }
                }
                if (updates.length > 0) {
                  await supabaseAdmin.from('track_cache').upsert(updates, { onConflict: 'track_id' })
                }
              }
            } catch (e) {
              console.error('[music-intelligence] Error fetching track details from Spotify:', e)
            }
          }
          
          // Merge cache data into suggestions
          for (const s of suggestions) {
            const c = cacheMap[s.track_id]
            if (c) {
              s.album_art_url = c.album_art_url
              s.duration_ms = c.duration_ms
              s.preview_url = c.preview_url
            }
          }
        }
        
        console.log(`[music-intelligence] Found ${suggestions.length} suggestions for crate "${crate_name}"`)
        result = { data: suggestions }
        break
      }

      case 'suggest_tracks_for_playlist': {
        // Track Suggestions Tool - full flow with ReccoBeats
        const { playlist_id } = data
        console.log(`[music-intelligence] Suggesting tracks for playlist ${playlist_id} for user ${userId}`)

        // Step 1: Fetch playlist tracks from Spotify
        const playlistResponse = await fetch(
          `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?limit=100&fields=items(track(id,name,artists))`,
          { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
        )

        if (!playlistResponse.ok) {
          console.error('[music-intelligence] Failed to fetch playlist tracks:', playlistResponse.status)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch playlist tracks' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const playlistData = await playlistResponse.json()
        const playlistTracks = playlistData.items
          .map((item: any) => item.track)
          .filter((track: any) => track && track.id)
        
        if (playlistTracks.length === 0) {
          return new Response(
            JSON.stringify({ 
              data: { 
                playlist_profile: { name: '', track_count: 0, avg_bpm: 0, avg_energy: 0, avg_danceability: 0, avg_valence: 0, bpm_range: [0, 0] },
                suggestions: [] 
              } 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const playlistTrackIds = playlistTracks.map((t: any) => t.id)
        console.log(`[music-intelligence] Playlist has ${playlistTrackIds.length} tracks`)

        // Step 2: Get audio features from ReccoBeats API
        const allFeatures: Map<string, any> = new Map()

        // First, try to get features from user's library (already stored)
        const { data: libraryFeatures } = await supabaseAdmin
          .from('music_library')
          .select('track_id, tempo, energy, danceability, valence, acousticness, speechiness, instrumentalness, liveness, popularity')
          .eq('user_id', userId)
          .in('track_id', playlistTrackIds)

        if (libraryFeatures && libraryFeatures.length > 0) {
          for (const track of libraryFeatures) {
            if (track.tempo != null) {
              allFeatures.set(track.track_id, {
                id: track.track_id,
                tempo: track.tempo,
                energy: track.energy,
                danceability: track.danceability,
                valence: track.valence,
                acousticness: track.acousticness,
                speechiness: track.speechiness,
                instrumentalness: track.instrumentalness,
                liveness: track.liveness
              })
            }
          }
          console.log(`[music-intelligence] Got ${allFeatures.size} tracks from library`)
        }

        // For tracks not in library, fetch from ReccoBeats individually (parallel)
        const missingIds = playlistTrackIds.filter((id: string) => !allFeatures.has(id))
        
        if (missingIds.length > 0) {
          console.log(`[music-intelligence] Fetching ${missingIds.length} tracks from ReccoBeats`)
          
          const fetchPromises = missingIds.slice(0, 20).map(async (trackId: string) => {
            try {
              const response = await fetch(
                `https://api.reccobeats.com/v1/track/${trackId}/audio-features`
              )
              if (response.ok) {
                const data = await response.json()
                return { id: trackId, ...data }
              }
            } catch (err) {
              // Silent fail for individual tracks
            }
            return null
          })
          
          const results = await Promise.all(fetchPromises)
          for (const feature of results) {
            if (feature && feature.tempo != null) {
              allFeatures.set(feature.id, feature)
            }
          }
        }

        console.log(`[music-intelligence] Got features for ${allFeatures.size} tracks from ReccoBeats`)

        // Step 3: Calculate playlist profile
        const tracksWithFeatures = playlistTrackIds
          .map((id: string) => allFeatures.get(id))
          .filter((f: any) => f && f.tempo != null)

        if (tracksWithFeatures.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Unable to fetch audio features. Please try again.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
        const tempos = tracksWithFeatures.map((f: any) => f.tempo)
        const energies = tracksWithFeatures.map((f: any) => f.energy * 100)
        const danceabilities = tracksWithFeatures.map((f: any) => f.danceability * 100)
        const valences = tracksWithFeatures.map((f: any) => f.valence * 100)

        const playlistProfile = {
          name: '', // We don't need name in this context
          track_count: playlistTrackIds.length,
          avg_bpm: avg(tempos),
          avg_energy: avg(energies),
          avg_danceability: avg(danceabilities),
          avg_valence: avg(valences),
          bpm_range: [Math.min(...tempos), Math.max(...tempos)] as [number, number],
        }

        console.log(`[music-intelligence] Playlist profile:`, playlistProfile)

        // Step 4: Query user's library for compatible tracks
        const { data: libraryTracks, error: libraryError } = await supabaseAdmin
          .from('music_library')
          .select('track_id, name, artist, album, tempo, energy, danceability, valence, popularity')
          .eq('user_id', userId)
          .gte('tempo', playlistProfile.avg_bpm - 20)
          .lte('tempo', playlistProfile.avg_bpm + 20)
          .not('tempo', 'is', null)
          .limit(200)

        if (libraryError) throw libraryError

        // Step 5: Filter out tracks already in playlist and score each candidate
        const candidateTracks = (libraryTracks || [])
          .filter((track: any) => !playlistTrackIds.includes(track.track_id))
          .map((track: any) => {
            // BPM Match (30 points max)
            const bpmDiff = Math.abs(track.tempo - playlistProfile.avg_bpm)
            let bpmScore = 0
            if (bpmDiff <= 5) bpmScore = 30
            else if (bpmDiff <= 10) bpmScore = 20
            else if (bpmDiff <= 15) bpmScore = 10

            // Energy Match (25 points max)
            const energyVal = (track.energy || 0) * 100
            const energyDiff = Math.abs(energyVal - playlistProfile.avg_energy)
            const energyScore = Math.round(25 * (1 - energyDiff / 100))

            // Danceability Match (20 points max)
            const danceVal = (track.danceability || 0) * 100
            const danceDiff = Math.abs(danceVal - playlistProfile.avg_danceability)
            const danceScore = Math.round(20 * (1 - danceDiff / 100))

            // Valence Match (15 points max)
            const valenceVal = (track.valence || 0) * 100
            const valenceDiff = Math.abs(valenceVal - playlistProfile.avg_valence)
            const valenceScore = Math.round(15 * (1 - valenceDiff / 100))

            // Popularity similarity (10 points max) - placeholder
            const popScore = 10

            const totalScore = bpmScore + energyScore + danceScore + valenceScore + popScore

            // Generate match reason
            let reason = ''
            if (bpmScore === 30) {
              reason = `Perfect BPM match at ${Math.round(track.tempo)} BPM`
            } else if (energyDiff < 10) {
              reason = `Energy aligns perfectly with your playlist`
            } else if ((track.popularity || 100) < 40) {
              reason = `Underground gem that fits your vibe`
            } else if (danceDiff < 10) {
              reason = `Danceability matches your playlist flow`
            } else {
              reason = `Similar audio profile to your playlist`
            }

            return {
              track_id: track.track_id,
              name: track.name,
              artist: track.artist,
              score: totalScore,
              bpm: track.tempo,
              energy: energyVal,
              danceability: danceVal,
              valence: valenceVal,
              match_reason: reason,
              // Individual scores for breakdown display
              scores: {
                bpm: bpmScore,
                bpm_max: 30,
                energy: energyScore,
                energy_max: 25,
                dance: danceScore,
                dance_max: 20,
                mood: valenceScore,
                mood_max: 15,
              },
            }
          })
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 20)

        // Step 6: Fetch album art from Spotify for top suggestions
        const suggestionIds = candidateTracks.map((t: any) => t.track_id).slice(0, 20)
        let albumArtMap: Map<string, string> = new Map()
        
        if (suggestionIds.length > 0) {
          try {
            const tracksResponse = await fetch(
              `https://api.spotify.com/v1/tracks?ids=${suggestionIds.join(',')}`,
              { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
            )
            if (tracksResponse.ok) {
              const tracksData = await tracksResponse.json()
              for (const track of tracksData.tracks || []) {
                if (track && track.id && track.album?.images?.length > 0) {
                  // Get smallest image (64x64) for thumbnails
                  const smallImage = track.album.images[track.album.images.length - 1]
                  albumArtMap.set(track.id, smallImage.url)
                }
              }
            }
          } catch (err) {
            console.error('[music-intelligence] Failed to fetch album art:', err)
          }
        }

        // Add album art to suggestions
        const suggestions = candidateTracks.map((track: any) => ({
          ...track,
          album_art: albumArtMap.get(track.track_id) || null,
        }))

        console.log(`[music-intelligence] Found ${suggestions.length} suggestions`)

        result = { 
          data: { 
            playlist_profile: playlistProfile, 
            suggestions 
          } 
        }
        break
      }

      case 'get_all_crates_with_tracks': {
        // Fetch all crates with their tracks for cross-crate search
        console.log(`[music-intelligence] Fetching all crates with tracks for user ${userId}`)
        
        // Get all user's crates
        const { data: allCrates, error: cratesErr } = await supabaseAdmin
          .from('crates')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
        
        if (cratesErr) throw cratesErr
        
        if (!allCrates || allCrates.length === 0) {
          result = { data: [] }
          break
        }
        
        // Get all crate tracks for all user's crates
        const crateIds = allCrates.map(c => c.id)
        const { data: allCrateTracks, error: tracksErr } = await supabaseAdmin
          .from('crate_tracks')
          .select('*')
          .in('crate_id', crateIds)
          .order('position', { ascending: true })
        
        if (tracksErr) throw tracksErr
        
        // Get unique track IDs and fetch from cache
        const uniqueTrackIds = [...new Set((allCrateTracks || []).map((ct: any) => ct.track_id))]
        let trackDetailsMap: Record<string, any> = {}
        
        if (uniqueTrackIds.length > 0) {
          const { data: cachedTracks } = await supabaseAdmin
            .from('track_cache')
            .select('*')
            .in('track_id', uniqueTrackIds)
          
          if (cachedTracks) {
            for (const t of cachedTracks) {
              trackDetailsMap[t.track_id] = t
            }
          }
        }
        
        // Group tracks by crate
        const tracksByCrate: Record<string, any[]> = {}
        for (const ct of allCrateTracks || []) {
          if (!tracksByCrate[ct.crate_id]) tracksByCrate[ct.crate_id] = []
          tracksByCrate[ct.crate_id].push({
            ...ct,
            ...trackDetailsMap[ct.track_id]
          })
        }
        
        // Combine crates with their tracks
        const cratesWithTracks = allCrates.map(crate => ({
          ...crate,
          track_count: (tracksByCrate[crate.id] || []).length,
          tracks: tracksByCrate[crate.id] || []
        }))
        
        console.log(`[music-intelligence] Found ${allCrates.length} crates with ${uniqueTrackIds.length} unique tracks`)
        result = { data: cratesWithTracks }
        break
      }

      // ========== SPOTIFY SYNC ACTIONS ==========

      case 'link_spotify_playlist': {
        const { crate_id, playlist_id, sync_enabled } = data
        console.log(`[music-intelligence] Linking crate ${crate_id} to playlist ${playlist_id}`)
        
        result = await supabaseAdmin
          .from('crates')
          .update({
            spotify_playlist_id: playlist_id,
            sync_enabled: sync_enabled ?? true,
            sync_status: 'unsynced',
            sync_error: null,
          })
          .eq('id', crate_id)
          .eq('user_id', userId)
        break
      }

      case 'unlink_spotify_playlist': {
        const { crate_id } = data
        console.log(`[music-intelligence] Unlinking crate ${crate_id} from Spotify`)
        
        result = await supabaseAdmin
          .from('crates')
          .update({
            spotify_playlist_id: null,
            sync_enabled: false,
            sync_status: 'unsynced',
            last_synced_at: null,
            sync_error: null,
          })
          .eq('id', crate_id)
          .eq('user_id', userId)
        break
      }

      case 'update_sync_settings': {
        const { crate_id, sync_enabled } = data
        console.log(`[music-intelligence] Updating sync for crate ${crate_id}: enabled=${sync_enabled}`)
        
        result = await supabaseAdmin
          .from('crates')
          .update({
            sync_enabled,
            sync_status: sync_enabled ? 'unsynced' : 'unsynced',
          })
          .eq('id', crate_id)
          .eq('user_id', userId)
        break
      }

      case 'sync_to_spotify': {
        const { crate_id } = data
        console.log(`[music-intelligence] Syncing crate ${crate_id} to Spotify`)
        
        // Get crate info
        const { data: crate, error: crateError } = await supabaseAdmin
          .from('crates')
          .select('*')
          .eq('id', crate_id)
          .eq('user_id', userId)
          .single()
        
        if (crateError || !crate) {
          return new Response(
            JSON.stringify({ error: 'Crate not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        if (!crate.spotify_playlist_id) {
          return new Response(
            JSON.stringify({ error: 'Crate not linked to Spotify playlist' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Set status to pending
        await supabaseAdmin
          .from('crates')
          .update({ sync_status: 'pending' })
          .eq('id', crate_id)
        
        try {
          // Get crate tracks in order
          const { data: crateTracks } = await supabaseAdmin
            .from('crate_tracks')
            .select('track_id, position')
            .eq('crate_id', crate_id)
            .order('position', { ascending: true })
          
          const trackUris = (crateTracks || []).map(t => `spotify:track:${t.track_id}`)
          
          // Replace all tracks in Spotify playlist
          const replaceResponse = await fetch(
            `https://api.spotify.com/v1/playlists/${crate.spotify_playlist_id}/tracks`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${spotifyToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ uris: trackUris }),
            }
          )
          
          if (!replaceResponse.ok) {
            const errorText = await replaceResponse.text()
            console.error('[music-intelligence] Spotify replace tracks error:', replaceResponse.status, errorText)
            
            if (replaceResponse.status === 404) {
              // Playlist was deleted
              await supabaseAdmin
                .from('crates')
                .update({
                  spotify_playlist_id: null,
                  sync_enabled: false,
                  sync_status: 'error',
                  sync_error: 'Playlist not found. It may have been deleted in Spotify.',
                })
                .eq('id', crate_id)
              
              return new Response(
                JSON.stringify({ error: 'Spotify playlist not found. It may have been deleted.' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
            
            throw new Error(`Spotify API error: ${replaceResponse.status}`)
          }
          
          // Update playlist name/description
          await fetch(
            `https://api.spotify.com/v1/playlists/${crate.spotify_playlist_id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${spotifyToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: `${crate.emoji || ''} ${crate.name}`.trim(),
                description: crate.description || 'Synced from Music DNA',
              }),
            }
          )
          
          // Update sync status to success
          result = await supabaseAdmin
            .from('crates')
            .update({
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
              sync_error: null,
            })
            .eq('id', crate_id)
          
          console.log(`[music-intelligence] Sync complete for crate ${crate_id}`)
          
        } catch (syncError) {
          console.error('[music-intelligence] Sync failed:', syncError)
          
          await supabaseAdmin
            .from('crates')
            .update({
              sync_status: 'error',
              sync_error: syncError instanceof Error ? syncError.message : 'Sync failed',
            })
            .eq('id', crate_id)
          
          return new Response(
            JSON.stringify({ error: 'Sync failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
      }

      case 'create_spotify_playlist': {
        const { crate_id, name, description, is_public, sync_enabled } = data
        console.log(`[music-intelligence] Creating Spotify playlist for crate ${crate_id}`)
        
        // Get crate tracks
        const { data: crateTracks } = await supabaseAdmin
          .from('crate_tracks')
          .select('track_id, position')
          .eq('crate_id', crate_id)
          .order('position', { ascending: true })
        
        if (!crateTracks || crateTracks.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Cannot export empty crate' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Create Spotify playlist
        const createResponse = await fetch(
          `https://api.spotify.com/v1/users/${userId}/playlists`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${spotifyToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              description: description || 'Synced from Music DNA',
              public: is_public ?? true,
            }),
          }
        )
        
        if (!createResponse.ok) {
          console.error('[music-intelligence] Failed to create playlist:', createResponse.status)
          return new Response(
            JSON.stringify({ error: 'Failed to create Spotify playlist' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        const playlist = await createResponse.json()
        const trackUris = crateTracks.map(t => `spotify:track:${t.track_id}`)
        
        // Add tracks in batches of 100
        for (let i = 0; i < trackUris.length; i += 100) {
          const batch = trackUris.slice(i, i + 100)
          await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${spotifyToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ uris: batch }),
            }
          )
        }
        
        // Update crate with playlist info
        await supabaseAdmin
          .from('crates')
          .update({
            spotify_playlist_id: playlist.id,
            sync_enabled: sync_enabled ?? true,
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            sync_error: null,
          })
          .eq('id', crate_id)
          .eq('user_id', userId)
        
        result = {
          data: {
            playlistId: playlist.id,
            playlistUrl: playlist.external_urls.spotify,
          }
        }
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
