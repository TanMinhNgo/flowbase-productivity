import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { whiteboards } from '@/db/schema';

const colors = ['coral', 'apricot', 'rose', 'violet', 'sky', 'mint'] as const;

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.clerkId, userId))
    .orderBy(desc(whiteboards.updatedAt));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const name =
    typeof body.name === 'string' ? body.name.trim().slice(0, 160) : '';
  const color = colors.includes(body.color as (typeof colors)[number])
    ? (body.color as (typeof colors)[number])
    : 'coral';
  const [item] = await db
    .insert(whiteboards)
    .values({ clerkId: userId, name: name || 'Untitled whiteboard', color })
    .returning();
  return NextResponse.json({ item }, { status: 201 });
}
