import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.ASSEMBLYAI_API_KEY || !process.env.ASSEMBLYAI_VOICE_AGENT_ID)
    return NextResponse.json(
      {
        error:
          'Voice Agent is not configured. Add ASSEMBLYAI_VOICE_AGENT_ID on the server.',
      },
      { status: 503 },
    );
  const url = new URL('https://agents.assemblyai.com/v1/token');
  url.searchParams.set('expires_in_seconds', '120');
  url.searchParams.set('max_session_duration_seconds', '900');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.ASSEMBLYAI_API_KEY}` },
    cache: 'no-store',
  });
  const data = (await response.json()) as { token?: string; error?: string };
  if (!response.ok || !data.token)
    return NextResponse.json(
      { error: data.error ?? 'Could not mint voice token.' },
      { status: response.status || 502 },
    );
  return NextResponse.json({
    token: data.token,
    agentId: process.env.ASSEMBLYAI_VOICE_AGENT_ID,
  });
}
