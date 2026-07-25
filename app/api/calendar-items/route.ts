import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { calendarItems, customCategories } from '@/db/schema';

const categories = ['work', 'personal', 'meeting', 'study', 'health'] as const;
const kinds = ['task', 'reminder'] as const;

function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await db
    .select()
    .from(calendarItems)
    .where(eq(calendarItems.clerkId, userId));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const kind = body.kind;
  const category = body.category;
  const scheduledDate = body.scheduledDate;
  const scheduledTime = body.scheduledTime;

  const categoryAllowed =
    categories.includes(category as (typeof categories)[number]) ||
    Boolean(
      typeof category === 'string' &&
      (
        await db
          .select({ id: customCategories.id })
          .from(customCategories)
          .where(
            and(
              eq(customCategories.clerkId, userId),
              eq(customCategories.name, category),
            ),
          )
      )[0],
    );

  if (
    !title ||
    title.length > 160 ||
    !kinds.includes(kind as (typeof kinds)[number]) ||
    !categoryAllowed ||
    (scheduledDate !== null && !isDateKey(scheduledDate)) ||
    (scheduledTime !== null &&
      (typeof scheduledTime !== 'string' ||
        !/^\d{2}:\d{2}$/.test(scheduledTime)))
  ) {
    return NextResponse.json(
      { error: 'Please provide a valid title, type, category, and schedule.' },
      { status: 400 },
    );
  }

  const [item] = await db
    .insert(calendarItems)
    .values({
      clerkId: userId,
      title,
      notes:
        typeof body.notes === 'string'
          ? body.notes.trim().slice(0, 1000) || null
          : null,
      kind: kind as string,
      category: category as string,
      scheduledDate: scheduledDate as string | null,
      scheduledTime: scheduledTime as string | null,
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ item }, { status: 201 });
}
