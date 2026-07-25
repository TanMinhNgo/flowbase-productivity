'use client';

import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  Bot,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FilePlus2,
  KanbanSquare,
  ListTodo,
  NotebookPen,
  PanelsTopLeft,
  Plus,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard, type DashboardData } from '@/hooks/api/use-dashboard';

const featureIcons = {
  calendar: CalendarDays,
  tasks: KanbanSquare,
  notes: NotebookPen,
  whiteboard: PanelsTopLeft,
  assistant: Bot,
  template: BrainCircuit,
} as const;

const featureStyles = {
  calendar: 'bg-[#e5f8f2] text-[#13876d]',
  tasks: 'bg-[#fff0df] text-[#d9781c]',
  notes: 'bg-[#ffebf3] text-[#cc4d7d]',
  whiteboard: 'bg-[#e2f7ff] text-[#008fbd]',
  assistant: 'bg-[#eee8ff] text-[#7443e5]',
  template: 'bg-[#f6e9ff] text-[#994dd8]',
} as const;

const activityIcons: Record<string, typeof CalendarDays> = {
  calendar: CalendarDays,
  reminder: BellRing,
  task: ListTodo,
  note: NotebookPen,
  whiteboard: PanelsTopLeft,
  template: BrainCircuit,
  assistant: Bot,
};

const quickActions = [
  {
    href: '/dashboard/tasks',
    label: 'Create task',
    description: 'Plan the next step',
    icon: ListTodo,
    className: 'bg-[#fff0df] text-[#d9781c]',
  },
  {
    href: '/dashboard/calendar',
    label: 'Add reminder',
    description: 'Keep time on your side',
    icon: BellRing,
    className: 'bg-[#e5f8f2] text-[#13876d]',
  },
  {
    href: '/dashboard/notes',
    label: 'Create note',
    description: 'Capture a thought',
    icon: FilePlus2,
    className: 'bg-[#ffebf3] text-[#cc4d7d]',
  },
  {
    href: '/dashboard/whiteboard',
    label: 'Open whiteboard',
    description: 'Think visually',
    icon: PanelsTopLeft,
    className: 'bg-[#e2f7ff] text-[#008fbd]',
  },
  {
    href: '/dashboard/ai-assistant',
    label: 'Ask AI Assistant',
    description: 'Turn intent into action',
    icon: Bot,
    className: 'bg-[#eee8ff] text-[#7443e5]',
  },
  {
    href: '/dashboard/templates',
    label: 'Generate AI template',
    description: 'Build a focused tool',
    icon: Sparkles,
    className: 'bg-[#f6e9ff] text-[#994dd8]',
  },
] as const;

function relativeTime(value: string) {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatSchedule(date: string, time: string | null) {
  const parsed = new Date(`${date}T12:00:00`);
  const day = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
  if (!time) return day;
  const [hours, minutes] = time.split(':').map(Number);
  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2020, 0, 1, hours, minutes));
  return `${day} · ${formattedTime}`;
}

function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <Skeleton className="h-3 w-28 rounded" />
      <Skeleton className="mt-4 h-10 w-72 max-w-full rounded-xl" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl rounded" />
      <div className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Skeleton className="h-75 rounded-2xl" />
        <Skeleton className="h-75 rounded-2xl" />
      </div>
    </div>
  );
}

function EmptyList({
  icon: Icon,
  message,
  href,
  action,
}: {
  icon: typeof CalendarDays;
  message: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#d8e3f2] bg-[#f9fbff] px-5 text-center dark:border-white/10 dark:bg-white/[0.025]">
      <Icon size={18} className="text-[#8ea3c1]" />
      <p className="mt-2 text-sm text-[#718096] dark:text-[#acb7c8]">
        {message}
      </p>
      <Link
        href={href}
        className="mt-3 text-xs font-semibold text-[#2468e5] hover:text-[#174da8]"
      >
        {action}
      </Link>
    </div>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  const { taskSummary } = data;

  return (
    <>
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3a73d8]">
            Workspace overview
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[#1d2635] sm:text-4xl dark:text-[#f6f8fc]">
            Keep your work moving.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a7484] dark:text-[#adb8c8]">
            A live view of your plans, workspaces, and the next actions that
            deserve your attention.
          </p>
        </div>
        <Link
          href="/dashboard/ai-assistant"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2468e5] px-4 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(36,104,229,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1c58c8] active:translate-y-0"
        >
          <Sparkles size={16} fill="currentColor" />
          Create with AI
        </Link>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.features.map((feature) => {
          const Icon = featureIcons[feature.id];
          return (
            <Link
              key={feature.id}
              href={feature.href}
              className="group rounded-2xl border border-[#e1e8f2] bg-white p-4 shadow-[0_10px_24px_rgba(37,57,96,0.045)] transition hover:-translate-y-0.5 hover:border-[#bcd2fb] hover:shadow-[0_14px_28px_rgba(37,57,96,0.08)] dark:border-white/10 dark:bg-[#1b2330] dark:hover:border-[#3c66aa]"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid size-9 place-items-center rounded-xl ${featureStyles[feature.id]}`}
                >
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${feature.status === 'Active' ? 'bg-[#e7f8ef] text-[#16825d] dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-[#edf2f8] text-[#738197] dark:bg-white/10 dark:text-[#bac4d1]'}`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {feature.status}
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#263345] dark:text-[#f0f3f8]">
                    {feature.label}
                  </p>
                  <p className="mt-1 text-xs text-[#7a8799] dark:text-[#aab5c6]">
                    {feature.detail}
                  </p>
                </div>
                <span className="text-2xl font-semibold tracking-[-0.05em] text-[#253a59] dark:text-white">
                  {feature.count}
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.03em]">
              Quick access
            </h2>
            <p className="mt-1 text-xs text-[#778497] dark:text-[#adb8c8]">
              Start the next useful thing in one click.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map(({ href, label, description, icon: Icon, className }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#e4ebf4] bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#bdd3f8] hover:shadow-[0_10px_20px_rgba(37,57,96,0.06)] dark:border-white/10 dark:bg-[#1b2330]"
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${className}`}>
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{label}</span>
                <span className="mt-0.5 block truncate text-xs text-[#778497] dark:text-[#adb8c8]">
                  {description}
                </span>
              </span>
              <ArrowUpRight
                size={16}
                className="shrink-0 text-[#93a4bb] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#2468e5]"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-2xl border border-[#e1e8f2] bg-white p-5 shadow-[0_10px_24px_rgba(37,57,96,0.045)] dark:border-white/10 dark:bg-[#1b2330]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#e9f1ff] text-[#2468e5] dark:bg-[#1c3a70]">
                  <KanbanSquare size={16} />
                </span>
                <h2 className="text-base font-semibold tracking-[-0.03em]">Task summary</h2>
              </div>
              <p className="mt-3 text-sm text-[#778497] dark:text-[#adb8c8]">
                {taskSummary.total
                  ? `${taskSummary.completed} of ${taskSummary.total} tasks are complete.`
                  : 'Create a Kanban task to begin tracking progress.'}
              </p>
            </div>
            <span className="text-3xl font-semibold tracking-[-0.06em] text-[#2468e5]">
              {taskSummary.completionPercentage}%
            </span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e8eff8] dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[#2468e5] transition-[width] duration-500"
              style={{ width: `${taskSummary.completionPercentage}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Total', taskSummary.total, CircleDashed, 'text-[#5f789d] bg-[#edf3fb]'],
              ['Completed', taskSummary.completed, CheckCircle2, 'text-[#16825d] bg-[#e7f8ef]'],
              ['Pending', taskSummary.pending, Clock3, 'text-[#d9781c] bg-[#fff0df]'],
              ['Overdue', taskSummary.overdue, AlertTriangle, 'text-[#d95058] bg-[#ffebed]'],
            ].map(([label, count, Icon, tone]) => {
              const StatIcon = Icon as typeof CircleDashed;
              return (
                <div key={label as string} className="rounded-xl bg-[#f8faff] p-3 dark:bg-white/[0.035]">
                  <span className={`grid size-6 place-items-center rounded-lg ${tone}`}>
                    <StatIcon size={13} />
                  </span>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.04em]">{count as number}</p>
                  <p className="text-[11px] text-[#778497] dark:text-[#adb8c8]">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e1e8f2] bg-white p-5 shadow-[0_10px_24px_rgba(37,57,96,0.045)] dark:border-white/10 dark:bg-[#1b2330]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e5f8f2] text-[#13876d] dark:bg-emerald-500/15">
                <CalendarDays size={16} />
              </span>
              <h2 className="text-base font-semibold tracking-[-0.03em]">Upcoming schedule</h2>
            </div>
            <Link href="/dashboard/calendar" className="text-xs font-semibold text-[#2468e5] hover:text-[#174da8]">
              Open calendar
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {data.upcoming.length ? data.upcoming.map((item) => (
              <Link
                key={item.id}
                href="/dashboard/calendar"
                className="flex min-w-0 items-center gap-3 rounded-xl p-2 transition hover:bg-[#f6f9fd] dark:hover:bg-white/[0.045]"
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.categoryColor }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-[#778497] dark:text-[#adb8c8]">
                    {formatSchedule(item.scheduledDate, item.scheduledTime)}
                  </span>
                </span>
                <span className="rounded-full bg-[#eff4fa] px-2 py-1 text-[10px] font-semibold capitalize text-[#607188] dark:bg-white/10 dark:text-[#c0cad7]">
                  {item.kind}
                </span>
              </Link>
            )) : (
              <EmptyList icon={CalendarDays} message="No scheduled tasks or reminders yet." href="/dashboard/calendar" action="Add to calendar" />
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#e1e8f2] bg-white p-5 shadow-[0_10px_24px_rgba(37,57,96,0.045)] xl:col-span-2 dark:border-white/10 dark:bg-[#1b2330]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-[-0.03em]">Recent activity</h2>
            <Clock3 size={16} className="text-[#87a0c1]" />
          </div>
          <div className="mt-4 space-y-1">
            {data.activity.length ? data.activity.map((item) => {
              const Icon = activityIcons[item.type] ?? Sparkles;
              return (
                <Link key={item.id} href={item.href} className="flex min-w-0 items-center gap-3 rounded-xl p-2.5 transition hover:bg-[#f6f9fd] dark:hover:bg-white/[0.045]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eff4fb] text-[#4d78bb] dark:bg-white/10 dark:text-[#b9d0f7]">
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-[#778497] dark:text-[#adb8c8]">{item.label}</span>
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-[#8796aa]">{relativeTime(item.timestamp)}</span>
                </Link>
              );
            }) : (
              <EmptyList icon={Clock3} message="Activity will appear as you use Flowbase." href="/dashboard/notes" action="Create your first note" />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#d9e5f9] bg-[linear-gradient(145deg,#f8fbff_0%,#eef5ff_100%)] p-5 shadow-[0_10px_24px_rgba(37,57,96,0.045)] dark:border-[#2b4775] dark:bg-[linear-gradient(145deg,#1b2b45_0%,#182436_100%)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#2468e5] text-white shadow-[0_5px_12px_rgba(36,104,229,.25)]">
              <Sparkles size={15} fill="currentColor" />
            </span>
            <h2 className="text-base font-semibold tracking-[-0.03em]">AI insights</h2>
          </div>
          <div className="mt-4 space-y-3">
            {data.insights.map((insight) => (
              <div key={insight} className="flex gap-2.5 text-sm leading-5 text-[#50647e] dark:text-[#c5d2e4]">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#3a73d8]" />
                <p>{insight}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/ai-assistant" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#2468e5] hover:text-[#174da8]">
            Ask Flowbase AI <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-[#e1e8f2] bg-white p-5 shadow-[0_10px_24px_rgba(37,57,96,0.045)] dark:border-white/10 dark:bg-[#1b2330]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.03em]">Recent pages</h2>
            <p className="mt-1 text-xs text-[#778497] dark:text-[#adb8c8]">Your latest notes, boards, and AI-made tools.</p>
          </div>
          <Plus size={16} className="text-[#87a0c1]" />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.recentPages.length ? data.recentPages.map((page) => (
            <Link key={page.id} href={page.href} className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#e8eef6] p-3 transition hover:border-[#bfd5fa] hover:bg-[#fbfdff] dark:border-white/10 dark:hover:bg-white/[0.04]">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: page.color.startsWith('#') ? page.color : '#2468e5' }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{page.title}</span>
                <span className="mt-0.5 block text-xs text-[#778497] dark:text-[#adb8c8]">{page.type} · {relativeTime(page.updatedAt)}</span>
              </span>
              <ArrowUpRight size={15} className="shrink-0 text-[#a0afc2] transition group-hover:text-[#2468e5]" />
            </Link>
          )) : (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyList icon={NotebookPen} message="Your recently updated pages will appear here." href="/dashboard/notes" action="Create a note" />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function DashboardPage() {
  const dashboardQuery = useDashboard();

  if (dashboardQuery.isLoading) return <DashboardLoading />;
  if (dashboardQuery.error instanceof Error)
    return (
      <div className="rounded-2xl border border-[#ffd5d8] bg-[#fff7f7] p-6 text-center dark:border-rose-500/25 dark:bg-rose-500/10">
        <AlertTriangle className="mx-auto text-[#d95058]" size={22} />
        <h1 className="mt-3 text-lg font-semibold">Dashboard data could not load</h1>
        <p className="mt-1 text-sm text-[#7a6870] dark:text-[#dfb9bf]">{dashboardQuery.error.message}</p>
        <button type="button" onClick={() => void dashboardQuery.refetch()} className="mt-4 rounded-xl bg-[#2468e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c58c8]">
          Try again
        </button>
      </div>
    );
  if (!dashboardQuery.data) return null;

  return (
    <div className="animate-[rise_500ms_cubic-bezier(0.16,1,0.3,1)_both] pb-5">
      <DashboardContent data={dashboardQuery.data} />
    </div>
  );
}
