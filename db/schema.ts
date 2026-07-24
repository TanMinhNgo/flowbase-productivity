import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name'),
  email: text('email').unique(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const calendarItems = pgTable(
  'calendar_items',
  {
    id: serial('id').primaryKey(),
    clerkId: text('clerk_id').notNull(),
    title: text('title').notNull(),
    notes: text('notes'),
    kind: text('kind').notNull(),
    category: text('category').notNull(),
    scheduledDate: date('scheduled_date', { mode: 'string' }),
    scheduledTime: time('scheduled_time', { withTimezone: false }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('calendar_items_clerk_id_idx').on(table.clerkId),
    index('calendar_items_scheduled_date_idx').on(table.scheduledDate),
  ],
);

export const kanbanBoards = pgTable(
  'kanban_boards',
  {
    id: serial('id').primaryKey(),
    clerkId: text('clerk_id').notNull(),
    name: text('name').notNull(),
    color: text('color').notNull().default('coral'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('kanban_boards_clerk_id_idx').on(table.clerkId)],
);

export const kanbanColumns = pgTable('kanban_columns', {
  id: serial('id').primaryKey(),
  boardId: integer('board_id').notNull(),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const kanbanBoardCollaborators = pgTable(
  'kanban_board_collaborators',
  {
    id: serial('id').primaryKey(),
    boardId: integer('board_id').notNull(),
    clerkId: text('clerk_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('kanban_board_collaborators_board_user_idx').on(
      table.boardId,
      table.clerkId,
    ),
    index('kanban_board_collaborators_clerk_id_idx').on(table.clerkId),
  ],
);

export const kanbanTasks = pgTable(
  'kanban_tasks',
  {
    id: serial('id').primaryKey(),
    boardId: integer('board_id').notNull(),
    columnId: integer('column_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: date('due_date', { mode: 'string' }),
    priority: text('priority').notNull().default('medium'),
    labels: text('labels').notNull().default('[]'),
    syncCalendar: boolean('sync_calendar').notNull().default(false),
    linkedToNotes: boolean('linked_to_notes').notNull().default(false),
    calendarItemId: integer('calendar_item_id'),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('kanban_tasks_board_id_idx').on(table.boardId),
    index('kanban_tasks_column_id_idx').on(table.columnId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CalendarItem = typeof calendarItems.$inferSelect;
export type NewCalendarItem = typeof calendarItems.$inferInsert;
