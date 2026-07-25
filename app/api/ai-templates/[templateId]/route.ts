import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiTemplates } from '@/db/schema';

const validId = (value: string) =>
  Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
async function owned(templateId: number, clerkId: string) {
  const [item] = await db
    .select()
    .from(aiTemplates)
    .where(
      and(eq(aiTemplates.id, templateId), eq(aiTemplates.clerkId, clerkId)),
    );
  return item;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { userId } = await auth();
  const templateId = validId((await params).templateId);
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const item = templateId ? await owned(templateId, userId) : undefined;
  return item
    ? NextResponse.json({ item })
    : NextResponse.json({ error: 'Template not found.' }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { userId } = await auth();
  const templateId = validId((await params).templateId);
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const item = templateId ? await owned(templateId, userId) : undefined;
  if (!item)
    return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
  const body = (await request.json()) as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if ('runtimeData' in body) {
    if (
      typeof body.runtimeData !== 'string' ||
      body.runtimeData.length > 100000
    )
      return NextResponse.json({ error: 'Invalid app data.' }, { status: 400 });
    updates.runtimeData = body.runtimeData;
  }
  if ('isInSidebar' in body) {
    const next = Boolean(body.isInSidebar);
    if (next && !item.isInSidebar) {
      const [count] = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiTemplates)
        .where(
          and(
            eq(aiTemplates.clerkId, userId),
            eq(aiTemplates.isInSidebar, true),
          ),
        );
      if (Number(count.count) >= 3)
        return NextResponse.json(
          { error: 'You can add up to 3 generated apps to the sidebar.' },
          { status: 409 },
        );
    }
    updates.isInSidebar = next;
  }
  const [updated] = await db
    .update(aiTemplates)
    .set(updates)
    .where(eq(aiTemplates.id, item.id))
    .returning();
  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { userId } = await auth();
  const templateId = validId((await params).templateId);
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const item = templateId ? await owned(templateId, userId) : undefined;
  if (!item)
    return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
  await db.delete(aiTemplates).where(eq(aiTemplates.id, item.id));
  return NextResponse.json({ deletedId: item.id });
}
