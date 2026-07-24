'use client';

import {
  Archive,
  ChevronRight,
  Copy,
  FilePlus2,
  FileText,
  Folder,
  MoreHorizontal,
  Plus,
  Share2,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Page = {
  id: number;
  title: string;
  template: string;
  description: string;
  isFavorite: boolean;
  updatedAt: string;
  updatedByUser: { name: string | null; imageUrl: string | null };
};
type Space = {
  id: number;
  name: string;
  description: string;
  color: string;
  isFavorite: boolean;
  archivedAt: string | null;
};
type Profile = {
  clerkId: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
};
const templates = [
  'Blank Page',
  'Project Plan',
  'Meeting Notes',
  'PRD',
  'Research Notes',
  'Task Plan',
];
async function request<T = { item: Space }>(
  url: string,
  options?: RequestInit,
) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data;
}
const relative = (value: string) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  return minutes < 1
    ? 'Just now'
    : minutes < 60
      ? `${minutes}m ago`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)}h ago`
        : new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
          }).format(new Date(value));
};

function PageDialog({
  spaceId,
  onClose,
  onCreated,
}: {
  spaceId: number;
  onClose: () => void;
  onCreated: (page: Page) => void;
}) {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('Blank Page');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
        aria-label="Close dialog"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          void request<{ item: Page }>(`/api/spaces/${spaceId}/pages`, {
            method: 'POST',
            body: JSON.stringify({ title, template }),
          })
            .then(({ item }) => {
              onCreated(item);
              onClose();
            })
            .catch((reason) =>
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Could not create page.',
              ),
            )
            .finally(() => setSaving(false));
        }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">Create a new Page</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a focused starting point for this Space.
        </p>
        <label className="mt-5 block text-sm font-medium">
          Page name
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Template
          <select
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            {templates.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            disabled={!title.trim() || saving}
            className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Page'}
          </button>
        </div>
      </form>
    </div>
  );
}

function InviteDialog({
  spaceId,
  onClose,
}: {
  spaceId: number;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
        aria-label="Close dialog"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          void request(`/api/spaces/${spaceId}/collaborators`, {
            method: 'POST',
            body: JSON.stringify({ email }),
          })
            .then(onClose)
            .catch((reason) =>
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Could not invite collaborator.',
              ),
            )
            .finally(() => setSaving(false));
        }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">Invite collaborators</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          They need an existing Flowbase account.
        </p>
        <label className="mt-5 block text-sm font-medium">
          Email
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            disabled={!email || saving}
            className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'Inviting…' : 'Invite'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function SpaceDetail({ spaceId }: { spaceId: number }) {
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      const data = await request<{ space: Space; pages: Page[] }>(
        `/api/spaces/${spaceId}`,
      );
      setSpace(data.space);
      setPages(data.pages);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not load this space.',
      );
    }
  };
  useEffect(() => {
    void load();
  }, [spaceId]);
  const pageAction = async (page: Page, body: Record<string, unknown>) => {
    const data = await request<{ item: Page }>(
      `/api/spaces/${spaceId}/pages/${page.id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    if (body.duplicate) setPages((current) => [data.item, ...current]);
    else
      setPages((current) =>
        current.map((entry) =>
          entry.id === page.id ? { ...entry, ...data.item } : entry,
        ),
      );
  };
  if (!space && !error)
    return (
      <div className="grid min-h-80 place-items-center text-sm text-muted-foreground">
        Loading Space…
      </div>
    );
  if (!space)
    return (
      <div className="grid min-h-80 place-items-center text-sm text-destructive">
        {error}
      </div>
    );
  return (
    <section className="mx-auto max-w-[1320px] pb-10">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/spaces" className="hover:text-primary">
          All Spaces
        </Link>
        <ChevronRight size={15} />
        <span className="truncate text-foreground">{space.name}</span>
      </nav>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Folder size={23} />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.05em]">
              {space.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
              {space.description ? ` · ${space.description}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium hover:bg-secondary"
          >
            <Users size={16} />
            Invite
          </button>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <FilePlus2 size={16} />
            New Page
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid size-10 place-items-center rounded-xl border border-border hover:bg-secondary"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setInviteOpen(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Share2 size={15} />
                  Invite collaborators
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void request(`/api/spaces/${space.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ duplicate: true }),
                    }).then(({ item }: { item: Space }) =>
                      router.push(`/dashboard/spaces/${item.id}`),
                    )
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Copy size={15} />
                  Duplicate Space
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void request(`/api/spaces/${space.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ archived: true }),
                    }).then(() => router.push('/dashboard/spaces'))
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Archive size={15} />
                  Archive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${space.name}?`))
                      void request(`/api/spaces/${space.id}`, {
                        method: 'DELETE',
                      }).then(() => router.push('/dashboard/spaces'));
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(0,1.8fr)_1fr_0.8fr_0.9fr_3rem] gap-4 border-b border-border bg-secondary/35 px-5 py-3 text-xs font-semibold text-muted-foreground md:grid">
          <span>Page Name</span>
          <span>Type / Template</span>
          <span>Last Updated</span>
          <span>Updated By</span>
          <span />
        </div>
        {pages.length ? (
          pages.map((page) => (
            <div
              key={page.id}
              className="group grid gap-2 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[minmax(0,1.8fr)_1fr_0.8fr_0.9fr_3rem] md:items-center md:gap-4"
            >
              <button
                type="button"
                onClick={() =>
                  router.push(`/dashboard/spaces/${spaceId}/pages/${page.id}`)
                }
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <FileText size={17} className="shrink-0 text-primary" />
                <span className="truncate font-medium">{page.title}</span>
              </button>
              <span className="w-fit rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                {page.template}
              </span>
              <span className="text-sm text-muted-foreground">
                {relative(page.updatedAt)}
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {(page.updatedByUser.name ?? '?').slice(0, 2).toUpperCase()}
                </span>
                {page.updatedByUser.name ?? 'You'}
              </span>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() =>
                    void pageAction(page, { isFavorite: !page.isFavorite })
                  }
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                >
                  <Star
                    size={15}
                    className={
                      page.isFavorite ? 'fill-primary text-primary' : ''
                    }
                  />
                </button>
                <button
                  type="button"
                  onClick={() => void pageAction(page, { duplicate: true })}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                  aria-label="Duplicate page"
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => void pageAction(page, { archived: true })}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                  aria-label="Archive page"
                >
                  <Archive size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="grid min-h-64 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <FileText size={20} />
              </span>
              <h2 className="mt-4 font-semibold">
                This Space is ready for its first Page
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a document to start planning and collecting work here.
              </p>
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus size={16} />
                New Page
              </button>
            </div>
          </div>
        )}
      </div>
      {newOpen ? (
        <PageDialog
          spaceId={spaceId}
          onClose={() => setNewOpen(false)}
          onCreated={(page) => {
            setPages((current) => [
              { ...page, updatedByUser: { name: 'You', imageUrl: null } },
              ...current,
            ]);
            router.push(`/dashboard/spaces/${spaceId}/pages/${page.id}`);
          }}
        />
      ) : null}
      {inviteOpen ? (
        <InviteDialog spaceId={spaceId} onClose={() => setInviteOpen(false)} />
      ) : null}
    </section>
  );
}
