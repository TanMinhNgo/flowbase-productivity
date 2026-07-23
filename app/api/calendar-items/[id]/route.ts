import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { calendarItems } from '@/db/schema';

function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const categories = ['work', 'personal', 'meeting', 'study', 'health'] as const;
const kinds = ['task', 'reminder'] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  const body = (await request.json()) as Record<string, unknown>;
  if (!Number.isInteger(itemId)) {
    return NextResponse.json(
      { error: 'Invalid calendar item or date.' },
      { status: 400 },
    );
  }

  const updates: {
    title?: string;
    notes?: string | null;
    kind?: string;
    category?: string;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
  } = {};

  if ('scheduledDate' in body) {
    if (body.scheduledDate !== null && !isDateKey(body.scheduledDate))
      return NextResponse.json(
        { error: 'Invalid calendar date.' },
        { status: 400 },
      );
    updates.scheduledDate = body.scheduledDate as string | null;
  }
  if ('title' in body) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > 160)
      return NextResponse.json(
        { error: 'Please provide a valid title.' },
        { status: 400 },
      );
    updates.title = title;
  }
  if ('kind' in body) {
    if (!kinds.includes(body.kind as (typeof kinds)[number]))
      return NextResponse.json(
        { error: 'Invalid item type.' },
        { status: 400 },
      );
    updates.kind = body.kind as string;
  }
  if ('category' in body) {
    if (!categories.includes(body.category as (typeof categories)[number]))
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    updates.category = body.category as string;
  }
  if ('scheduledTime' in body) {
    if (
      body.scheduledTime !== null &&
      (typeof body.scheduledTime !== 'string' ||
        !/^\d{2}:\d{2}$/.test(body.scheduledTime))
    )
      return NextResponse.json(
        { error: 'Invalid calendar time.' },
        { status: 400 },
      );
    updates.scheduledTime = body.scheduledTime as string | null;
  }
  if ('notes' in body)
    updates.notes =
      typeof body.notes === 'string'
        ? body.notes.trim().slice(0, 1000) || null
        : null;
  if (!Object.keys(updates).length)
    return NextResponse.json(
      { error: 'No changes were supplied.' },
      { status: 400 },
    );

  const [item] = await db
    .update(calendarItems)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(calendarItems.id, itemId), eq(calendarItems.clerkId, userId)))
    .returning();

  if (!item)
    return NextResponse.json(
      { error: 'Calendar item not found.' },
      { status: 404 },
    );
  return NextResponse.json({ item });
}
