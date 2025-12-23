import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-spotify-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Spotify token to prevent unauthorized access
    const spotifyToken = req.headers.get('x-spotify-token');
    if (!spotifyToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify Spotify token by fetching user profile
    const spotifyResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${spotifyToken}` }
    });

    if (!spotifyResponse.ok) {
      console.error('Spotify token validation failed:', spotifyResponse.status);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const spotifyUser = await spotifyResponse.json();
    console.log('Authenticated request from user:', spotifyUser.id);

    const { playlistData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      name,
      trackCount,
      flowScore,
      appealScore,
      distribution,
      bpmIssues,
      undergroundGems,
      popularTracks
    } = playlistData;

    const prompt = `You are an expert music curator and Spotify algorithm specialist. Analyze this playlist and provide specific, actionable recommendations.

PLAYLIST DATA:
- Name: ${name}
- Tracks: ${trackCount}
- Flow Score: ${flowScore}/100
- Appeal Score: ${appealScore}/100

FLOW ISSUES:
- Sharp BPM jumps: ${bpmIssues?.length || 0}
- Most jarring transitions: ${bpmIssues?.slice(0, 3).map((issue: any) => 
    `Track ${issue.position}: "${issue.fromTrack}" (${issue.fromBPM} BPM) → "${issue.toTrack}" (${issue.toBPM} BPM)`
  ).join(', ') || 'None'}

APPEAL BREAKDOWN:
- Mainstream Hits (80-100): ${distribution?.mainstream || 0}%
- Popular (60-79): ${distribution?.popular || 0}%
- Mid-Tier (40-59): ${distribution?.midTier || 0}%
- Underground (<40): ${distribution?.underground || 0}%

NOTABLE TRACKS:
- Highest popularity: "${popularTracks?.[0]?.name || 'N/A'}" (${popularTracks?.[0]?.popularity || 0})
- Underground gems: ${undergroundGems?.slice(0, 5).map((t: any) => t.name).join(', ') || 'None'}

Provide 3-4 specific recommendations covering:
1. Critical flow fixes (mention specific track repositioning if needed)
2. Appeal strategy (should they add mainstream tracks or stay underground?)
3. Track placement optimization (which tracks should be in top 10)
4. Growth potential (what's holding this playlist back from getting featured?)

Be direct and specific. Reference actual track names and positions when available. Keep it under 200 words. Use markdown formatting with **bold** for section headers.`;

    console.log("Calling Lovable AI for user:", spotifyUser.id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert music curator and Spotify algorithm specialist. Provide concise, actionable playlist optimization advice." },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate insights. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || "Unable to generate insights.";

    console.log("AI insights generated successfully for user:", spotifyUser.id);

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in playlist-ai-coach:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
