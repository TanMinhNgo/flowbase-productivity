'use client';

import { PricingTable, UserButton, useClerk, useUser } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  Check,
  ChevronRight,
  CircleUserRound,
  Download,
  FilePenLine,
  FolderKanban,
  LockKeyhole,
  Palette,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import { WorkspaceLoading } from '@/components/ui/workspace-loading';
import { TemplateIcon } from '@/components/templates/template-renderer';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useSettings,
  useUpdateCategory,
  useUpdateSettings,
} from '@/hooks/api/use-settings';

type Settings = {
  theme: string;
  notificationsEnabled: boolean;
  calendarView: string;
  taskPriority: string;
  autoSave: boolean;
  aiModel: string;
  aiTone: string;
  aiBehavior: string;
  aiRefineEnabled: boolean;
  aiAssistantEnabled: boolean;
  aiTemplatesEnabled: boolean;
};
type Category = {
  id: number;
  scope: string;
  name: string;
  color: string;
  icon: string;
};
type Section =
  'profile' | 'subscription' | 'categories' | 'ai' | 'preferences' | 'privacy';

const sections: Array<[Section, string, typeof CircleUserRound]> = [
  ['profile', 'Profile', CircleUserRound],
  ['subscription', 'Subscription', Sparkles],
  ['categories', 'Categories', Tag],
  ['ai', 'AI Settings', Bot],
  ['preferences', 'Preferences', Palette],
  ['privacy', 'Privacy', ShieldCheck],
];
const scopes = [
  {
    id: 'calendar',
    label: 'Calendar events',
    hint: 'Used for scheduled work and planning blocks.',
    icon: 'CalendarDays',
  },
  {
    id: 'task',
    label: 'Tasks / Kanban',
    hint: 'Used as task categories alongside labels.',
    icon: 'ListTodo',
  },
  {
    id: 'note',
    label: 'Notes',
    hint: 'Used to organize personal and workspace notes.',
    icon: 'NotebookPen',
  },
  {
    id: 'reminder',
    label: 'Reminders',
    hint: 'Used for follow-ups and time-sensitive nudges.',
    icon: 'BellRing',
  },
];
const palette = [
  '#5BAE91',
  '#EF806F',
  '#E6A23C',
  '#4BA3C7',
  '#8B7CF6',
  '#94A3B8',
];
const iconChoices = [
  'Bell',
  'BookOpen',
  'Bot',
  'BriefcaseBusiness',
  'CalendarDays',
  'ClipboardList',
  'Focus',
  'Hammer',
  'Heart',
  'ListTodo',
  'NotebookPen',
  'Sparkles',
  'Tag',
  'Users',
];

function Card({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon?: typeof Bot;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[#eadfcd] bg-white p-5 shadow-[0_2px_5px_rgba(70,50,20,.08)] sm:p-6 ${className}`}
    >
      <h2 className="flex items-center gap-2 text-base font-bold text-[#2d2e37]">
        {Icon ? <Icon size={18} className="text-[#ef806f]" /> : null}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-[#eee2cf] bg-[#fff9ef] px-3">
      <div>
        <p className="text-sm font-semibold text-[#3d3d46]">{label}</p>
        {description ? (
          <p className="text-xs text-[#7b7a82]">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={label}
        aria-pressed={checked}
        onClick={onChange}
        className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-[#ef6250]' : 'bg-[#ece7dc]'}`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="rounded-lg border border-[#eee2cf] bg-[#fff9ef] p-3 text-sm font-semibold text-[#3d3d46]">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
const selectClass =
  'h-10 w-full rounded-lg border border-[#e9dfcf] bg-white px-3 text-sm font-medium text-[#4b4b55] outline-none focus:border-[#ef806f] focus:ring-2 focus:ring-[#ef806f]/15';

export function SettingsWorkspace() {
  const { user } = useUser();
  const clerk = useClerk();
  const [active, setActive] = useState<Section>('profile');
  const [categoryName, setCategoryName] = useState('');
  const [categoryScope, setCategoryScope] = useState('calendar');
  const [categoryColor, setCategoryColor] = useState(palette[0]);
  const [categoryIcon, setCategoryIcon] = useState('Tag');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [plan, setPlan] = useState({
    name: 'Free',
    status: 'active',
    renewal: '',
  });
  const settingsQuery = useSettings<{ settings: Settings }>();
  const categoryQuery = useCategories<{ items: Category[] }>();
  const updateSettings = useUpdateSettings<{ settings: Settings }>();
  const createCategory = useCreateCategory<{ item: Category }>();
  const updateCategory = useUpdateCategory<{ item: Category }>();
  const deleteCategory = useDeleteCategory();
  const categories = categoryQuery.data?.items ?? [];
  const groupedCategories = useMemo(
    () =>
      Object.fromEntries(
        scopes.map((scope) => [
          scope.id,
          categories.filter((item) => item.scope === scope.id),
        ]),
      ),
    [categories],
  );

  useEffect(() => {
    void clerk.billing
      .getSubscription({})
      .then((subscription) => {
        const item = subscription.subscriptionItems.find(
          (entry) => entry.status === 'active',
        );
        setPlan({
          name: item?.plan?.name ?? 'Free',
          status: subscription.status,
          renewal: item?.periodEnd ? item.periodEnd.toLocaleDateString() : '',
        });
      })
      .catch(() => undefined);
  }, [clerk]);

  if (settingsQuery.isLoading || categoryQuery.isLoading)
    return <WorkspaceLoading variant="editor" />;
  const settings = settingsQuery.data?.settings;
  if (!settings)
    return <p className="text-destructive">Could not load your settings.</p>;
  const save = (body: Record<string, unknown>) =>
    void updateSettings.mutate(body);
  const resetForm = () => {
    setCategoryName('');
    setCategoryScope('calendar');
    setCategoryColor(palette[0]);
    setCategoryIcon('Tag');
    setEditingId(null);
  };
  const submitCategory = async () => {
    if (!categoryName.trim()) return;
    const body = {
      name: categoryName.trim(),
      scope: categoryScope,
      color: categoryColor,
      icon: categoryIcon,
    };
    if (editingId) await updateCategory.mutateAsync({ id: editingId, body });
    else await createCategory.mutateAsync(body);
    resetForm();
  };
  const editCategory = (item: Category) => {
    setEditingId(item.id);
    setCategoryName(item.name);
    setCategoryScope(item.scope);
    setCategoryColor(item.color);
    setCategoryIcon(item.icon);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-full bg-[#fffaf1] px-1 pb-12 text-[#373741] sm:px-4">
      <header className="border-b border-[#eadfcd] py-6 sm:py-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#df7565]">
          <Palette size={16} /> Settings
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.04em] text-[#252631] sm:text-[31px]">
          Tune your Flowbase workspace.
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#777682]">
          Manage profile, plan, categories, AI defaults, privacy, and the little
          preferences that make the app feel like yours.
        </p>
      </header>
      <div className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-[#eadfcd] bg-white p-2.5 shadow-[0_2px_5px_rgba(70,50,20,.08)]">
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {sections.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${active === id ? 'bg-[#ffe8e4] text-[#df7565]' : 'text-[#666873] hover:bg-[#fff6eb]'}`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </aside>
        <main className="min-w-0">
          {active === 'profile' && (
            <div className="space-y-5">
              <Card title="Profile" icon={CircleUserRound}>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <img
                      src={user?.imageUrl ?? ''}
                      alt=""
                      className="size-14 rounded-full border border-[#eadfcd] bg-[#fff9ef]"
                    />
                    <div>
                      <p className="font-bold">
                        {user?.fullName || 'Flowbase member'}
                      </p>
                      <p className="text-sm text-[#777682]">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#777682]">
                      Edit profile in your account menu
                    </span>
                    <UserButton
                      appearance={{ elements: { avatarBox: 'size-9' } }}
                    />
                  </div>
                </div>
              </Card>
              <Card title="Account settings" icon={LockKeyhole}>
                <p className="text-sm leading-6 text-[#777682]">
                  Password, sign-in methods, connected accounts, and active
                  sessions are protected and managed by Clerk.
                </p>
              </Card>
            </div>
          )}
          {active === 'subscription' && (
            <div className="space-y-5">
              <Card title="Your subscription" icon={Sparkles}>
                <div className="flex flex-col justify-between gap-4 rounded-lg border border-[#eee2cf] bg-[#fff9ef] p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold">
                      {plan.name} plan{' '}
                      <span className="ml-2 rounded-full bg-[#e6f7ef] px-2 py-0.5 text-xs text-[#3c9871]">
                        {plan.status}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[#777682]">
                      {plan.renewal
                        ? `Renews ${plan.renewal}`
                        : plan.name.toLowerCase() === 'pro'
                          ? 'Unlimited workspace and AI access.'
                          : '20 AI requests/month · 3 boards · 3 templates · 5 spaces.'}
                    </p>
                  </div>
                  <Check className="text-[#5bae91]" />
                </div>
              </Card>
              <Card title="Plans and billing" icon={Sparkles}>
                <PricingTable
                  for="user"
                  highlightedPlan="pro"
                  newSubscriptionRedirectUrl="/dashboard/settings"
                />
              </Card>
            </div>
          )}
          {active === 'categories' && (
            <div className="space-y-5">
              <Card title="Dynamic Categories" icon={Tag}>
                <div className="rounded-lg border border-[#eee2cf] bg-[#fff9ef] p-4">
                  <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
                    <Field label="Scope">
                      <select
                        value={categoryScope}
                        onChange={(e) => setCategoryScope(e.target.value)}
                        className={selectClass}
                      >
                        {scopes.map((scope) => (
                          <option key={scope.id} value={scope.id}>
                            {scope.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Name">
                      <input
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="Category name"
                        className={selectClass}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => void submitCategory()}
                      disabled={
                        !categoryName.trim() ||
                        createCategory.isPending ||
                        updateCategory.isPending
                      }
                      className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ef9b8d] px-4 text-sm font-bold text-white hover:bg-[#ef806f] disabled:opacity-50"
                    >
                      <Plus size={16} />
                      {editingId ? 'Save' : 'Add'}
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold">Color</p>
                      <div className="flex flex-wrap gap-2">
                        {palette.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={color}
                            onClick={() => setCategoryColor(color)}
                            className={`grid size-10 place-items-center rounded-lg border bg-white ${categoryColor === color ? 'border-[#444] ring-1 ring-[#444]' : 'border-[#eee2cf]'}`}
                          >
                            <span
                              className="size-5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold">Icon</p>
                      <div className="flex flex-wrap gap-2">
                        {iconChoices.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            aria-label={icon}
                            onClick={() => setCategoryIcon(icon)}
                            className={`grid size-10 place-items-center rounded-lg border bg-white ${categoryIcon === icon ? 'border-[#444] ring-1 ring-[#444]' : 'border-[#eee2cf]'}`}
                          >
                            <TemplateIcon name={icon} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="mt-3 text-sm font-semibold text-[#df7565]"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </Card>
              <div className="grid gap-4 xl:grid-cols-2">
                {scopes.map((scope) => (
                  <Card key={scope.id} title={scope.label} icon={Tag}>
                    <p className="-mt-2 mb-4 text-xs text-[#777682]">
                      {scope.hint}
                    </p>
                    <div className="space-y-2">
                      {groupedCategories[scope.id].length ? (
                        groupedCategories[scope.id].map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg border border-[#eee2cf] bg-white p-3"
                          >
                            <span
                              className="grid size-9 place-items-center rounded-lg text-white"
                              style={{ backgroundColor: item.color }}
                            >
                              <TemplateIcon name={item.icon} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold">
                                {item.name}
                              </p>
                              <p className="text-xs text-[#777682]">
                                {item.color.toUpperCase()}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => editCategory(item)}
                              className="rounded-md p-2 text-[#6f717c] hover:bg-[#fff1e8] hover:text-[#df7565]"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void deleteCategory.mutateAsync(item.id)
                              }
                              className="rounded-md p-2 text-[#6f717c] hover:bg-red-50 hover:text-red-500"
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-lg border border-dashed border-[#eadfcd] px-3 py-5 text-center text-sm text-[#8a8990]">
                          No categories yet.
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {active === 'ai' && (
            <Card title="AI Settings" icon={Bot}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Preferred model">
                  <select
                    value={settings.aiModel}
                    onChange={(e) => save({ aiModel: e.target.value })}
                    className={selectClass}
                  >
                    <option value="gpt-5.6-luna">Flowbase Smart</option>
                  </select>
                </Field>
                <Field label="Default behavior">
                  <select
                    value={settings.aiBehavior}
                    onChange={(e) => save({ aiBehavior: e.target.value })}
                    className={selectClass}
                  >
                    {['concise', 'detailed', 'structured'].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tone / style">
                  <select
                    value={settings.aiTone}
                    onChange={(e) => save({ aiTone: e.target.value })}
                    className={selectClass}
                  >
                    {['balanced', 'friendly', 'professional', 'direct'].map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </select>
                </Field>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Toggle
                  checked={settings.aiRefineEnabled}
                  onChange={() =>
                    save({ aiRefineEnabled: !settings.aiRefineEnabled })
                  }
                  label="AI Refine"
                />
                <Toggle
                  checked={settings.aiAssistantEnabled}
                  onChange={() =>
                    save({ aiAssistantEnabled: !settings.aiAssistantEnabled })
                  }
                  label="AI Assistant"
                />
                <Toggle
                  checked={settings.aiTemplatesEnabled}
                  onChange={() =>
                    save({ aiTemplatesEnabled: !settings.aiTemplatesEnabled })
                  }
                  label="AI Template Builder"
                />
                <Toggle
                  checked={true}
                  onChange={() => undefined}
                  label="AI Diagram"
                  description="Available with your AI workspace."
                />
              </div>
            </Card>
          )}
          {active === 'preferences' && (
            <Card title="App Preferences" icon={Palette}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Theme">
                  <select
                    value={settings.theme}
                    onChange={(e) => save({ theme: e.target.value })}
                    className={selectClass}
                  >
                    {['system', 'light', 'dark'].map((value) => (
                      <option key={value}>
                        {value[0].toUpperCase() + value.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Default calendar view">
                  <select
                    value={settings.calendarView}
                    onChange={(e) => save({ calendarView: e.target.value })}
                    className={selectClass}
                  >
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                  </select>
                </Field>
                <Field label="Default task priority">
                  <select
                    value={settings.taskPriority}
                    onChange={(e) => save({ taskPriority: e.target.value })}
                    className={selectClass}
                  >
                    {['low', 'medium', 'high'].map((value) => (
                      <option key={value}>
                        {value[0].toUpperCase() + value.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Toggle
                  checked={settings.autoSave}
                  onChange={() => save({ autoSave: !settings.autoSave })}
                  label="Auto-save"
                />
              </div>
              <div className="mt-4">
                <Toggle
                  checked={settings.notificationsEnabled}
                  onChange={() =>
                    save({
                      notificationsEnabled: !settings.notificationsEnabled,
                    })
                  }
                  label="In-app notifications"
                  description="Receive productivity reminders and workspace updates."
                />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-[#eee2cf] bg-[#fff9ef] p-4">
                <div>
                  <p className="font-bold">Data export</p>
                  <p className="text-sm text-[#777682]">
                    Download your Flowbase data as JSON.
                  </p>
                </div>
                <a
                  href="/api/export"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e4d9c8] bg-white px-3 py-2 text-sm font-bold hover:bg-[#fff5e8]"
                >
                  <Download size={15} />
                  Export data
                </a>
              </div>
            </Card>
          )}
          {active === 'privacy' && (
            <Card title="Privacy and Security" icon={ShieldCheck}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Toggle
                  checked={false}
                  onChange={() => undefined}
                  label="Privacy mode"
                  description="Keep workspace activity private to your account."
                />
                <Toggle
                  checked={false}
                  onChange={() => undefined}
                  label="Dismiss MFA reminder"
                />
                <div className="rounded-lg border border-[#eee2cf] bg-[#fff9ef] p-4">
                  <LockKeyhole size={18} className="text-[#df7565]" />
                  <p className="mt-4 font-bold">Authentication</p>
                  <p className="mt-1 text-sm leading-6 text-[#777682]">
                    Profile, passwordless sign-in, connected accounts, and
                    sessions are managed by Clerk.
                  </p>
                </div>
                <div className="rounded-lg border border-[#eee2cf] bg-[#fff9ef] p-4">
                  <FolderKanban size={18} className="text-[#df7565]" />
                  <p className="mt-4 font-bold">User-scoped data</p>
                  <p className="mt-1 text-sm leading-6 text-[#777682]">
                    Settings and categories are saved to your signed-in Flowbase
                    account.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
