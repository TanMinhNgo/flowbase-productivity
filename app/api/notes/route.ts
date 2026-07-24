import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { notes } from '@/db/schema';

const emptyDocument = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await db
    .select()
    .from(notes)
    .where(and(eq(notes.clerkId, userId), isNull(notes.deletedAt)))
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt));
  const trash = await db
    .select()
    .from(notes)
    .where(and(eq(notes.clerkId, userId), isNotNull(notes.deletedAt)))
    .orderBy(desc(notes.deletedAt));
  return NextResponse.json({ items, trash });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const title =
    typeof body.title === 'string' ? body.title.trim().slice(0, 160) : '';
  const [item] = await db
    .insert(notes)
    .values({
      clerkId: userId,
      title: title || 'Untitled note',
      content: emptyDocument,
    })
    .returning();
  return NextResponse.json({ item }, { status: 201 });
}
