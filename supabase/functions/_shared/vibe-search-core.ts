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

export async function handleVibeSearch(
  input: { query?: unknown; spotifyToken: string | null },
  deps: VibeDeps,
): Promise<VibeResult> {
  const q = typeof input.query === 'string' ? input.query.trim() : '';
  if (!q) return { status: 400, body: { error: 'Query is required' } };
  if (q.length > MAX_QUERY_CHARS) return { status: 400, body: { error: 'Query is too long' } };

  // Single words are almost always titles or artists: never call the model.
  if (q.split(/\s+/).length === 1) return { status: 200, body: { filters: null, skipped: true } };

  const userKey = await deps.verifyUser(input.spotifyToken);
  if (!userKey) return { status: 401, body: { filters: null, error: 'Sign in to use vibe search' } };

  if (!(await deps.allow(userKey))) {
    return { status: 429, body: { filters: null, error: 'Too many vibe searches. Try again in a few minutes.' } };
  }

  let content: string;
  try {
    content = await deps.callModel(q);
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 429) return { status: 429, body: { filters: null, error: 'Rate limited, try again later' } };
    if (status === 402) return { status: 402, body: { filters: null, error: 'AI credits exhausted' } };
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
