import { SpacePageEditor } from '@/components/spaces/page-editor';

export default async function PageDetail({ params }: { params: Promise<{ spaceId: string; pageId: string }> }) { const { spaceId, pageId } = await params; return <SpacePageEditor spaceId={Number(spaceId)} pageId={Number(pageId)} />; }
