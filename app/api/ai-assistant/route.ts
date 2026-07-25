import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

type Message = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json(
      { error: 'AI Assistant is not configured.' },
      { status: 503 },
    );

  const body = (await request.json()) as { messages?: unknown };
  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (message): message is Message =>
            Boolean(message) &&
            typeof message === 'object' &&
            ((message as Message).role === 'user' ||
              (message as Message).role === 'assistant') &&
            typeof (message as Message).content === 'string',
        )
        .map((message) => ({
          ...message,
          content: message.content.trim().slice(0, 5000),
        }))
        .filter((message) => message.content)
        .slice(-12)
    : [];

  if (!messages.length || messages.at(-1)?.role !== 'user')
    return NextResponse.json(
      { error: 'Send a message to Flowbase AI.' },
      { status: 400 },
    );

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: 'gpt-5.6-luna',
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    safety_identifier: `flowbase-${userId}`,
    input: [
      {
        role: 'developer',
        content:
          'You are Flowbase AI, a concise and encouraging productivity copilot. Help users plan work, break down tasks, draft notes, and decide next actions. Use readable Markdown with short headings and bullets when it improves clarity. Do not claim you created or changed app data unless the user explicitly asks for a draft they can copy.',
      },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ],
  });

  const text = response.output_text.trim();
  if (!text)
    return NextResponse.json(
      { error: 'Flowbase AI did not return a response.' },
      { status: 502 },
    );

  return NextResponse.json({ text });
}
