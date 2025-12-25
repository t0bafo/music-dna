// Spotify OAuth PKCE utilities
export const SPOTIFY_CLIENT_ID = 'a0c70af1576b40bbb8d899ebdf9b8e08';
export const SPOTIFY_SCOPES = 'user-read-private user-read-email user-top-read user-library-read playlist-read-private playlist-modify-public playlist-modify-private';

export const getRedirectUri = () => {
  return `${window.location.origin}/callback`;
};

export const generateRandomString = (length: number): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

export const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

export const base64encode = (input: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const initiateSpotifyLogin = async (): Promise<void> => {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  sessionStorage.setItem('code_verifier', codeVerifier);

  const redirectUri = getRedirectUri();
  
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'true', // Force consent screen for all users
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  
  // Debug logging for OAuth troubleshooting
  console.log('🔐 Spotify OAuth Debug:', {
    redirectUri,
    origin: window.location.origin,
    fullAuthUrl: authUrl,
    clientId: SPOTIFY_CLIENT_ID,
  });

  window.location.href = authUrl;
};

export const exchangeCodeForTokens = async (code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> => {
  const codeVerifier = sessionStorage.getItem('code_verifier');
  
  if (!codeVerifier) {
    console.error('No code verifier found');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: getRedirectUri(),
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange failed:', errorData);
      return null;
    }

    const data = await response.json();
    sessionStorage.removeItem('code_verifier');
    return data;
  } catch (error) {
    console.error('Token exchange error:', error);
    return null;
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
} | null> => {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
};

export const getStoredTokens = (): { accessToken: string | null; refreshToken: string | null; expiresAt: number | null } => {
  return {
    accessToken: localStorage.getItem('spotify_access_token'),
    refreshToken: localStorage.getItem('spotify_refresh_token'),
    expiresAt: localStorage.getItem('spotify_expires_at') ? parseInt(localStorage.getItem('spotify_expires_at')!) : null,
  };
};

export const storeTokens = (
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  options?: { notify?: boolean }
): void => {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem('spotify_access_token', accessToken);
  localStorage.setItem('spotify_refresh_token', refreshToken);
  localStorage.setItem('spotify_expires_at', expiresAt.toString());

  // Notify the app that auth tokens changed (Callback/login, logout, etc.)
  if (options?.notify !== false) {
    window.dispatchEvent(new Event('spotify-auth-changed'));
  }
};

export const clearTokens = (options?: { notify?: boolean }): void => {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_expires_at');
  sessionStorage.removeItem('code_verifier');

  if (options?.notify !== false) {
    window.dispatchEvent(new Event('spotify-auth-changed'));
  }
};

export const isTokenExpired = (): boolean => {
  const expiresAt = localStorage.getItem('spotify_expires_at');
  if (!expiresAt) return true;
  return Date.now() >= parseInt(expiresAt) - 60000; // 1 minute buffer
};
