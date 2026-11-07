/**
 * Post-sign-in return destination.
 * Only same-origin, in-app paths are accepted; anything else falls back to Crates.
 */
export const DEFAULT_SIGNED_IN_PATH = '/crates';
const KEY = 'music_dna_return_to';
const BLOCKED_PREFIXES = ['/callback', '/sample'];

export function sanitizeReturnTo(path: unknown): string | null {
  if (typeof path !== 'string') return null;
  const p = path.trim();
  if (!p.startsWith('/') || p.startsWith('//') || p.includes('\\')) return null;
  if (/[\u0000-\u001f]/.test(p)) return null;
  if (p === '/' || p === '/dashboard') return null;
  if (BLOCKED_PREFIXES.some((b) => p === b || p.startsWith(`${b}/`) || p.startsWith(`${b}?`))) return null;
  return p;
}

export function rememberReturnTo(path: string): void {
  const safe = sanitizeReturnTo(path);
  try {
    if (safe) sessionStorage.setItem(KEY, safe);
  } catch {
    /* storage unavailable */
  }
}

export function consumeReturnTo(): string {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  return sanitizeReturnTo(stored) ?? DEFAULT_SIGNED_IN_PATH;
}

/** Remember where a signed-out visitor was, then send them to the landing page. */
export function redirectToLanding(navigate: (to: string, opts?: { replace?: boolean }) => void): void {
  rememberReturnTo(window.location.pathname + window.location.search);
  navigate('/', { replace: true });
}
