import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { calendarItems, customCategories, kanbanBoards, kanbanTasks, notes } from '@/db/schema';

const scopes = ['calendar', 'task', 'note', 'reminder'] as const;
const colors = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const customItems = await db
    .select()
    .from(customCategories)
    .where(eq(customCategories.clerkId, userId))
    .orderBy(asc(customCategories.scope), asc(customCategories.name));
  const [calendar, noteItems, tasks] = await Promise.all([
    db.select({ category: calendarItems.category, kind: calendarItems.kind }).from(calendarItems).where(eq(calendarItems.clerkId, userId)),
    db.select({ category: notes.category }).from(notes).where(eq(notes.clerkId, userId)),
    db.select({ labels: kanbanTasks.labels }).from(kanbanTasks).innerJoin(kanbanBoards, eq(kanbanTasks.boardId, kanbanBoards.id)).where(eq(kanbanBoards.clerkId, userId)),
  ]);
  const known = new Set(customItems.map((item) => `${item.scope}:${item.name.toLowerCase()}`));
  let syntheticId = -1;
  const sourceItems: Array<(typeof customItems)[number] & { readOnly: boolean }> = [];
  const addSource = (scope: string, name: string, color: string, icon: string) => {
    const normalized = name.trim(); const key = `${scope}:${normalized.toLowerCase()}`;
    if (!normalized || known.has(key)) return; known.add(key);
    sourceItems.push({ id: syntheticId--, clerkId: userId, scope, name: normalized, color, icon, createdAt: new Date(), updatedAt: new Date(), readOnly: true });
  };
  calendar.forEach((item) => addSource(item.kind === 'reminder' ? 'reminder' : 'calendar', item.category, item.kind === 'reminder' ? '#EF806F' : '#5BAE91', item.kind === 'reminder' ? 'Bell' : 'CalendarDays'));
  noteItems.forEach((item) => addSource('note', item.category, '#8B7CF6', 'NotebookPen'));
  tasks.forEach((task) => { try { const labels = JSON.parse(task.labels) as unknown; if (Array.isArray(labels)) labels.filter((label): label is string => typeof label === 'string').forEach((label) => addSource('task', label, '#E6A23C', 'ListTodo')); } catch {} });
  return NextResponse.json({ items: [...customItems.map((item) => ({ ...item, readOnly: false })), ...sourceItems] });
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
