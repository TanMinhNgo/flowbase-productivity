import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customCategories } from '@/db/schema';

const scopes = ['calendar', 'task', 'note', 'reminder'] as const;
const colors = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await db
    .select()
    .from(customCategories)
    .where(eq(customCategories.clerkId, userId))
    .orderBy(asc(customCategories.scope), asc(customCategories.name));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const name =
    typeof body.name === 'string' ? body.name.trim().slice(0, 50) : '';
  const scope = body.scope as string;
  const color = typeof body.color === 'string' ? body.color : '#7c5ce0';
  const icon = typeof body.icon === 'string' ? body.icon.slice(0, 40) : 'Tag';
  if (
    !name ||
    !scopes.includes(scope as (typeof scopes)[number]) ||
    !colors.test(color)
  )
    return NextResponse.json(
      { error: 'Provide a valid category.' },
      { status: 400 },
    );
  try {
    const [item] = await db
      .insert(customCategories)
      .values({ clerkId: userId, name, scope, color, icon })
      .returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'That category already exists.' },
      { status: 409 },
    );
  }
}
