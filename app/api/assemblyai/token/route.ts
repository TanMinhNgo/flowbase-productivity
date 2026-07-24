import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const TOKEN_URL = new URL('https://streaming.assemblyai.com/v3/token');
TOKEN_URL.searchParams.set('expires_in_seconds', '60');
TOKEN_URL.searchParams.set('max_session_duration_seconds', '3600');

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.ASSEMBLYAI_API_KEY)
    return NextResponse.json(
      { error: 'Speech-to-text is not configured.' },
      { status: 503 },
    );

  const response = await fetch(TOKEN_URL, {
    headers: { Authorization: process.env.ASSEMBLYAI_API_KEY },
    cache: 'no-store',
  });
  const body = (await response.json()) as {
    token?: string;
    expires_in_seconds?: number;
    error?: string;
  };
  if (!response.ok || !body.token)
    return NextResponse.json(
      { error: body.error ?? 'Could not start speech-to-text.' },
      { status: response.status || 502 },
    );

  return NextResponse.json({
    token: body.token,
    expiresInSeconds: body.expires_in_seconds ?? 60,
  });
}
