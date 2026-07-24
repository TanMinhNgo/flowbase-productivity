import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { spaceCollaborators, spacePages, spaces, users } from '@/db/schema';
import { seedStarterSpaces, SPACE_COLORS } from '@/lib/spaces';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await seedStarterSpaces(userId);
  const owned = await db.select().from(spaces).where(eq(spaces.clerkId, userId));
  const memberships = await db.select({ spaceId: spaceCollaborators.spaceId }).from(spaceCollaborators).where(eq(spaceCollaborators.clerkId, userId));
  const sharedIds = memberships.map((item) => item.spaceId);
  const shared = sharedIds.length ? await db.select().from(spaces).where(inArray(spaces.id, sharedIds)) : [];
  const allSpaces = [...owned, ...shared.filter((space) => space.clerkId !== userId)].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const ids = allSpaces.map((space) => space.id);
  if (!ids.length) return NextResponse.json({ items: [] });
  const [pages, members, profiles] = await Promise.all([
    db.select({ spaceId: spacePages.spaceId, id: spacePages.id }).from(spacePages).where(and(inArray(spacePages.spaceId, ids), isNull(spacePages.archivedAt))),
    db.select().from(spaceCollaborators).where(inArray(spaceCollaborators.spaceId, ids)),
    db.select({ clerkId: users.clerkId, name: users.name, imageUrl: users.imageUrl }).from(users),
  ]);
  const pageCounts = new Map<number, number>();
  pages.forEach((page) => pageCounts.set(page.spaceId, (pageCounts.get(page.spaceId) ?? 0) + 1));
  const profileMap = new Map(profiles.map((profile) => [profile.clerkId, profile]));
  const memberMap = new Map<number, string[]>();
  members.forEach((member) => memberMap.set(member.spaceId, [...(memberMap.get(member.spaceId) ?? []), member.clerkId]));
  return NextResponse.json({ items: allSpaces.map((space) => ({ ...space, pageCount: pageCounts.get(space.id) ?? 0, members: [space.clerkId, ...(memberMap.get(space.id) ?? [])].map((clerkId) => profileMap.get(clerkId) ?? { clerkId, name: null, imageUrl: null }) })) });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 160) : '';
  if (!name) return NextResponse.json({ error: 'A space name is required.' }, { status: 400 });
  const color = SPACE_COLORS.includes(body.color as (typeof SPACE_COLORS)[number]) ? body.color as (typeof SPACE_COLORS)[number] : 'violet';
  const [item] = await db.insert(spaces).values({ clerkId: userId, name, description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '', color }).returning();
  return NextResponse.json({ item }, { status: 201 });
}
