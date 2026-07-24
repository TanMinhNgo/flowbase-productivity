import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { spaceCollaborators, users } from '@/db/schema';
import { getAccessibleSpace, validId } from '@/lib/spaces';

export async function GET(_request: Request, { params }: { params: Promise<{ spaceId: string }> }) {
  const { userId } = await auth(); if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const spaceId = validId((await params).spaceId); if (!spaceId) return NextResponse.json({ error: 'Invalid space.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId); if (!space) return NextResponse.json({ error: 'Space not found.' }, { status: 404 });
  const [owner] = await db.select({ clerkId: users.clerkId, name: users.name, email: users.email, imageUrl: users.imageUrl }).from(users).where(eq(users.clerkId, space.clerkId));
  const members = await db.select({ clerkId: users.clerkId, name: users.name, email: users.email, imageUrl: users.imageUrl }).from(spaceCollaborators).leftJoin(users, eq(spaceCollaborators.clerkId, users.clerkId)).where(eq(spaceCollaborators.spaceId, spaceId));
  return NextResponse.json({ owner: owner ?? { clerkId: space.clerkId, name: null, email: null, imageUrl: null }, members, isOwner: space.clerkId === userId });
}

export async function POST(request: Request, { params }: { params: Promise<{ spaceId: string }> }) {
  const { userId } = await auth(); if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const spaceId = validId((await params).spaceId); if (!spaceId) return NextResponse.json({ error: 'Invalid space.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId); if (!space || space.clerkId !== userId) return NextResponse.json({ error: 'Only the owner can invite collaborators.' }, { status: 403 });
  const body = (await request.json()) as { email?: string }; const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Enter an email address.' }, { status: 400 });
  const [invitee] = await db.select().from(users).where(eq(users.email, email));
  if (!invitee) return NextResponse.json({ error: 'This person needs a Flowbase account before they can be invited.' }, { status: 404 });
  if (invitee.clerkId === userId) return NextResponse.json({ error: 'You already own this space.' }, { status: 400 });
  await db.insert(spaceCollaborators).values({ spaceId, clerkId: invitee.clerkId }).onConflictDoNothing();
  return NextResponse.json({ collaborator: { clerkId: invitee.clerkId, name: invitee.name, email: invitee.email, imageUrl: invitee.imageUrl } });
}
