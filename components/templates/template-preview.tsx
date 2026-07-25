'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  TemplateIcon,
  TemplateRenderer,
} from '@/components/templates/template-renderer';
import { WorkspaceLoading } from '@/components/ui/workspace-loading';
import { parseTemplateSpec } from '@/lib/ai-templates';
import {
  useAiTemplate,
  useUpdateAiTemplate,
} from '@/hooks/api/use-ai-templates';
type App = {
  id: number;
  appName: string;
  description: string;
  icon: string;
  color: string;
  appJson: string;
  runtimeData: string;
};
export function TemplatePreview({ templateId }: { templateId: number }) {
  const query = useAiTemplate<{ item: App }>(templateId);
  const update = useUpdateAiTemplate<App>();
  const parsed = useMemo(
    () =>
      query.data
        ? parseTemplateSpec(JSON.parse(query.data.item.appJson))
        : null,
    [query.data],
  );
  if (query.isLoading) return <WorkspaceLoading variant="editor" />;
  if (!query.data?.item || !parsed)
    return <p className="text-destructive">This app is unavailable.</p>;
  const app = query.data.item;
  const data = JSON.parse(app.runtimeData || '{}') as Record<string, unknown>;
  return (
    <section className="mx-auto max-w-[1100px] pb-10">
      <Link
        href="/dashboard/templates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={15} /> All generated apps
      </Link>
      <header className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
        <span
          className="grid size-11 place-items-center rounded-xl"
          style={{ color: app.color, backgroundColor: `${app.color}18` }}
        >
          <TemplateIcon name={app.icon} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">{app.appName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {app.description}
          </p>
        </div>
      </header>
      <div className="mt-5">
        <TemplateRenderer
          spec={parsed}
          runtimeData={data}
          onChange={(runtimeData) =>
            void update.mutateAsync({
              id: app.id,
              body: { runtimeData: JSON.stringify(runtimeData) },
            })
          }
        />
      </div>
    </section>
  );
}
