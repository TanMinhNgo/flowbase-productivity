import { auth } from '@clerk/nextjs/server';
import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { users } from '@/db/schema';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userIds } = (await request.json()) as { userIds?: string[] };
  const ids = Array.isArray(userIds) ? userIds.slice(0, 50) : [];
  if (!ids.length) return NextResponse.json({ users: [] });
  const profiles = await db.select().from(users).where(inArray(users.clerkId, ids));
  const profileById = new Map(profiles.map((profile) => [profile.clerkId, profile]));
  return NextResponse.json({
    users: ids.map((id) => {
      const profile = profileById.get(id);
      return profile ? { name: profile.name || 'Flowbase collaborator', email: profile.email || '', avatar: profile.imageUrl || undefined, color: '#ff7e5f' } : undefined;
    }),
  });
}
