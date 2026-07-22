import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = {
    name: user.fullName ?? user.username,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user.imageUrl,
    updatedAt: new Date(),
  };

  await db
    .insert(users)
    .values({ clerkId: user.id, ...profile })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: profile,
    });

  return NextResponse.json({ synced: true });
}
