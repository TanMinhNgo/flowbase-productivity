import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { spacePages, spaces } from '@/db/schema';
import { getAccessibleSpace, PAGE_TEMPLATES, templateContent, validId } from '@/lib/spaces';

export async function POST(request: Request, { params }: { params: Promise<{ spaceId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const spaceId = validId((await params).spaceId);
  if (!spaceId) return NextResponse.json({ error: 'Invalid space.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId);
  if (!space) return NextResponse.json({ error: 'Space not found.' }, { status: 404 });
  const body = (await request.json()) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : '';
  if (!title) return NextResponse.json({ error: 'A page name is required.' }, { status: 400 });
  const template = PAGE_TEMPLATES.includes(body.template as (typeof PAGE_TEMPLATES)[number]) ? body.template as (typeof PAGE_TEMPLATES)[number] : 'Blank Page';
  const [item] = await db.insert(spacePages).values({ spaceId, title, template, description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '', content: templateContent(template), createdBy: userId, updatedBy: userId }).returning();
  await db.update(spaces).set({ updatedAt: new Date() }).where(eq(spaces.id, spaceId));
  return NextResponse.json({ item }, { status: 201 });
}
