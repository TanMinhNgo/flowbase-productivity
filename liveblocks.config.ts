'use client';

import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';
import type {} from '@/liveblocks.types';

const client = createClient({
  authEndpoint: '/api/liveblocks/auth',
  resolveUsers: async ({ userIds }) => {
    const response = await fetch('/api/liveblocks/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });
    if (!response.ok) return userIds.map(() => undefined);
    return (await response.json()).users;
  },
});

export const {
  RoomProvider,
  useBroadcastEvent,
  useEventListener,
  useMyPresence,
  useOthers,
  useThreads,
} = createRoomContext<
  Liveblocks['Presence'],
  {},
  Liveblocks['UserMeta'],
  Liveblocks['RoomEvent'],
  Liveblocks['ThreadMetadata']
>(client as never);
