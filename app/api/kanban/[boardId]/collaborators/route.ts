import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { kanbanBoardCollaborators, kanbanBoards, users } from '@/db/schema';
import { ensureBoardRoom, getLiveblocks } from '@/lib/liveblocks';

async function loadBoard(boardId: number) {
  const [board] = await db.select().from(kanbanBoards).where(eq(kanbanBoards.id, boardId));
  return board;
}

export async function GET(_request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { boardId: boardIdValue } = await params;
  const board = await loadBoard(Number(boardIdValue));
  if (!board) return NextResponse.json({ error: 'Board not found.' }, { status: 404 });

  const [membership] = await db.select().from(kanbanBoardCollaborators).where(and(eq(kanbanBoardCollaborators.boardId, board.id), eq(kanbanBoardCollaborators.clerkId, userId)));
  if (board.clerkId !== userId && !membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const collaborators = await db
    .select({ clerkId: kanbanBoardCollaborators.clerkId, name: users.name, email: users.email, imageUrl: users.imageUrl })
    .from(kanbanBoardCollaborators)
    .leftJoin(users, eq(kanbanBoardCollaborators.clerkId, users.clerkId))
    .where(eq(kanbanBoardCollaborators.boardId, board.id));
  const [owner] = await db.select({ clerkId: users.clerkId, name: users.name, email: users.email, imageUrl: users.imageUrl }).from(users).where(eq(users.clerkId, board.clerkId));
  return NextResponse.json({ owner: owner || { clerkId: board.clerkId, name: 'Board owner', email: null, imageUrl: null }, collaborators, isOwner: board.clerkId === userId });
}

export async function POST(request: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { boardId: boardIdValue } = await params;
  const board = await loadBoard(Number(boardIdValue));
  if (!board) return NextResponse.json({ error: 'Board not found.' }, { status: 404 });
  if (board.clerkId !== userId) return NextResponse.json({ error: 'Only the board owner can invite collaborators.' }, { status: 403 });

  const { email } = (await request.json()) as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return NextResponse.json({ error: 'Enter an email address.' }, { status: 400 });
  const [invitee] = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (!invitee) return NextResponse.json({ error: 'This person needs a Flowbase account before they can be invited.' }, { status: 404 });
  if (invitee.clerkId === userId) return NextResponse.json({ error: 'You already own this board.' }, { status: 400 });

  await db.insert(kanbanBoardCollaborators).values({ boardId: board.id, clerkId: invitee.clerkId }).onConflictDoNothing();
  await ensureBoardRoom(board);
  await getLiveblocks().updateRoom(`flowbase:kanban:${board.id}`, { usersAccesses: { [invitee.clerkId]: ['*:write'] } });
  return NextResponse.json({ collaborator: { clerkId: invitee.clerkId, name: invitee.name, email: invitee.email, imageUrl: invitee.imageUrl } });
}
