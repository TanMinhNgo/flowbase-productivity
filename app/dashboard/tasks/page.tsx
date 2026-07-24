import { auth } from '@clerk/nextjs/server';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { KanbanWorkspace } from '@/components/kanban/kanban-workspace';
import { db } from '@/db';
import { kanbanBoardCollaborators, kanbanBoards, kanbanColumns, kanbanTasks } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

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
  const boards = [
    ...ownedBoards,
    ...sharedBoards.filter((board) => board.clerkId !== userId),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const boardIds = boards.map((board) => board.id);
  const [columns, tasks] = boardIds.length
    ? await Promise.all([
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
      ])
    : [[], []];

  return (
    <KanbanWorkspace
      initialBoards={boards}
      initialColumns={columns}
      initialTasks={tasks}
    />
  );
}
