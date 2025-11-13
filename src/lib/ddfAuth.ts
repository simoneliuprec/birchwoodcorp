// src/lib/ddfAuth.ts
/**
 * CREA DDF OAuth (client_credentials)
 * - Auth: HTTP Basic (client_id:client_secret)
 * - Body: grant_type=client_credentials&scope=DDFApi_Read
 * - Caches token until ~60s before expiry
 */

type TokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
  scope?: string;
};

const IDENTITY_URL =
  process.env.MLS_DDF_AUTH_URL ?? // keep your old var name as fallback
  'https://identity.crea.ca/connect/token';

const GRANT = (process.env.DDF_AUTH_GRANT ?? 'client_credentials').toLowerCase();
if (GRANT !== 'client_credentials') {
  throw new Error(
    `DDF_AUTH_GRANT must be "client_credentials". Got "${process.env.DDF_AUTH_GRANT}"`
  );
}

const CLIENT_ID = process.env.DDF_CLIENT_ID;
const CLIENT_SECRET = process.env.DDF_CLIENT_SECRET;
const SCOPE = process.env.DDF_SCOPE ?? 'DDFApi_Read';

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Missing DDF_CLIENT_ID / DDF_CLIENT_SECRET environment variables');
}

let cached: { token: string; exp: number } | null = null;
const nowSec = () => Math.floor(Date.now() / 1000);

// Small helper that works in Node and (if ever needed) edge runtimes
function toBase64(s: string) {
  if (typeof Buffer !== 'undefined') return Buffer.from(s).toString('base64');
  // very safe fallback for typical ASCII client_id/secret
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return btoa(s);
}

async function requestToken(): Promise<{ token: string; exp: number }> {
  const basic = toBase64(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: SCOPE,
  });

  const res = await fetch(IDENTITY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DDF token fetch ${res.status}: ${text}`);
  }

  const json = (await res.json()) as TokenResponse;
  const ttl = Number(json.expires_in ?? 3600);
  return { token: json.access_token, exp: nowSec() + ttl };
}

/** Returns a valid Bearer token; caches until ~60s before expiry. */
export async function getDdfAccessToken(): Promise<string> {
  if (cached && cached.exp - nowSec() > 60) return cached.token;
  cached = await requestToken();
  return cached.token;
}

/** Optional: for diagnostics (don’t use in production handlers). */
export async function getRawTokenResponse(): Promise<TokenResponse> {
  const basic = toBase64(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: SCOPE,
  });
  const res = await fetch(IDENTITY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DDF token fetch ${res.status}: ${text}`);
  }
  return (await res.json()) as TokenResponse;
}
