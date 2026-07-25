import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { spaceCollaborators, spaces } from '@/db/schema';

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
