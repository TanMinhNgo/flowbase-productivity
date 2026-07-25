import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { spacePages, spaces, users } from '@/db/schema';
import { getAccessibleSpace, SPACE_COLORS, validId } from '@/lib/spaces';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ spaceId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const spaceId = validId((await params).spaceId);
  if (!spaceId)
    return NextResponse.json({ error: 'Invalid space.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId);
  if (!space)
    return NextResponse.json({ error: 'Space not found.' }, { status: 404 });
  await db
    .update(spaces)
    .set({ lastOpenedAt: new Date() })
    .where(eq(spaces.id, spaceId));
  const pages = await db
    .select()
    .from(spacePages)
    .where(and(eq(spacePages.spaceId, spaceId), isNull(spacePages.archivedAt)))
    .orderBy(desc(spacePages.updatedAt));
  const profiles = await db
    .select({
      clerkId: users.clerkId,
      name: users.name,
      imageUrl: users.imageUrl,
    })
    .from(users);
  const profileMap = new Map(
    profiles.map((profile) => [profile.clerkId, profile]),
  );
  return NextResponse.json({
    space: { ...space, lastOpenedAt: new Date() },
    pages: pages.map((page) => ({
      ...page,
      updatedByUser: profileMap.get(page.updatedBy) ?? {
        clerkId: page.updatedBy,
        name: null,
        imageUrl: null,
      },
    })),
    isOwner: space.clerkId === userId,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const spaceId = validId((await params).spaceId);
  if (!spaceId)
    return NextResponse.json({ error: 'Invalid space.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId);
  if (!space)
    return NextResponse.json({ error: 'Space not found.' }, { status: 404 });
  const body = (await request.json()) as Record<string, unknown>;
  if (body.duplicate) {
    const [copy] = await db
      .insert(spaces)
      .values({
        clerkId: userId,
        name: `Copy of ${space.name}`,
        description: space.description,
        color: space.color,
      })
      .returning();
    const pages = await db
      .select()
      .from(spacePages)
      .where(eq(spacePages.spaceId, space.id));
    if (pages.length)
      await db.insert(spacePages).values(
        pages.map((page) => ({
          spaceId: copy.id,
          title: page.title,
          template: page.template,
          description: page.description,
          content: page.content,
          plainText: page.plainText,
          isFavorite: false,
          createdBy: userId,
          updatedBy: userId,
        })),
      );
    return NextResponse.json({ item: copy }, { status: 201 });
  }
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if ('name' in body) {
    const name =
      typeof body.name === 'string' ? body.name.trim().slice(0, 160) : '';
    if (!name)
      return NextResponse.json(
        { error: 'A space name is required.' },
        { status: 400 },
      );
    updates.name = name;
  }
  if ('description' in body)
    updates.description =
      typeof body.description === 'string'
        ? body.description.trim().slice(0, 500)
        : '';
  if ('color' in body) {
    if (!SPACE_COLORS.includes(body.color as (typeof SPACE_COLORS)[number]))
      return NextResponse.json(
        { error: 'Invalid space color.' },
        { status: 400 },
      );
    updates.color = body.color;
  }
  if ('isFavorite' in body) updates.isFavorite = Boolean(body.isFavorite);
  if ('archived' in body)
    updates.archivedAt = body.archived ? new Date() : null;
  const [item] = await db
    .update(spaces)
    .set(updates)
    .where(eq(spaces.id, spaceId))
    .returning();
  return NextResponse.json({ item });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ spaceId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const spaceId = validId((await params).spaceId);
  if (!spaceId)
    return NextResponse.json({ error: 'Invalid space.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId);
  if (!space || space.clerkId !== userId)
    return NextResponse.json(
      { error: 'Only the owner can delete this space.' },
      { status: 403 },
    );
  await db.delete(spacePages).where(eq(spacePages.spaceId, spaceId));
  await db.delete(spaces).where(eq(spaces.id, spaceId));
  return NextResponse.json({ deletedId: spaceId });
}
