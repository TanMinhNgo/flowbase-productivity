import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { spacePages, spaces } from '@/db/schema';
import { getAccessibleSpace, PAGE_TEMPLATES, validId } from '@/lib/spaces';

async function getPage(spaceId: number, pageId: number) {
  const [page] = await db.select().from(spacePages).where(and(eq(spacePages.id, pageId), eq(spacePages.spaceId, spaceId)));
  return page;
}

export async function GET(_request: Request, { params }: { params: Promise<{ spaceId: string; pageId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { spaceId: spaceValue, pageId: pageValue } = await params;
  const spaceId = validId(spaceValue); const pageId = validId(pageValue);
  if (!spaceId || !pageId) return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId); const page = await getPage(spaceId, pageId);
  if (!space || !page) return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
  return NextResponse.json({ page, space, commentsCount: 0, linkedTasksCount: 0 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ spaceId: string; pageId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { spaceId: spaceValue, pageId: pageValue } = await params;
  const spaceId = validId(spaceValue); const pageId = validId(pageValue);
  if (!spaceId || !pageId) return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId); const page = await getPage(spaceId, pageId);
  if (!space || !page) return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
  const body = (await request.json()) as Record<string, unknown>;
  if (body.duplicate) {
    const [copy] = await db.insert(spacePages).values({ spaceId, title: `Copy of ${page.title}`, template: page.template, description: page.description, content: page.content, plainText: page.plainText, createdBy: userId, updatedBy: userId }).returning();
    return NextResponse.json({ item: copy }, { status: 201 });
  }
  const updates: Record<string, unknown> = { updatedAt: new Date(), updatedBy: userId };
  if ('title' in body) { const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : ''; if (!title) return NextResponse.json({ error: 'A page title is required.' }, { status: 400 }); updates.title = title; }
  if ('description' in body) updates.description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '';
  if ('content' in body) { if (typeof body.content !== 'string' || body.content.length > 250000) return NextResponse.json({ error: 'Invalid page content.' }, { status: 400 }); updates.content = body.content; updates.plainText = typeof body.plainText === 'string' ? body.plainText.slice(0, 100000) : ''; }
  if ('template' in body) { if (!PAGE_TEMPLATES.includes(body.template as (typeof PAGE_TEMPLATES)[number])) return NextResponse.json({ error: 'Invalid page template.' }, { status: 400 }); updates.template = body.template; }
  if ('isFavorite' in body) updates.isFavorite = Boolean(body.isFavorite);
  if ('archived' in body) updates.archivedAt = body.archived ? new Date() : null;
  if ('spaceId' in body) { const destinationId = typeof body.spaceId === 'number' ? body.spaceId : Number(body.spaceId); if (!Number.isInteger(destinationId) || !(await getAccessibleSpace(destinationId, userId))) return NextResponse.json({ error: 'Destination space not found.' }, { status: 400 }); updates.spaceId = destinationId; }
  const [item] = await db.update(spacePages).set(updates).where(eq(spacePages.id, pageId)).returning();
  await db.update(spaces).set({ updatedAt: new Date() }).where(eq(spaces.id, spaceId));
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ spaceId: string; pageId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { spaceId: spaceValue, pageId: pageValue } = await params;
  const spaceId = validId(spaceValue); const pageId = validId(pageValue);
  if (!spaceId || !pageId) return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
  const space = await getAccessibleSpace(spaceId, userId); const page = await getPage(spaceId, pageId);
  if (!space || !page) return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
  await db.delete(spacePages).where(eq(spacePages.id, pageId));
  return NextResponse.json({ deletedId: pageId });
}
