import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  aiTemplates,
  calendarItems,
  customCategories,
  kanbanBoards,
  notes,
  spaces,
  userSettings,
  whiteboards,
} from '@/db/schema';

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [
    settings,
    categories,
    calendar,
    userNotes,
    boards,
    userSpaces,
    boardsData,
    templates,
  ] = await Promise.all([
    db.select().from(userSettings).where(eq(userSettings.clerkId, userId)),
    db
      .select()
      .from(customCategories)
      .where(eq(customCategories.clerkId, userId)),
    db.select().from(calendarItems).where(eq(calendarItems.clerkId, userId)),
    db.select().from(notes).where(eq(notes.clerkId, userId)),
    db.select().from(kanbanBoards).where(eq(kanbanBoards.clerkId, userId)),
    db.select().from(spaces).where(eq(spaces.clerkId, userId)),
    db.select().from(whiteboards).where(eq(whiteboards.clerkId, userId)),
    db.select().from(aiTemplates).where(eq(aiTemplates.clerkId, userId)),
  ]);
  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      settings: settings[0] ?? null,
      categories,
      calendar,
      notes: userNotes,
      kanbanBoards: boards,
      spaces: userSpaces,
      whiteboards: boardsData,
      aiTemplates: templates,
    },
    {
      headers: {
        'Content-Disposition': 'attachment; filename="flowbase-export.json"',
      },
    },
  );
}
