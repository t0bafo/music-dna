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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[vibe-search-expand] Expanding query:', query)

    // Skip expansion for very short queries (likely artist/track names)
    const words = query.trim().split(/\s+/)
    if (words.length === 1) {
      console.log('[vibe-search-expand] Query too short, skipping expansion')
      return new Response(
        JSON.stringify({ filters: null, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      console.error('[vibe-search-expand] LOVABLE_API_KEY not configured')
      return new Response(
        JSON.stringify({ filters: null, error: 'AI not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: EXPANSION_PROMPT },
          { role: 'user', content: `Now parse this query and return JSON only:\n\nQuery: "${query}"` }
        ],
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[vibe-search-expand] Rate limited')
        return new Response(
          JSON.stringify({ filters: null, error: 'Rate limited, try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        console.warn('[vibe-search-expand] Payment required')
        return new Response(
          JSON.stringify({ filters: null, error: 'AI credits exhausted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const errorText = await response.text()
      console.error('[vibe-search-expand] AI gateway error:', response.status, errorText)
      return new Response(
        JSON.stringify({ filters: null, error: 'AI expansion failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await response.json()
    const content = aiResponse.choices?.[0]?.message?.content

    if (!content) {
      console.error('[vibe-search-expand] Empty AI response')
      return new Response(
        JSON.stringify({ filters: null, error: 'Empty AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse JSON response (remove any markdown formatting)
    let jsonText = content.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
    }

    try {
      const filters: SearchFilters = JSON.parse(jsonText)

      // Validate response structure
      if (!filters.vibes && !filters.scenes && !filters.artistHint && !filters.bpmRange && !filters.energy) {
        console.warn('[vibe-search-expand] LLM returned empty filters')
        return new Response(
          JSON.stringify({ filters: null, skipped: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[vibe-search-expand] Expanded filters:', filters)

      return new Response(
        JSON.stringify({ filters }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (parseError) {
      console.error('[vibe-search-expand] Failed to parse AI response:', parseError, jsonText)
      return new Response(
        JSON.stringify({ filters: null, error: 'Failed to parse AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('[vibe-search-expand] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
