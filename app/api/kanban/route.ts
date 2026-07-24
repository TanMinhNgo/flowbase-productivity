import { auth } from '@clerk/nextjs/server';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import {
  calendarItems,
  kanbanBoardCollaborators,
  kanbanBoards,
  kanbanColumns,
  kanbanTasks,
} from '@/db/schema';

const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

async function accessibleBoard(boardId: number, clerkId: string) {
  const [board] = await db
    .select()
    .from(kanbanBoards)
    .where(
      and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.clerkId, clerkId)),
    );
  if (board?.clerkId === clerkId) return board;
  const [membership] = await db
    .select({ id: kanbanBoardCollaborators.id })
    .from(kanbanBoardCollaborators)
    .where(
      and(
        eq(kanbanBoardCollaborators.boardId, boardId),
        eq(kanbanBoardCollaborators.clerkId, clerkId),
      ),
    );
  return membership ? board : undefined;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return fail('Unauthorized', 401);

  const ownedBoards = await db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.clerkId, userId))
    .orderBy(desc(kanbanBoards.updatedAt));
  const memberships = await db
    .select({ boardId: kanbanBoardCollaborators.boardId })
    .from(kanbanBoardCollaborators)
    .where(eq(kanbanBoardCollaborators.clerkId, userId));
  const sharedIds = memberships.map((membership) => membership.boardId);
  const sharedBoards = sharedIds.length
    ? await db.select().from(kanbanBoards).where(inArray(kanbanBoards.id, sharedIds))
    : [];
  const boards = [...ownedBoards, ...sharedBoards.filter((board) => board.clerkId !== userId)].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const boardIds = boards.map((board) => board.id);
  if (!boardIds.length)
    return NextResponse.json({ boards, columns: [], tasks: [] });

  const [columns, tasks] = await Promise.all([
    db
      .select()
      .from(kanbanColumns)
      .where(inArray(kanbanColumns.boardId, boardIds))
      .orderBy(asc(kanbanColumns.position)),
    db
      .select()
      .from(kanbanTasks)
      .where(inArray(kanbanTasks.boardId, boardIds))
      .orderBy(asc(kanbanTasks.position)),
  ]);
  return NextResponse.json({ boards, columns, tasks });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return fail('Unauthorized', 401);
  const body = await request.json();
  const { action } = body as { action: string };

  if (action === 'createBoard') {
    const name = String(body.name || '').trim();
    if (!name) return fail('A board name is required.');
    const [board] = await db
      .insert(kanbanBoards)
      .values({ clerkId: userId, name, color: body.color || 'coral' })
      .returning();
    const columns = await db
      .insert(kanbanColumns)
      .values([
        { boardId: board.id, name: 'Todo', position: 0 },
        { boardId: board.id, name: 'In Progress', position: 1 },
        { boardId: board.id, name: 'In Review', position: 2 },
        { boardId: board.id, name: 'Done', position: 3 },
      ])
      .returning();
    return NextResponse.json({ board, columns });
  }

  const boardId = Number(body.boardId);
  if (!Number.isInteger(boardId) || !(await accessibleBoard(boardId, userId)))
    return fail('Board not found.', 404);

  if (action === 'createColumn') {
    const name = String(body.name || '').trim();
    if (!name) return fail('A column name is required.');
    const existing = await db
      .select({ id: kanbanColumns.id })
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId));
    if (existing.length >= 5)
      return fail('Boards can have up to five columns.');
    const [column] = await db
      .insert(kanbanColumns)
      .values({ boardId, name, position: existing.length })
      .returning();
    return NextResponse.json({ column });
  }

  const columnId = Number(body.columnId);
  const [column] = await db
    .select()
    .from(kanbanColumns)
    .where(
      and(eq(kanbanColumns.id, columnId), eq(kanbanColumns.boardId, boardId)),
    );
  if (action !== 'deleteTask' && action !== 'updateTask' && !column)
    return fail('Column not found.', 404);

  if (action === 'updateColumn') {
    const name = String(body.name || '').trim();
    if (!name) return fail('A column name is required.');
    const [updated] = await db
      .update(kanbanColumns)
      .set({ name })
      .where(eq(kanbanColumns.id, columnId))
      .returning();
    return NextResponse.json({ column: updated });
  }

  if (action === 'deleteColumn') {
    const columns = await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId))
      .orderBy(asc(kanbanColumns.position));
    const fallback = columns.find((item) => item.id !== columnId);
    if (!fallback) return fail('A board must keep at least one column.');
    await db
      .update(kanbanTasks)
      .set({ columnId: fallback.id })
      .where(eq(kanbanTasks.columnId, columnId));
    await db.delete(kanbanColumns).where(eq(kanbanColumns.id, columnId));
    return NextResponse.json({ deletedId: columnId, fallbackId: fallback.id });
  }

  if (action === 'createTask') {
    const title = String(body.title || '').trim();
    if (!title) return fail('A task title is required.');
    const currentTasks = await db
      .select({ id: kanbanTasks.id })
      .from(kanbanTasks)
      .where(eq(kanbanTasks.columnId, columnId));
    let calendarItemId: number | null = null;
    if (body.syncCalendar) {
      const [calendarItem] = await db
        .insert(calendarItems)
        .values({
          clerkId: userId,
          title,
          notes: body.description || null,
          kind: 'task',
          category: 'Kanban',
          scheduledDate: body.dueDate || null,
        })
        .returning();
      calendarItemId = calendarItem.id;
    }
    const [task] = await db
      .insert(kanbanTasks)
      .values({
        boardId,
        columnId,
        title,
        description: body.description || null,
        dueDate: body.dueDate || null,
        priority: body.priority || 'medium',
        labels: JSON.stringify(body.labels || []),
        syncCalendar: Boolean(body.syncCalendar),
        linkedToNotes: Boolean(body.linkedToNotes),
        calendarItemId,
        position: currentTasks.length,
      })
      .returning();
    return NextResponse.json({ task });
  }

  const taskId = Number(body.taskId);
  const [task] = await db
    .select()
    .from(kanbanTasks)
    .where(and(eq(kanbanTasks.id, taskId), eq(kanbanTasks.boardId, boardId)));
  if (!task) return fail('Task not found.', 404);

  if (action === 'updateTask') {
    const title = String(body.title || '').trim();
    if (!title) return fail('A task title is required.');
    const [updated] = await db
      .update(kanbanTasks)
      .set({
        title,
        description: body.description || null,
        dueDate: body.dueDate || null,
        priority: body.priority || 'medium',
        labels: JSON.stringify(body.labels || []),
        linkedToNotes: Boolean(body.linkedToNotes),
        updatedAt: new Date(),
      })
      .where(eq(kanbanTasks.id, taskId))
      .returning();
    if (task.calendarItemId)
      await db
        .update(calendarItems)
        .set({
          title,
          notes: body.description || null,
          scheduledDate: body.dueDate || null,
          updatedAt: new Date(),
        })
        .where(eq(calendarItems.id, task.calendarItemId));
    return NextResponse.json({ task: updated });
  }

  if (action === 'moveTask') {
    const targetColumnId = Number(body.targetColumnId);
    const [target] = await db
      .select()
      .from(kanbanColumns)
      .where(
        and(
          eq(kanbanColumns.id, targetColumnId),
          eq(kanbanColumns.boardId, boardId),
        ),
      );
    if (!target) return fail('Destination column not found.');
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(kanbanTasks)
      .where(eq(kanbanTasks.columnId, targetColumnId));
    const [updated] = await db
      .update(kanbanTasks)
      .set({
        columnId: targetColumnId,
        position: Number(count),
        updatedAt: new Date(),
      })
      .where(eq(kanbanTasks.id, taskId))
      .returning();
    return NextResponse.json({ task: updated });
  }

  if (action === 'deleteTask') {
    await db.delete(kanbanTasks).where(eq(kanbanTasks.id, taskId));
    return NextResponse.json({ deletedId: taskId });
  }

  return fail('Unknown action.');
}
