// src/app/api/ddf/route.ts
import { NextResponse } from 'next/server';
import { getDdfAccessToken } from '@/lib/ddfAuth';

/**
 * Small type for the JSON response.
 */
type DdfDebugResponse =
  | { ok: true; tokenPreview: string }
  | { ok: false; error: string };

/**
 * GET /api/ddf
 * Simple secure debug endpoint to ensure token generation works in Vercel.
 * Does NOT expose secrets.
 */
export async function GET(): Promise<NextResponse<DdfDebugResponse>> {
  const hasId = typeof process.env.DDF_CLIENT_ID === 'string' && process.env.DDF_CLIENT_ID.length > 0;
  const hasSecret =
    typeof process.env.DDF_CLIENT_SECRET === 'string' && process.env.DDF_CLIENT_SECRET.length > 0;

  if (!hasId || !hasSecret) {
    return NextResponse.json(
      { ok: false, error: 'DDF_CLIENT_ID / DDF_CLIENT_SECRET are not configured' },
      { status: 500 }
    );
  }

  try {
    const token = await getDdfAccessToken();
    return NextResponse.json({
      ok: true,
      tokenPreview: token.slice(0, 12) + '...',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to generate DDF access token';

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
