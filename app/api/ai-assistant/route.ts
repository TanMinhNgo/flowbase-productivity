import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  assistantActions,
  assistantConversations,
  assistantMessages,
} from '@/db/schema';
import { allowAi } from '@/lib/ai-settings';

type Result = {
  reply: string;
  action?: { type: string; payload: Record<string, unknown>; summary: string };
  clarification?: boolean;
};
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await db
    .select()
    .from(assistantConversations)
    .where(eq(assistantConversations.clerkId, userId))
    .orderBy(desc(assistantConversations.updatedAt));
  return NextResponse.json({ items });
}
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json(
      { error: 'AI Assistant is not configured.' },
      { status: 503 },
    );
  const ai = await allowAi(userId, 'assistant');
  if ('error' in ai)
    return NextResponse.json({ error: ai.error }, { status: 403 });
  const body = (await request.json()) as {
    conversationId?: number;
    content?: string;
  };
  const content = body.content?.trim().slice(0, 5000);
  if (!content)
    return NextResponse.json(
      { error: 'Write a message first.' },
      { status: 400 },
    );
  let conversationId = Number(body.conversationId);
  let conversation;
  if (Number.isInteger(conversationId)) {
    [conversation] = await db
      .select()
      .from(assistantConversations)
      .where(
        and(
          eq(assistantConversations.id, conversationId),
          eq(assistantConversations.clerkId, userId),
        ),
      );
  }
  if (!conversation) {
    const [created] = await db
      .insert(assistantConversations)
      .values({ clerkId: userId, title: content.slice(0, 60) })
      .returning();
    conversation = created;
    conversationId = created.id;
  }
  await db
    .insert(assistantMessages)
    .values({ conversationId, role: 'user', content });
  const history = await db
    .select()
    .from(assistantMessages)
    .where(eq(assistantMessages.conversationId, conversationId))
    .orderBy(desc(assistantMessages.id))
    .limit(12);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcript = history
    .reverse()
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');
  const response = await openai.responses.create({
    model: ai.model,
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    safety_identifier: `flowbase-${userId}`,
    input: [
      {
        role: 'developer',
        content: `Return JSON only: {"reply":"string","clarification":boolean,"action":null|{"type":"create_calendar|create_note|create_board|create_whiteboard|update_settings|generate_template","summary":"string","payload":{}}}. You are Flowbase AI. Ask a clarification when a required detail is missing. For every data-changing request, propose exactly one action; never say it is saved. Calendar requires title and date (YYYY-MM-DD). Board/note/whiteboard require a name. Settings payload may only contain known settings. Tone ${ai.tone}; style ${ai.behavior}.`,
      },
      { role: 'user', content: `Conversation:\n${transcript}` },
    ],
  });
  let result: Result;
  try {
    result = JSON.parse(response.output_text) as Result;
  } catch {
    result = { reply: response.output_text || 'Could you rephrase that?' };
  }
  if (!result.reply) result.reply = 'I can help with that.';
  let action = null;
  if (result.action?.type && result.action.payload) {
    const [created] = await db
      .insert(assistantActions)
      .values({
        clerkId: userId,
        conversationId,
        type: result.action.type,
        payload: JSON.stringify(result.action.payload),
      })
      .returning();
    action = { id: created.id, ...result.action };
  }
  const [message] = await db
    .insert(assistantMessages)
    .values({
      conversationId,
      role: 'assistant',
      content: result.reply,
      actionJson: action ? JSON.stringify(action) : null,
    })
    .returning();
  await db
    .update(assistantConversations)
    .set({ updatedAt: new Date() })
    .where(eq(assistantConversations.id, conversationId));
  return NextResponse.json({ conversationId, message, action });
}
