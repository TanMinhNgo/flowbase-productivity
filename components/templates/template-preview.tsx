'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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

function parseRuntimeData(value: string | undefined): Record<string, unknown> {
  try {
    const data: unknown = JSON.parse(value || '{}');
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

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
  const app = query.data?.item;
  const [runtimeData, setRuntimeData] = useState<Record<string, unknown>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (app) setRuntimeData(parseRuntimeData(app.runtimeData));
  }, [app?.id, app?.runtimeData]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const handleChange = (nextData: Record<string, unknown>) => {
    setRuntimeData(nextData);
    if (!app) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void update.mutateAsync({
        id: app.id,
        body: { runtimeData: JSON.stringify(nextData) },
      });
    }, 450);
  };

  if (query.isLoading) return <WorkspaceLoading variant="editor" />;
  if (!app || !parsed)
    return <p className="text-destructive">This app is unavailable.</p>;
  return (
    <section className="mx-auto max-w-275 pb-10">
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{app.appName}</h1>
            <span className="text-xs text-muted-foreground">
              {update.isPending ? 'Saving changes…' : 'Changes saved'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {app.description}
          </p>
        </div>
      </header>
      <div className="mt-5">
        <TemplateRenderer
          spec={parsed}
          runtimeData={runtimeData}
          onChange={handleChange}
        />
      </div>
    </section>
  );
}
