import { auth } from "@clerk/nextjs/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { KanbanWorkspace } from "@/components/kanban/kanban-workspace";
import { db } from "@/db";
import { kanbanBoards, kanbanColumns, kanbanTasks } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const boards = await db.select().from(kanbanBoards).where(eq(kanbanBoards.clerkId, userId)).orderBy(desc(kanbanBoards.updatedAt));
  const boardIds = boards.map((board) => board.id);
  const [columns, tasks] = boardIds.length ? await Promise.all([
    db.select().from(kanbanColumns).where(inArray(kanbanColumns.boardId, boardIds)).orderBy(asc(kanbanColumns.position)),
    db.select().from(kanbanTasks).where(inArray(kanbanTasks.boardId, boardIds)).orderBy(asc(kanbanTasks.position)),
  ]) : [[], []];

  return <KanbanWorkspace initialBoards={boards} initialColumns={columns} initialTasks={tasks} />;
}
