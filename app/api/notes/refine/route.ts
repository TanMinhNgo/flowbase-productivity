import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const actions = {
  grammar:
    'Improve grammar and clarity while preserving the author voice and meaning.',
  rephrase:
    'Rephrase naturally while preserving the exact meaning and approximate length.',
  shorter: 'Make the text shorter while retaining its important meaning.',
  longer:
    'Make the text longer with helpful detail while preserving the original meaning.',
  simplify:
    'Use simpler, clearer language without losing the original meaning.',
  tone: 'Rewrite in a warm, professional, confident tone while preserving the meaning.',
} as const;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json(
      { error: 'AI Refine is not configured.' },
      { status: 503 },
    );

  const body = (await request.json()) as Record<string, unknown>;
  const action = body.action as keyof typeof actions;
  const sourceText = typeof body.text === 'string' ? body.text.trim() : '';
  if (!actions[action] || !sourceText || sourceText.length > 6000)
    return NextResponse.json(
      { error: 'Select up to 6,000 characters to refine.' },
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
          'You are Flowbase AI Refine. Return only the rewritten text, with no explanation, quotation marks, Markdown fences, or headings.',
      },
      { role: 'user', content: `${actions[action]}\n\nText:\n${sourceText}` },
    ],
  });
  const text = response.output_text.trim();
  if (!text)
    return NextResponse.json(
      { error: 'AI Refine did not return text.' },
      { status: 502 },
    );
  return NextResponse.json({ text });
}
