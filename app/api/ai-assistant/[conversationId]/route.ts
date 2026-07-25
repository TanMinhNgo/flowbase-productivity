import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { assistantConversations, assistantMessages } from '@/db/schema';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((await params).conversationId);
  const [conversation] = await db
    .select()
    .from(assistantConversations)
    .where(
      and(
        eq(assistantConversations.id, id),
        eq(assistantConversations.clerkId, userId),
      ),
    );
  if (!conversation)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const messages = await db
    .select()
    .from(assistantMessages)
    .where(eq(assistantMessages.conversationId, id));
  return NextResponse.json({ conversation, messages });
}
