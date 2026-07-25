import { Skeleton } from '@/components/ui/skeleton';

export function WorkspaceLoading({
  variant = 'spaces',
}: {
  variant?: 'spaces' | 'canvas' | 'editor';
}) {
  if (variant === 'canvas')
    return (
      <div className="flex min-h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-border bg-card">
        <aside className="hidden w-72 shrink-0 border-r border-border p-3 md:block">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="mt-5 space-y-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-border px-5">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="ml-auto h-9 w-24 rounded-lg" />
          </div>
          <div className="m-4 flex-1 rounded-xl border border-border bg-secondary/20" />
        </div>
      </div>
    );
  if (variant === 'editor')
    return (
      <div className="flex min-h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-border bg-card">
        <aside className="hidden w-72 shrink-0 border-r border-border p-3 md:block">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="mt-5 space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-border px-5">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="ml-auto h-4 w-12" />
          </div>
          <div className="space-y-5 px-6 py-10 sm:px-12">
            <Skeleton className="h-8 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="mt-10 h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        </div>
      </div>
    );
  return (
    <div className="mx-auto max-w-[1400px] pb-10">
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <Skeleton className="mt-7 h-10 w-full rounded-xl" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <Skeleton className="size-11 rounded-xl" />
            <Skeleton className="mt-5 h-5 w-3/5" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <div className="mt-6 flex justify-between">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
