import { Liveblocks } from '@liveblocks/node';

import type { kanbanBoards } from '@/db/schema';
import type {} from '@/liveblocks.types';

type KanbanBoard = typeof kanbanBoards.$inferSelect;

export function roomIdForBoard(boardId: number) {
  return `flowbase:kanban:${boardId}`;
}

export function getLiveblocks() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error('LIVEBLOCKS_SECRET_KEY is not configured.');
  return new Liveblocks({ secret });
}

export async function ensureBoardRoom(board: KanbanBoard) {
  const liveblocks = getLiveblocks();
  return liveblocks.getOrCreateRoom(roomIdForBoard(board.id), {
    defaultAccesses: [],
    usersAccesses: { [board.clerkId]: ['*:write'] },
    metadata: { app: 'flowbase', boardId: String(board.id), type: 'kanban' },
  });
}
