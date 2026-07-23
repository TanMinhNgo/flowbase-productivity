import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { count, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { calendarItems, kanbanBoards, kanbanColumns, kanbanTasks, users } from "@/db/schema";

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return dateKey(next);
}

async function seedCalendarItems(clerkId: string) {
  const [{ itemCount }] = await db.select({ itemCount: count() }).from(calendarItems).where(eq(calendarItems.clerkId, clerkId));
  if (itemCount > 0) return;

  const today = new Date();
  await db.insert(calendarItems).values([
    { clerkId, title: "Review product direction", notes: "Align the next product milestone with the launch narrative.", kind: "task", category: "work", scheduledDate: dateKey(today), scheduledTime: "09:30" },
    { clerkId, title: "Team planning sync", notes: "Bring the weekly priorities and blockers.", kind: "reminder", category: "meeting", scheduledDate: addDays(today, 1), scheduledTime: "10:00" },
    { clerkId, title: "Write sprint notes", notes: "Capture decisions from the current sprint.", kind: "task", category: "work", scheduledDate: addDays(today, 2), scheduledTime: "14:00" },
    { clerkId, title: "Movement break", notes: "A short reset between focused sessions.", kind: "reminder", category: "health", scheduledDate: addDays(today, 3), scheduledTime: "16:30" },
    { clerkId, title: "Prepare study outline", notes: "Save this for the next open planning block.", kind: "task", category: "study", scheduledDate: null, scheduledTime: null },
    { clerkId, title: "Collect whiteboard ideas", notes: "Turn loose notes into the next working session.", kind: "task", category: "personal", scheduledDate: null, scheduledTime: null },
  ]);
}

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    if (event.type === "user.created" || event.type === "user.updated") {
      const { data } = event;
      const email = data.email_addresses.find((item) => item.id === data.primary_email_address_id)?.email_address ?? null;
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || data.username || null;
      const profile = { name, email, imageUrl: data.image_url, updatedAt: new Date() };

      await db.insert(users).values({ clerkId: data.id, ...profile }).onConflictDoUpdate({ target: users.clerkId, set: profile });
      if (event.type === "user.created") await seedCalendarItems(data.id);
    }

    if (event.type === "user.deleted" && event.data.id) {
      const clerkId = event.data.id;
      const boards = await db.select({ id: kanbanBoards.id }).from(kanbanBoards).where(eq(kanbanBoards.clerkId, clerkId));
      const boardIds = boards.map((board) => board.id);
      if (boardIds.length) {
        await db.delete(kanbanTasks).where(inArray(kanbanTasks.boardId, boardIds));
        await db.delete(kanbanColumns).where(inArray(kanbanColumns.boardId, boardIds));
        await db.delete(kanbanBoards).where(eq(kanbanBoards.clerkId, clerkId));
      }
      await db.delete(calendarItems).where(eq(calendarItems.clerkId, clerkId));
      await db.delete(users).where(eq(users.clerkId, clerkId));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Clerk webhook verification failed", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
