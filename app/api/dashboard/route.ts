import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import {
  aiTemplates,
  assistantActions,
  assistantConversations,
  calendarItems,
  customCategories,
  kanbanBoardCollaborators,
  kanbanBoards,
  kanbanColumns,
  kanbanTasks,
  notes,
  whiteboards,
} from '@/db/schema';

const builtInCategoryColors: Record<string, string> = {
  work: '#2563eb',
  personal: '#c45a91',
  meeting: '#d88324',
  study: '#7557d9',
  health: '#168b70',
  kanban: '#f08725',
};

function isDateKey(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function itemDate(item: { scheduledDate: string | null; scheduledTime: string | null }) {
  return `${item.scheduledDate ?? '9999-12-31'}T${item.scheduledTime ?? '23:59'}`;
}

function isNew(createdAt: Date, updatedAt: Date) {
  return Math.abs(createdAt.getTime() - updatedAt.getTime()) < 1_500;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requestedToday = new URL(request.url).searchParams.get('today');
  const today = requestedToday && /^\d{4}-\d{2}-\d{2}$/.test(requestedToday)
    ? requestedToday
    : new Date().toISOString().slice(0, 10);

  const [calendar, ownedBoards, memberships, noteItems, boardItems, templateItems, conversations, actions, categories] =
    await Promise.all([
      db.select().from(calendarItems).where(eq(calendarItems.clerkId, userId)),
      db
        .select()
        .from(kanbanBoards)
        .where(eq(kanbanBoards.clerkId, userId))
        .orderBy(desc(kanbanBoards.updatedAt)),
      db
        .select({ boardId: kanbanBoardCollaborators.boardId })
        .from(kanbanBoardCollaborators)
        .where(eq(kanbanBoardCollaborators.clerkId, userId)),
      db
        .select()
        .from(notes)
        .where(and(eq(notes.clerkId, userId), isNull(notes.deletedAt)))
        .orderBy(desc(notes.updatedAt)),
      db
        .select()
        .from(whiteboards)
        .where(eq(whiteboards.clerkId, userId))
        .orderBy(desc(whiteboards.updatedAt)),
      db
        .select()
        .from(aiTemplates)
        .where(eq(aiTemplates.clerkId, userId))
        .orderBy(desc(aiTemplates.updatedAt)),
      db
        .select()
        .from(assistantConversations)
        .where(eq(assistantConversations.clerkId, userId))
        .orderBy(desc(assistantConversations.updatedAt)),
      db
        .select()
        .from(assistantActions)
        .where(eq(assistantActions.clerkId, userId))
        .orderBy(desc(assistantActions.updatedAt)),
      db
        .select()
        .from(customCategories)
        .where(eq(customCategories.clerkId, userId)),
    ]);

  const sharedIds = memberships.map((item) => item.boardId);
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
        db.select().from(kanbanColumns).where(inArray(kanbanColumns.boardId, boardIds)),
        db.select().from(kanbanTasks).where(inArray(kanbanTasks.boardId, boardIds)),
      ])
    : [[], []];

  const categoryColors = new Map(
    categories.map((category) => [
      `${category.scope}:${category.name.toLowerCase()}`,
      category.color,
    ]),
  );
  const calendarColor = (category: string, kind: string) =>
    categoryColors.get(`${kind === 'reminder' ? 'reminder' : 'calendar'}:${category.toLowerCase()}`) ??
    builtInCategoryColors[category.toLowerCase()] ??
    '#2468e5';

  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const completedTasks = tasks.filter((task) => {
    const name = columnsById.get(task.columnId)?.name.toLowerCase().trim();
    return name === 'done' || name === 'complete' || name === 'completed';
  });
  const overdueTasks = tasks.filter(
    (task) =>
      !completedTasks.some((completed) => completed.id === task.id) &&
      isDateKey(task.dueDate) &&
      task.dueDate < today,
  );
  const completionPercentage = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;
  const upcoming = calendar
    .filter((item) => isDateKey(item.scheduledDate) && item.scheduledDate >= today)
    .sort((a, b) => itemDate(a).localeCompare(itemDate(b)))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      category: item.category,
      scheduledDate: item.scheduledDate,
      scheduledTime: item.scheduledTime,
      categoryColor: calendarColor(item.category, item.kind),
    }));

  const activity = [
    ...calendar.map((item) => ({
      id: `calendar-${item.id}`,
      label: `${isNew(item.createdAt, item.updatedAt) ? 'Added' : 'Updated'} ${item.kind === 'reminder' ? 'reminder' : 'calendar task'}`,
      title: item.title,
      timestamp: item.updatedAt,
      type: item.kind === 'reminder' ? 'reminder' : 'calendar',
      href: '/dashboard/calendar',
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      label: isNew(task.createdAt, task.updatedAt) ? 'Created task' : 'Updated task',
      title: task.title,
      timestamp: task.updatedAt,
      type: 'task',
      href: '/dashboard/tasks',
    })),
    ...noteItems.map((note) => ({
      id: `note-${note.id}`,
      label: isNew(note.createdAt, note.updatedAt) ? 'Created note' : 'Updated note',
      title: note.title,
      timestamp: note.updatedAt,
      type: 'note',
      href: '/dashboard/notes',
    })),
    ...boardItems.map((board) => ({
      id: `whiteboard-${board.id}`,
      label: isNew(board.createdAt, board.updatedAt) ? 'Created whiteboard' : 'Updated whiteboard',
      title: board.name,
      timestamp: board.updatedAt,
      type: 'whiteboard',
      href: '/dashboard/whiteboard',
    })),
    ...templateItems.map((template) => ({
      id: `template-${template.id}`,
      label: 'Generated AI template',
      title: template.appName,
      timestamp: template.createdAt,
      type: 'template',
      href: `/dashboard/templates/${template.id}`,
    })),
    ...actions
      .filter((action) => action.status === 'completed')
      .map((action) => ({
        id: `assistant-${action.id}`,
        label: 'AI Assistant action completed',
        title: action.result ?? action.type.replaceAll('_', ' '),
        timestamp: action.updatedAt,
        type: 'assistant',
        href: '/dashboard/ai-assistant',
      })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);

  const recentPages = [
    ...noteItems.map((item) => ({
      id: `note-${item.id}`,
      title: item.title,
      type: 'Note',
      color: item.color,
      updatedAt: item.updatedAt,
      href: '/dashboard/notes',
    })),
    ...boardItems.map((item) => ({
      id: `whiteboard-${item.id}`,
      title: item.name,
      type: 'Whiteboard',
      color: item.color,
      updatedAt: item.updatedAt,
      href: '/dashboard/whiteboard',
    })),
    ...boards.map((item) => ({
      id: `kanban-${item.id}`,
      title: item.name,
      type: 'Kanban board',
      color: item.color,
      updatedAt: item.updatedAt,
      href: '/dashboard/tasks',
    })),
    ...templateItems.map((item) => ({
      id: `template-${item.id}`,
      title: item.appName,
      type: 'AI template',
      color: item.color,
      updatedAt: item.updatedAt,
      href: `/dashboard/templates/${item.id}`,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);

  const featureCounts = {
    calendar: calendar.length,
    tasks: tasks.length,
    notes: noteItems.length,
    whiteboards: boardItems.length,
    assistant: conversations.length,
    templates: templateItems.length,
  };
  const mostActive = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0];
  const insights = [
    overdueTasks.length
      ? `You have ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}.`
      : null,
    upcoming.filter((item) => item.scheduledDate === today && item.kind === 'reminder').length
      ? `You have ${upcoming.filter((item) => item.scheduledDate === today && item.kind === 'reminder').length} reminder${upcoming.filter((item) => item.scheduledDate === today && item.kind === 'reminder').length === 1 ? '' : 's'} today.`
      : null,
    tasks.length ? `You have completed ${completionPercentage}% of your Kanban tasks.` : null,
    mostActive?.[1] ? `Your most active workspace is ${mostActive[0] === 'tasks' ? 'Kanban' : mostActive[0] === 'whiteboards' ? 'Whiteboard' : mostActive[0].charAt(0).toUpperCase() + mostActive[0].slice(1)}.` : null,
    overdueTasks.length
      ? 'Suggested focus: finish high-priority overdue tasks first.'
      : tasks.length
        ? 'Suggested focus: move one pending task forward today.'
        : 'Suggested focus: capture your first task or note to get started.',
  ].filter((insight): insight is string => Boolean(insight));

  return NextResponse.json({
    features: [
      { id: 'calendar', label: 'Calendar', status: calendar.length ? 'Active' : 'Ready', count: calendar.length, detail: `${upcoming.length} upcoming`, href: '/dashboard/calendar' },
      { id: 'tasks', label: 'Kanban / Tasks', status: tasks.length ? 'Active' : 'Ready', count: tasks.length, detail: `${completedTasks.length} completed`, href: '/dashboard/tasks' },
      { id: 'notes', label: 'Notes', status: noteItems.length ? 'Active' : 'Ready', count: noteItems.length, detail: `${noteItems.filter((item) => item.isPinned).length} pinned`, href: '/dashboard/notes' },
      { id: 'whiteboard', label: 'Whiteboard', status: boardItems.length ? 'Active' : 'Ready', count: boardItems.length, detail: 'Visual workspaces', href: '/dashboard/whiteboard' },
      { id: 'assistant', label: 'AI Assistant', status: conversations.length ? 'Active' : 'Ready', count: conversations.length, detail: `${actions.filter((item) => item.status === 'completed').length} actions completed`, href: '/dashboard/ai-assistant' },
      { id: 'template', label: 'AI Template Builder', status: templateItems.length ? 'Active' : 'Ready', count: templateItems.length, detail: 'Generated mini apps', href: '/dashboard/templates' },
    ],
    taskSummary: {
      total: tasks.length,
      completed: completedTasks.length,
      pending: tasks.length - completedTasks.length,
      overdue: overdueTasks.length,
      completionPercentage,
    },
    upcoming,
    activity,
    recentPages,
    insights,
  });
}
