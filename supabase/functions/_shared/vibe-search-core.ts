/**
 * Pure vibe-search handler. Dependencies are injected so tests can mock the
 * gateway, Spotify identity check and rate limiter.
 *
 * Order is enforced: validate input → single-word bypass → verify session →
 * rate limit → model call. Nothing reaches the model before auth + limit pass.
 */

export interface VibeDeps {
  /** Returns an opaque user key for a valid Spotify session, or null. */
  verifyUser: (spotifyToken: string | null) => Promise<string | null>;
  /** Returns true if this user may make another model call now. */
  allow: (userKey: string) => Promise<boolean>;
  /** Calls the model with the query text only; returns raw text or throws {status}. */
  callModel: (query: string) => Promise<string>;
}

export interface VibeResult { status: number; body: Record<string, unknown> }

export const MAX_QUERY_CHARS = 200;
export const VIBE_WINDOW_SECONDS = 600;
export const VIBE_MAX_PER_WINDOW = 20;

export function buildVibeMessages(systemPrompt: string, query: string) {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Now parse this query and return JSON only:\n\nQuery: "${query}"` },
  ];
}

export async function handleVibeSearch(
  input: { query?: unknown; spotifyToken: string | null },
  deps: VibeDeps,
): Promise<VibeResult> {
  const q = typeof input.query === 'string' ? input.query.trim() : '';
  if (!q) return { status: 400, body: { error: 'Query is required' } };
  if (q.length > MAX_QUERY_CHARS) return { status: 400, body: { error: 'Query is too long' } };

  // Single words are almost always titles or artists: never call the model.
  if (q.split(/\s+/).length === 1) return { status: 200, body: { filters: null, skipped: true } };

  let userKey: string | null;
  try { userKey = await deps.verifyUser(input.spotifyToken); }
  catch { return { status: 401, body: { filters: null, error: 'Unable to verify sign-in' } }; }
  if (!userKey) return { status: 401, body: { filters: null, error: 'Sign in to use vibe search' } };

  let allowed = false;
  try { allowed = await deps.allow(userKey); }
  catch { return { status: 503, body: { filters: null, error: 'Search protection unavailable' } }; }
  if (!allowed) {
    return { status: 429, body: { filters: null, error: 'Too many vibe searches. Try again in a few minutes.' } };
  }

  let content: string;
  try {
    content = await deps.callModel(q);
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 400 || status === 401 || status === 402 || status === 403 || status === 404) {
      return { status, body: { filters: null, error: e instanceof Error ? e.message : 'AI expansion unavailable' } };
    }
    if (status === 429) return { status: 429, body: { filters: null, error: 'Rate limited, try again later' } };
    return { status: 200, body: { filters: null, error: 'AI expansion unavailable' } };
  }

  let text = (content || '').trim();
  if (text.startsWith('```')) text = text.replace(/```json\n?|\n?```/g, '');
  try {
    const f = JSON.parse(text);
    if (!f || (!f.vibes && !f.scenes && !f.artistHint && !f.bpmRange && !f.energy)) {
      return { status: 200, body: { filters: null, skipped: true } };
    }
    return { status: 200, body: { filters: f } };
  } catch {
    return { status: 200, body: { filters: null, error: 'Failed to parse AI response' } };
  }
}

/** One-way key so rate-limit rows never store a Spotify account id. */
export async function hashUserKey(id: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`vibe:${id}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
