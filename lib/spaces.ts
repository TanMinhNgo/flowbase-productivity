import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { spaceCollaborators, spacePages, spaces } from '@/db/schema';

export const SPACE_COLORS = ['coral', 'apricot', 'rose', 'violet', 'sky', 'mint'] as const;
export const PAGE_TEMPLATES = ['Blank Page', 'Project Plan', 'Meeting Notes', 'PRD', 'Research Notes', 'Task Plan'] as const;
export const EMPTY_DOC = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });

export function validId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getAccessibleSpace(spaceId: number, clerkId: string) {
  const [space] = await db.select().from(spaces).where(eq(spaces.id, spaceId));
  if (!space) return undefined;
  if (space.clerkId === clerkId) return space;
  const [membership] = await db
    .select({ id: spaceCollaborators.id })
    .from(spaceCollaborators)
    .where(and(eq(spaceCollaborators.spaceId, spaceId), eq(spaceCollaborators.clerkId, clerkId)));
  return membership ? space : undefined;
}

export function templateContent(template: string) {
  const headings: Record<string, string[]> = {
    'Project Plan': ['Overview', 'Goals', 'Milestones', 'Risks'],
    'Meeting Notes': ['Attendees', 'Agenda', 'Notes', 'Decisions', 'Action items'],
    PRD: ['Problem', 'Goals', 'User stories', 'Requirements', 'Success metrics'],
    'Research Notes': ['Question', 'Sources', 'Findings', 'Open questions'],
    'Task Plan': ['Outcome', 'Tasks', 'Timeline', 'Next step'],
  };
  const sections = headings[template];
  if (!sections) return EMPTY_DOC;
  return JSON.stringify({
    type: 'doc',
    content: sections.flatMap((heading) => [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: heading }] },
      { type: 'paragraph' },
    ]),
  });
}

const STARTER_SPACES = [
  {
    name: 'Work Projects',
    description: 'Project plans, documentation, and team collaboration.',
    color: 'sky',
    pages: [
      ['Q2 Roadmap', 'Project Plan'],
      ['Sprint Planning', 'Task Plan'],
      ['Project PRD', 'PRD'],
      ['Meeting Notes', 'Meeting Notes'],
    ],
  },
  {
    name: 'Personal',
    description: 'Personal notes, goals, and life organization.',
    color: 'mint',
    pages: [
      ['Weekly Reset', 'Blank Page'],
      ['Personal Goals', 'Task Plan'],
      ['Journal Prompts', 'Blank Page'],
    ],
  },
  {
    name: 'Ideas & Research',
    description: 'Brainstorming, references, and future ideas.',
    color: 'coral',
    pages: [
      ['Idea Backlog', 'Blank Page'],
      ['Research Notes', 'Research Notes'],
      ['Useful Resources', 'Research Notes'],
    ],
  },
  {
    name: 'Learning & Growth',
    description: 'Courses, books, and research notes.',
    color: 'apricot',
    pages: [
      ['Learning Plan', 'Task Plan'],
      ['Book Notes', 'Research Notes'],
      ['Course Tracker', 'Blank Page'],
    ],
  },
  {
    name: 'Productivity Hub',
    description: 'Daily planning, notes, tasks, and productivity workflows.',
    color: 'violet',
    pages: [
      ['Daily Planning', 'Task Plan'],
      ['Weekly Review', 'Blank Page'],
      ['Focus System', 'Project Plan'],
      ['Workflow Ideas', 'Blank Page'],
    ],
  },
] as const;

export async function seedStarterSpaces(clerkId: string) {
  const existing = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(eq(spaces.clerkId, clerkId));
  if (existing.length) return false;

  for (const starter of STARTER_SPACES) {
    const [space] = await db
      .insert(spaces)
      .values({
        clerkId,
        name: starter.name,
        description: starter.description,
        color: starter.color,
      })
      .returning();
    await db.insert(spacePages).values(
      starter.pages.map(([title, template]) => ({
        spaceId: space.id,
        title,
        template,
        content: templateContent(template),
        createdBy: clerkId,
        updatedBy: clerkId,
      })),
    );
  }
  return true;
}
