import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchFilters {
  vibes: string[];
  scenes: string[];
  tempo?: 'slow' | 'midtempo' | 'uptempo' | 'fast';
  energy?: 'low' | 'medium' | 'high';
  bpmRange?: [number, number];
  exclude?: string[];
  artistHint?: string;
  trackHint?: string;
}

const EXPANSION_PROMPT = `You are a music search assistant for an African diaspora music curation app. Users search their personal music libraries using natural language.

Given a search query, extract structured filters that will help find matching tracks.

**Available filter types:**

**Vibes** (mood/feeling):
- late-night, night, midnight, dawn, morning, afternoon, evening
- chill, calm, relax, smooth, mellow, soft
- energy, hype, upbeat, energetic, intense, workout, gym
- warm, cozy, intimate, romantic
- moody, melancholy, sad, introspective
- happy, joyful, uplifting, positive
- dark, brooding, mysterious
- nostalgic, throwback

**Scenes** (genre/style):
- afrobeats, amapiano, alte, afro-fusion, afro-house
- rnb, soul, hip-hop, rap, trap
- dancehall, reggae, soca
- electronic, house, techno
- pop, indie
- traditional, highlife, juju

**Tempo**:
- slow (< 90 BPM)
- midtempo (90-120 BPM)
- uptempo (120-140 BPM)
- fast (> 140 BPM)

**Energy**:
- low (0-0.4)
- medium (0.4-0.7)
- high (0.7-1.0)

**Special keywords:**
- "underground" / "deep cuts" → popularity < 50
- "popular" / "hits" → popularity > 70
- "new" / "recent" → last 2 years
- "classic" / "throwback" → older

**Your task:**
1. Parse the query for vibes, scenes, tempo, energy
2. Extract any artist or track name hints
3. Identify what to exclude
4. Return ONLY valid JSON (no explanation, no markdown)

**Return format:**
{
  "vibes": ["vibe1", "vibe2"],
  "scenes": ["scene1", "scene2"],
  "tempo": "midtempo" | null,
  "energy": "low" | "medium" | "high" | null,
  "bpmRange": [min, max] | null,
  "exclude": ["keyword1"] | null,
  "artistHint": "artist name" | null,
  "trackHint": "track name" | null
}

**Examples:**

Query: "Lagos night drive"
Response: {"vibes": ["late-night", "smooth", "calm", "moody"], "scenes": ["afrobeats", "afro-fusion", "alte"], "tempo": "midtempo", "energy": "low"}

Query: "Sunday morning cooking soft life"
Response: {"vibes": ["morning", "soft", "warm", "chill", "uplifting"], "scenes": ["afrobeats", "rnb", "soul"], "tempo": "midtempo", "energy": "medium"}

Query: "underground amapiano bangers"
Response: {"vibes": ["energy", "hype"], "scenes": ["amapiano"], "energy": "high", "exclude": ["mainstream"]}

Query: "burna boy night"
Response: {"vibes": ["late-night", "smooth"], "scenes": ["afrobeats"], "artistHint": "burna boy"}

Query: "workout energy"
Response: {"vibes": ["energy", "hype", "intense", "workout"], "tempo": "fast", "energy": "high", "bpmRange": [130, 180]}

Query: "songs for the gym"
Response: {"vibes": ["energy", "hype", "intense", "workout", "gym"], "tempo": "fast", "energy": "high", "bpmRange": [130, 180]}`;

import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleVibeSearch, hashUserKey } from '../_shared/vibe-search-core.ts'

const WINDOW_SECONDS = 600
const MAX_PER_WINDOW = 20

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  let payload: { query?: unknown } = {}
  try { payload = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const result = await handleVibeSearch(
    { query: payload.query, spotifyToken: req.headers.get('x-spotify-token') },
    {
      verifyUser: async (token) => {
        if (!token) return null
        const r = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
        if (!r.ok) return null
        const me = await r.json()
        return me?.id ? await hashUserKey(me.id) : null
      },
      allow: async (userKey) => {
        const { data, error } = await admin.rpc('ai_rate_limit_hit', { _user_key: userKey, _window_seconds: WINDOW_SECONDS, _max: MAX_PER_WINDOW })
        if (error) { console.error('[vibe-search-expand] rate limit check failed:', error.code); return false }
        return data === true
      },
      callModel: async (query) => {
        const key = Deno.env.get('LOVABLE_API_KEY')
        if (!key) throw { status: 500 }
        const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: EXPANSION_PROMPT },
              { role: 'user', content: `Now parse this query and return JSON only:\n\nQuery: "${query}"` },
            ],
          }),
        })
        if (!r.ok) { console.error('[vibe-search-expand] gateway status', r.status); throw { status: r.status } }
        const data = await r.json()
        return data.choices?.[0]?.message?.content ?? ''
      },
    },
  )
  return json(result.status, result.body)
})
