import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { notes } from '@/db/schema';

const colors = ['coral', 'apricot', 'rose', 'violet', 'sky', 'mint'] as const;

function noteId(value: string) {
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
  const id = noteId((await params).id);
  if (!id)
    return NextResponse.json({ error: 'Invalid note.' }, { status: 400 });
  const body = (await request.json()) as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if ('title' in body) {
    const title =
      typeof body.title === 'string' ? body.title.trim().slice(0, 160) : '';
    if (!title)
      return NextResponse.json(
        { error: 'A note title is required.' },
        { status: 400 },
      );
    updates.title = title;
  }
  if ('content' in body) {
    if (typeof body.content !== 'string' || body.content.length > 250000)
      return NextResponse.json(
        { error: 'Invalid note content.' },
        { status: 400 },
      );
    updates.content = body.content;
    updates.plainText =
      typeof body.plainText === 'string' ? body.plainText.slice(0, 100000) : '';
  }
  if ('color' in body) {
    if (!colors.includes(body.color as (typeof colors)[number]))
      return NextResponse.json(
        { error: 'Invalid note color.' },
        { status: 400 },
      );
    updates.color = body.color;
  }
  if ('isPinned' in body) updates.isPinned = Boolean(body.isPinned);
  if ('deletedAt' in body)
    updates.deletedAt = body.deletedAt ? new Date() : null;
  if ('duplicate' in body && body.duplicate) {
    const [source] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.clerkId, userId)));
    if (!source)
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    const [item] = await db
      .insert(notes)
      .values({
        clerkId: source.clerkId,
        title: `Copy of ${source.title}`,
        content: source.content,
        plainText: source.plainText,
        color: source.color,
        isPinned: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return NextResponse.json({ item }, { status: 201 });
  }
  if (Object.keys(updates).length === 1)
    return NextResponse.json(
      { error: 'No changes were supplied.' },
      { status: 400 },
    );
  const [item] = await db
    .update(notes)
    .set(updates)
    .where(and(eq(notes.id, id), eq(notes.clerkId, userId)))
    .returning();
  if (!item)
    return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = noteId((await params).id);
  if (!id)
    return NextResponse.json({ error: 'Invalid note.' }, { status: 400 });
  const permanent =
    new URL(request.url).searchParams.get('permanent') === 'true';
  if (permanent)
    await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.clerkId, userId)));
  else
    await db
      .update(notes)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.clerkId, userId)));
  return NextResponse.json({ deletedId: id });
}
