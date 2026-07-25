import { SpaceDetail } from '@/components/spaces/space-detail';

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  return <SpaceDetail spaceId={Number((await params).spaceId)} />;
}
