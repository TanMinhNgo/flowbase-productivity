'use client';
import { BrainCircuit, Plus, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  TemplateIcon,
  TemplateRenderer,
} from '@/components/templates/template-renderer';
import { WorkspaceLoading } from '@/components/ui/workspace-loading';
import { parseTemplateSpec } from '@/lib/ai-templates';
import {
  useAiTemplates,
  useDeleteAiTemplate,
  useGenerateAiTemplate,
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
  isInSidebar: boolean;
  createdAt: string;
};
export function TemplateBuilder() {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState<App | null>(null);
  const query = useAiTemplates<{ items: App[] }>();
  const generate = useGenerateAiTemplate<App>();
  const update = useUpdateAiTemplate<App>();
  const remove = useDeleteAiTemplate();
  const apps = query.data?.items ?? [];
  if (query.isLoading) return <WorkspaceLoading />;
  return (
    <section className="mx-auto max-w-[1320px] pb-10">
      <div className="max-w-2xl">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <BrainCircuit size={23} />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          AI Template Builder
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Describe the focused tracker or planner you need. Flowbase will
          generate an interactive single-page app for you.
        </p>
      </div>
      <form
        className="mt-7 rounded-2xl border border-border bg-card p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          if (prompt.trim())
            void generate.mutateAsync(prompt).then(({ item }) => {
              setSelected(item);
              setPrompt('');
            });
        }}
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="e.g. Create a habit tracker with daily check-ins, streaks, and weekly progress"
          className="min-h-28 w-full resize-y bg-transparent p-2 text-sm outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              'Habit Tracker',
              'Budget Tracker',
              'Meal Planner',
              'Study Planner',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() =>
                  setPrompt(
                    `Create a ${example} with useful sections and sample data`,
                  )
                }
                className="rounded-full bg-secondary px-3 py-1.5 text-xs hover:bg-secondary/75"
              >
                {example}
              </button>
            ))}
          </div>
          <button
            disabled={!prompt.trim() || generate.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Sparkles size={16} />
            {generate.isPending ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {generate.error instanceof Error ? (
          <p className="mt-3 text-sm text-destructive">
            {generate.error.message}
          </p>
        ) : null}
      </form>
      {selected ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Generated preview</h2>
              <p className="text-sm text-muted-foreground">
                Saved to your apps.
              </p>
            </div>
            <Link
              href={`/dashboard/templates/${selected.id}`}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Open full app
            </Link>
          </div>
          {parseTemplateSpec(JSON.parse(selected.appJson)) ? (
            <TemplateRenderer
              spec={parseTemplateSpec(JSON.parse(selected.appJson))!}
              runtimeData={JSON.parse(selected.runtimeData || '{}')}
            />
          ) : null}
        </div>
      ) : null}
      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Created apps</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only you can see these apps and their data.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {apps.length} apps
        </span>
      </div>
      {apps.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <article
              key={app.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="grid size-10 place-items-center rounded-xl"
                  style={{
                    color: app.color,
                    backgroundColor: `${app.color}18`,
                  }}
                >
                  <TemplateIcon name={app.icon} />
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${app.appName}?`))
                      void remove.mutateAsync(app.id);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete app"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="mt-4 font-semibold">{app.appName}</h3>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                {app.description}
              </p>
              <p className="mt-3 text-xs" style={{ color: app.color }}>
                {new Date(app.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/templates/${app.id}`}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
                >
                  Preview
                </Link>
                <button
                  onClick={() =>
                    void update.mutateAsync({
                      id: app.id,
                      body: { isInSidebar: !app.isInSidebar },
                    })
                  }
                  className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold"
                >
                  {app.isInSidebar ? 'Remove sidebar' : 'Add to sidebar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid min-h-56 place-items-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <div>
            <Plus className="mx-auto text-primary" />
            <p className="mt-3 font-medium">
              Your generated apps will appear here
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
