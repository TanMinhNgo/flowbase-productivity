import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { CalendarWorkspace } from '@/components/calendar/calendar-workspace';
import { db } from '@/db';
import { calendarItems } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const { userId } = await auth();
  const items = userId
    ? await db
        .select()
        .from(calendarItems)
        .where(eq(calendarItems.clerkId, userId))
    : [];
  return <CalendarWorkspace initialItems={items} />;
}
