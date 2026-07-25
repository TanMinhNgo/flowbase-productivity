import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customCategories } from '@/db/schema';

const colors = /^#[0-9a-fA-F]{6}$/;
const whereOwned = (id: number, userId: string) =>
  and(eq(customCategories.id, id), eq(customCategories.clerkId, userId));

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((await params).categoryId);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const body = (await request.json()) as Record<string, unknown>;
  const updates: {
    name?: string;
    color?: string;
    icon?: string;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (typeof body.name === 'string' && body.name.trim())
    updates.name = body.name.trim().slice(0, 50);
  if (typeof body.color === 'string' && colors.test(body.color))
    updates.color = body.color;
  if (typeof body.icon === 'string') updates.icon = body.icon.slice(0, 40);
  const [item] = await db
    .update(customCategories)
    .set(updates)
    .where(whereOwned(id, userId))
    .returning();
  return item
    ? NextResponse.json({ item })
    : NextResponse.json({ error: 'Not found.' }, { status: 404 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((await params).categoryId);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const [item] = await db
    .delete(customCategories)
    .where(whereOwned(id, userId))
    .returning();
  return item
    ? NextResponse.json({ deletedId: id })
    : NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
