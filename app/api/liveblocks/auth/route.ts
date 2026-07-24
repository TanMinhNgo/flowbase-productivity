import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { kanbanBoardCollaborators, kanbanBoards } from '@/db/schema';
import { ensureBoardRoom, getLiveblocks } from '@/lib/liveblocks';
import type {} from '@/liveblocks.types';

function boardIdFromRoom(roomId: unknown) {
  const match =
    typeof roomId === 'string' && /^flowbase:kanban:(\d+)$/.exec(roomId);
  return match ? Number(match[1]) : null;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { room } = (await request.json()) as { room?: string };
    const boardId = boardIdFromRoom(room);
    if (!boardId)
      return NextResponse.json({ error: 'Invalid room.' }, { status: 400 });

    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(eq(kanbanBoards.id, boardId));
    if (!board)
      return NextResponse.json({ error: 'Board not found.' }, { status: 404 });

    const [membership] = await db
      .select({ id: kanbanBoardCollaborators.id })
      .from(kanbanBoardCollaborators)
      .where(
        and(
          eq(kanbanBoardCollaborators.boardId, boardId),
          eq(kanbanBoardCollaborators.clerkId, userId),
        ),
      );
    if (board.clerkId !== userId && !membership)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ensureBoardRoom(board);
    const user = await currentUser();
    const name = user?.fullName || user?.username || 'Flowbase collaborator';
    const { status, body } = await getLiveblocks().identifyUser(userId, {
      userInfo: {
        name,
        email: user?.primaryEmailAddress?.emailAddress || '',
        avatar: user?.imageUrl || undefined,
        color: '#ff7e5f',
      },
    });
    return new Response(body, { status });
  } catch (error) {
    console.error('Liveblocks auth failed', error);
    return NextResponse.json(
      { error: 'Could not authorize collaboration.' },
      { status: 500 },
    );
  }
}
