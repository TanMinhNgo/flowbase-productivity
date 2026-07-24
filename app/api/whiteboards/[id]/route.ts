import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { whiteboards } from '@/db/schema';

const colors = ['coral', 'apricot', 'rose', 'violet', 'sky', 'mint'] as const;
const SCENE_LIMIT = 3_000_000;

function whiteboardId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = whiteboardId((await params).id);
  if (!id)
    return NextResponse.json({ error: 'Invalid whiteboard.' }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if ('name' in body) {
    const name =
      typeof body.name === 'string' ? body.name.trim().slice(0, 160) : '';
    if (!name)
      return NextResponse.json(
        { error: 'A whiteboard name is required.' },
        { status: 400 },
      );
    updates.name = name;
  }
  if ('color' in body) {
    if (!colors.includes(body.color as (typeof colors)[number]))
      return NextResponse.json(
        { error: 'Invalid whiteboard color.' },
        { status: 400 },
      );
    updates.color = body.color;
  }
  for (const field of ['elements', 'appState', 'files'] as const) {
    if (field in body) {
      const value = body[field];
      if (typeof value !== 'string' || value.length > SCENE_LIMIT)
        return NextResponse.json(
          { error: 'Invalid whiteboard scene.' },
          { status: 400 },
        );
      updates[field] = value;
    }
  }
  if (Object.keys(updates).length === 1)
    return NextResponse.json(
      { error: 'No changes were supplied.' },
      { status: 400 },
    );

  const [item] = await db
    .update(whiteboards)
    .set(updates)
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkId, userId)))
    .returning();
  if (!item)
    return NextResponse.json(
      { error: 'Whiteboard not found.' },
      { status: 404 },
    );
  return NextResponse.json({ item });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = whiteboardId((await params).id);
  if (!id)
    return NextResponse.json({ error: 'Invalid whiteboard.' }, { status: 400 });
  const [item] = await db
    .delete(whiteboards)
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkId, userId)))
    .returning({ id: whiteboards.id });
  if (!item)
    return NextResponse.json(
      { error: 'Whiteboard not found.' },
      { status: 404 },
    );
  return NextResponse.json({ deletedId: item.id });
}
