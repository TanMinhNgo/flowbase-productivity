import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userSettings } from '@/db/schema';

const allowed = {
  theme: ['light', 'dark', 'system'],
  calendarView: ['month', 'week'],
  taskPriority: ['low', 'medium', 'high'],
  aiModel: ['gpt-5.6-luna', 'gpt-5.6-mini', 'gpt-5.6-nano'],
  aiTone: ['balanced', 'friendly', 'professional', 'direct'],
  aiBehavior: ['concise', 'detailed', 'structured'],
} as const;

async function getSettings(clerkId: string) {
  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.clerkId, clerkId));
  if (existing) return existing;
  const [created] = await db
    .insert(userSettings)
    .values({ clerkId })
    .returning();
  return created;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ settings: await getSettings(userId) });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await getSettings(userId);
  const body = (await request.json()) as Record<string, unknown>;
  const updates: Record<string, string | boolean | Date> = {
    updatedAt: new Date(),
  };
  for (const key of Object.keys(allowed) as Array<keyof typeof allowed>) {
    if (key in body && allowed[key].includes(body[key] as never))
      updates[key] = body[key] as string;
  }
  for (const key of [
    'notificationsEnabled',
    'autoSave',
    'aiRefineEnabled',
    'aiAssistantEnabled',
    'aiTemplatesEnabled',
  ]) {
    if (typeof body[key] === 'boolean') updates[key] = body[key] as boolean;
  }
  const [settings] = await db
    .update(userSettings)
    .set(updates)
    .where(eq(userSettings.clerkId, userId))
    .returning();
  return NextResponse.json({ settings });
}
