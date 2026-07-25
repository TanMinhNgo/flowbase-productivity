import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  assistantActions,
  assistantMessages,
  calendarItems,
  kanbanBoards,
  kanbanColumns,
  notes,
  userSettings,
  whiteboards,
} from '@/db/schema';
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ actionId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((await params).actionId);
  const [action] = await db
    .select()
    .from(assistantActions)
    .where(
      and(eq(assistantActions.id, id), eq(assistantActions.clerkId, userId)),
    );
  if (!action || action.status !== 'pending')
    return NextResponse.json({ error: 'Action unavailable.' }, { status: 404 });
  const body = (await request.json()) as { confirm?: boolean };
  if (!body.confirm) {
    await db
      .update(assistantActions)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(assistantActions.id, id));
    return NextResponse.json({ status: 'cancelled' });
  }
  const payload = JSON.parse(action.payload) as Record<string, unknown>;
  let result = 'Action completed.';
  if (action.type === 'create_calendar') {
    await db
      .insert(calendarItems)
      .values({
        clerkId: userId,
        title: String(payload.title || 'Untitled task'),
        kind: payload.kind === 'reminder' ? 'reminder' : 'task',
        category: String(payload.category || 'work'),
        scheduledDate: String(payload.date),
        scheduledTime: typeof payload.time === 'string' ? payload.time : null,
      });
    result = 'Added to your calendar.';
  } else if (action.type === 'create_note') {
    await db
      .insert(notes)
      .values({
        clerkId: userId,
        title: String(payload.title || 'Untitled note'),
      });
    result = 'Created your note.';
  } else if (action.type === 'create_whiteboard') {
    await db
      .insert(whiteboards)
      .values({
        clerkId: userId,
        name: String(payload.name || 'Untitled whiteboard'),
        color: 'coral',
      });
    result = 'Created your whiteboard.';
  } else if (action.type === 'create_board') {
    const [board] = await db
      .insert(kanbanBoards)
      .values({
        clerkId: userId,
        name: String(payload.name || 'Untitled board'),
        color: 'coral',
      })
      .returning();
    await db.insert(kanbanColumns).values([
      { boardId: board.id, name: 'Todo', position: 0 },
      { boardId: board.id, name: 'In Progress', position: 1 },
      { boardId: board.id, name: 'Done', position: 2 },
    ]);
    result = 'Created your Kanban board.';
  } else if (action.type === 'update_settings') {
    await db
      .update(userSettings)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(userSettings.clerkId, userId));
    result = 'Updated your settings.';
  } else {
    result = 'This action is ready to continue in its workspace.';
  }
  await db
    .update(assistantActions)
    .set({ status: 'completed', result, updatedAt: new Date() })
    .where(eq(assistantActions.id, id));
  await db
    .insert(assistantMessages)
    .values({
      conversationId: action.conversationId,
      role: 'assistant',
      content: result,
    });
  return NextResponse.json({ status: 'completed', result });
}
