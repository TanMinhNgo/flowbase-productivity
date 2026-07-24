export {};

declare global {
  interface Liveblocks {
    Presence: { selectedTaskId?: number };
    UserMeta: {
      id: string;
      info: { name: string; email: string; avatar?: string; color: string };
    };
    RoomEvent: { type: 'board-mutated' };
    ThreadMetadata: { taskId: string };
  }
}
