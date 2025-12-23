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
        // Get only this user's tracks
        console.log(`[music-intelligence] Fetching library for user ${userId}`)
        result = await supabaseAdmin
          .from('music_library')
          .select('*')
          .eq('user_id', userId)
        break
      }

      case 'get_library_stats': {
        // Get library statistics
        console.log(`[music-intelligence] Fetching library stats for user ${userId}`)
        const { data: tracks, error } = await supabaseAdmin
          .from('music_library')
          .select('id, tempo, added_at')
          .eq('user_id', userId)
        
        if (error) throw error
        
        if (!tracks || tracks.length === 0) {
          result = { data: null }
        } else {
          const tracksWithFeatures = tracks.filter((t: any) => t.tempo != null).length
          const latestDate = tracks.reduce((latest: Date, t: any) => {
            const date = new Date(t.added_at)
            return date > latest ? date : latest
          }, new Date(0))
          
          result = {
            data: {
              totalTracks: tracks.length,
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
        // Get taste profile from tracks
        console.log(`[music-intelligence] Calculating taste profile for user ${userId}`)
        const { data: tracks, error } = await supabaseAdmin
          .from('music_library')
          .select('*')
          .eq('user_id', userId)
        
        if (error) throw error
        
        if (!tracks || tracks.length === 0) {
          result = { data: null }
        } else {
          const validTracks = tracks.filter((t: any) => t.tempo != null && t.energy != null)
          
          if (validTracks.length === 0) {
            result = { data: null }
          } else {
            const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
            
            const tempos = validTracks.map((t: any) => t.tempo).filter(Boolean)
            const energies = validTracks.map((t: any) => t.energy).filter(Boolean)
            
            const lowEnergy = energies.filter((e: number) => e < 0.4).length
            const medEnergy = energies.filter((e: number) => e >= 0.4 && e < 0.7).length
            const highEnergy = energies.filter((e: number) => e >= 0.7).length
            
            const undergroundTracks = tracks.filter((t: any) => (t.popularity || 100) < 40).length
            
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
                undergroundRatio: tracks.length > 0 ? undergroundTracks / tracks.length : 0,
                totalTracks: tracks.length,
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
        // Create taste snapshot based on current library
        console.log(`[music-intelligence] Creating snapshot for user ${userId}`)
        
        const { data: tracks, error: fetchError } = await supabaseAdmin
          .from('music_library')
          .select('tempo, energy, danceability, valence, popularity')
          .eq('user_id', userId)
        
        if (fetchError) throw fetchError
        
        if (!tracks || tracks.length === 0) {
          result = { data: null }
        } else {
          const validTracks = tracks.filter((t: any) => t.tempo != null)
          
          const avgBpm = validTracks.reduce((sum: number, t: any) => sum + (t.tempo || 0), 0) / validTracks.length || 0
          const avgEnergy = validTracks.reduce((sum: number, t: any) => sum + (t.energy || 0), 0) / validTracks.length || 0
          const avgDanceability = validTracks.reduce((sum: number, t: any) => sum + (t.danceability || 0), 0) / validTracks.length || 0
          const avgValence = validTracks.reduce((sum: number, t: any) => sum + (t.valence || 0), 0) / validTracks.length || 0
          
          const undergroundTracks = tracks.filter((t: any) => (t.popularity || 100) < 40).length
          const undergroundRatio = tracks.length > 0 ? undergroundTracks / tracks.length : 0
          
          const today = new Date().toISOString().split('T')[0]
          
          const snapshotData = {
            user_id: userId,
            snapshot_date: today,
            avg_bpm: avgBpm,
            avg_energy: avgEnergy,
            avg_danceability: avgDanceability,
            avg_valence: avgValence,
            underground_ratio: undergroundRatio,
            total_tracks: tracks.length,
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
