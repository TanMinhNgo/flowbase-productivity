import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { aiTemplates } from '@/db/schema';
import { parseTemplateSpec } from '@/lib/ai-templates';

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await db
    .select()
    .from(aiTemplates)
    .where(eq(aiTemplates.clerkId, userId))
    .orderBy(desc(aiTemplates.updatedAt));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json(
      { error: 'AI Template Builder is not configured.' },
      { status: 503 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 1600)
    return NextResponse.json(
      { error: 'Describe the app in up to 1,600 characters.' },
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
          'Return valid JSON only. Design one safe, single-page productivity mini-app. Required shape: {"appName":"string","description":"string","icon":"Flame|WalletCards|CookingPot|BookOpenCheck|ChartNoAxesCombined|ListTodo|CalendarCheck|LayoutTemplate","color":"#RRGGBB","layout":"single-page","sections":[{"id":"string","title":"string","components":[{"id":"string","type":"stats|list|table|form|progress|checklist|buttons|tags|chart","title":"string","fields":[{"key":"string","label":"string","type":"text|number|date|checkbox|select","options":["string"]}],"items":[{}],"value":0,"total":1,"actions":["string"],"tags":["string"]}]}],"actions":["string"],"sampleData":{}}. Use 1-4 sections and 3-12 useful components. No markdown, code, scripts, URLs, or HTML.',
      },
      { role: 'user', content: prompt },
    ],
  });
  let spec;
  try {
    spec = parseTemplateSpec(JSON.parse(response.output_text));
  } catch {
    spec = null;
  }
  if (!spec)
    return NextResponse.json(
      { error: 'AI returned an invalid template. Please try again.' },
      { status: 502 },
    );
  const [item] = await db
    .insert(aiTemplates)
    .values({
      clerkId: userId,
      prompt,
      appName: spec.appName,
      description: spec.description,
      icon: spec.icon,
      color: spec.color,
      layout: spec.layout,
      appJson: JSON.stringify(spec),
      runtimeData: JSON.stringify(spec.sampleData),
    })
    .returning();
  return NextResponse.json({ item }, { status: 201 });
}
