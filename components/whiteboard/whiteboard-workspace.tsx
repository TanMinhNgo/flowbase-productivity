'use client';

import dynamic from 'next/dynamic';
import {
  Check,
  ChevronDown,
  Download,
  FilePlus2,
  MoreHorizontal,
  PanelLeft,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  DiagramSpec,
  WhiteboardScene,
} from '@/components/whiteboard/excalidraw-canvas';

const ExcalidrawCanvas = dynamic(
  () =>
    import('@/components/whiteboard/excalidraw-canvas').then(
      (module) => module.ExcalidrawCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 animate-pulse bg-secondary/40" />
    ),
  },
);

type BoardColor = 'coral' | 'apricot' | 'rose' | 'violet' | 'sky' | 'mint';
type Board = {
  id: number;
  name: string;
  color: BoardColor;
  elements: string;
  appState: string;
  files: string;
  createdAt: string;
  updatedAt: string;
};
type SaveState = 'loading' | 'saved' | 'saving' | 'error';

const COLORS: Record<BoardColor, { label: string; dot: string; tint: string }> =
  {
    coral: { label: 'Coral', dot: 'bg-[#ff7e5f]', tint: 'bg-[#fff0eb]' },
    apricot: { label: 'Apricot', dot: 'bg-[#f7a24e]', tint: 'bg-[#fff3e3]' },
    rose: { label: 'Rose', dot: 'bg-[#df6287]', tint: 'bg-[#fff0f4]' },
    violet: { label: 'Violet', dot: 'bg-[#9b76d8]', tint: 'bg-[#f5f0ff]' },
    sky: { label: 'Sky', dot: 'bg-[#4f9eca]', tint: 'bg-[#eef8ff]' },
    mint: { label: 'Mint', dot: 'bg-[#46a68d]', tint: 'bg-[#eafaf5]' },
  };

function relativeTime(value: string) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data;
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function BoardForm({
  title,
  initialName = '',
  initialColor = 'coral',
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  initialName?: string;
  initialColor?: BoardColor;
  submitLabel: string;
  onSubmit: (name: string, color: BoardColor) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<BoardColor>(initialColor);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Give this space a clear, memorable name.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <X size={17} />
        </button>
      </div>
      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          setError('');
          void onSubmit(name, color)
            .catch((reason) =>
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Could not save whiteboard.',
              ),
            )
            .finally(() => setSaving(false));
        }}
      >
        <label className="block text-sm font-medium">
          Whiteboard name
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Product launch"
            className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <div>
          <p className="text-sm font-medium">Board color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(COLORS) as BoardColor[]).map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setColor(entry)}
                className={`grid size-9 place-items-center rounded-xl ${COLORS[entry].tint} ring-offset-2 ${color === entry ? 'ring-2 ring-primary' : ''}`}
                aria-label={COLORS[entry].label}
              >
                <span className={`size-3 rounded-full ${COLORS[entry].dot}`} />
                {color === entry ? (
                  <Check size={12} className="absolute text-white" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim() || saving}
            className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function WhiteboardWorkspace() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<SaveState>('loading');
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);
  const [diagramPrompt, setDiagramPrompt] = useState('');
  const [diagramBusy, setDiagramBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = boards.find((board) => board.id === selectedId) ?? null;
  const scene = useMemo<WhiteboardScene | null>(
    () =>
      selected
        ? {
            elements: selected.elements,
            appState: selected.appState,
            files: selected.files,
          }
        : null,
    [selected],
  );

  const replace = useCallback(
    (board: Board) =>
      setBoards((current) =>
        current
          .map((item) => (item.id === board.id ? board : item))
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
      ),
    [],
  );
  const load = useCallback(async () => {
    try {
      const data = await api<{ items: Board[] }>('/api/whiteboards');
      setBoards(data.items);
      setSelectedId((id) => id ?? data.items[0]?.id ?? null);
      setStatus('saved');
    } catch (reason) {
      setStatus('error');
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not load whiteboards.',
      );
    }
  }, []);
  useEffect(() => {
    void load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  const patch = useCallback(
    async (id: number, body: Record<string, unknown>) => {
      const data = await api<{ item: Board }>(`/api/whiteboards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      replace(data.item);
      return data.item;
    },
    [replace],
  );
  const create = async (name: string, color: BoardColor) => {
    const data = await api<{ item: Board }>('/api/whiteboards', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
    setBoards((current) => [data.item, ...current]);
    setSelectedId(data.item.id);
    setNewOpen(false);
    setMobileOpen(false);
  };
  const queueScene = useCallback(
    (nextScene: WhiteboardScene) => {
      if (!selected) return;
      const id = selected.id;
      setBoards((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, ...nextScene, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
      if (timer.current) clearTimeout(timer.current);
      setStatus('saving');
      timer.current = setTimeout(
        () =>
          void patch(id, nextScene)
            .then(() => setStatus('saved'))
            .catch((reason) => {
              setStatus('error');
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Could not save whiteboard.',
              );
            }),
        700,
      );
    },
    [patch, selected],
  );
  useEffect(() => {
    const openDiagram = () => setDiagramOpen(true);
    window.addEventListener('flowbase:open-diagram', openDiagram);
    return () => window.removeEventListener('flowbase:open-diagram', openDiagram);
  }, []);
  const generateDiagram = async () => {
    if (!diagramPrompt.trim()) return;
    setDiagramBusy(true);
    setError('');
    try {
      const diagram = await api<DiagramSpec>('/api/whiteboards/diagram', {
        method: 'POST',
        body: JSON.stringify({ prompt: diagramPrompt }),
      });
      window.dispatchEvent(
        new CustomEvent('flowbase:add-diagram', { detail: diagram }),
      );
      setDiagramOpen(false);
      setDiagramPrompt('');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not generate diagram.',
      );
    } finally {
      setDiagramBusy(false);
    }
  };
  const list = (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
      {boards.length ? (
        boards.map((board) => (
          <button
            key={board.id}
            type="button"
            onClick={() => {
              if (timer.current) clearTimeout(timer.current);
              setSelectedId(board.id);
              setStatus('saved');
              setMobileOpen(false);
            }}
            className={`mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${selectedId === board.id ? `${COLORS[board.color].tint} ring-1 ring-primary/20` : 'hover:bg-secondary/70'}`}
          >
            <span
              className={`size-2 shrink-0 rounded-full ${COLORS[board.color].dot}`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {board.name}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {relativeTime(board.updatedAt)}
              </span>
            </span>
          </button>
        ))
      ) : (
        <p className="px-4 py-10 text-center text-sm leading-6 text-muted-foreground">
          Create a board for sketches, plans, and visual thinking.
        </p>
      )}
    </div>
  );

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-[1600px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgba(117,72,53,0.08)]">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background/70 md:flex">
        <div className="p-3">
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            <FilePlus2 size={16} />
            New Whiteboard
          </button>
        </div>
        {list}
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/35"
            aria-label="Close board panel"
          />
          <aside className="relative flex h-full w-[min(22rem,88vw)] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between p-3">
              <strong>Whiteboards</strong>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid size-8 place-items-center rounded-lg hover:bg-secondary"
              >
                <X size={17} />
              </button>
            </div>
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
              >
                <FilePlus2 size={16} />
                New Whiteboard
              </button>
            </div>
            {list}
          </aside>
        </div>
      ) : null}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-20 flex min-h-16 flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2 sm:px-5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Open whiteboard list"
          >
            <PanelLeft size={18} />
          </button>
          {selected ? (
            <>
              <span
                className={`size-2 rounded-full ${COLORS[selected.color].dot}`}
              />
              <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight sm:text-lg">
                {selected.name}
              </h1>
              <div className="order-3 flex w-full items-center gap-2 overflow-x-auto pb-0.5 sm:order-0 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setDiagramOpen(true)}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                >
                  <Sparkles size={15} />
                  AI Diagram
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new Event('flowbase:export-png'))
                  }
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold shadow-sm hover:bg-secondary"
                >
                  <Download size={15} />
                  Export PNG
                </button>
                <span
                  className={`hidden whitespace-nowrap text-xs sm:inline ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {status === 'saving'
                    ? 'Saving…'
                    : status === 'error'
                      ? 'Save failed'
                      : 'Saved'}
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMoreOpen((current) => !current)}
                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm hover:bg-secondary"
                    aria-label="More board options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {moreOpen ? (
                    <div className="absolute right-0 top-11 z-30 w-40 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          setRenameOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                      >
                        <Pencil size={15} />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          setDeleteOpen(true);
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
            </>
          ) : (
            <>
              <div className="flex-1 text-sm text-muted-foreground">
                Select a whiteboard or create one to begin.
              </div>
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
              >
                <Plus size={15} />
                New Whiteboard
              </button>
            </>
          )}
        </header>
        {error ? (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {selected && scene ? (
          <ExcalidrawCanvas
            key={selected.id}
            boardId={selected.id}
            boardName={selected.name}
            scene={scene}
            onSceneChange={queueScene}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
              <Palette size={22} />
            </span>
            <h2 className="mt-4 text-xl font-semibold">
              Make room for visual thinking
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Start a whiteboard to sketch ideas, map a process, or turn a
              prompt into an editable diagram.
            </p>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <FilePlus2 size={16} />
              Create your first whiteboard
            </button>
          </div>
        )}
      </main>
      {newOpen ? (
        <BoardForm
          title="New whiteboard"
          submitLabel="Create whiteboard"
          onSubmit={create}
          onClose={() => setNewOpen(false)}
        />
      ) : null}
      {renameOpen && selected ? (
        <BoardForm
          title="Rename whiteboard"
          initialName={selected.name}
          initialColor={selected.color}
          submitLabel="Save changes"
          onSubmit={async (name, color) => {
            await patch(selected.id, { name, color });
            setRenameOpen(false);
          }}
          onClose={() => setRenameOpen(false)}
        />
      ) : null}
      {deleteOpen && selected ? (
        <Modal onClose={() => setDeleteOpen(false)}>
          <h2 className="text-lg font-semibold">Delete “{selected.name}”?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This permanently removes its drawing, sticky notes, and uploaded
            images.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="h-10 rounded-xl px-4 text-sm font-medium hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                void api(`/api/whiteboards/${selected.id}`, {
                  method: 'DELETE',
                }).then(() => {
                  setBoards((current) =>
                    current.filter((board) => board.id !== selected.id),
                  );
                  setSelectedId(
                    boards.find((board) => board.id !== selected.id)?.id ??
                      null,
                  );
                  setDeleteOpen(false);
                })
              }
              className="h-10 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground"
            >
              Delete board
            </button>
          </div>
        </Modal>
      ) : null}
      {diagramOpen ? (
        <Modal onClose={() => setDiagramOpen(false)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">AI Diagram</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Describe a flow, system, journey, or map.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDiagramOpen(false)}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
            >
              <X size={17} />
            </button>
          </div>
          <textarea
            autoFocus
            value={diagramPrompt}
            onChange={(event) => setDiagramPrompt(event.target.value)}
            placeholder="e.g. A user journey from signup to a successful first project"
            className="mt-5 min-h-28 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              'Flowchart',
              'Mind map',
              'System architecture',
              'User journey',
              'Process diagram',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setDiagramPrompt(`${example}: `)}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-secondary/70"
              >
                {example}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDiagramOpen(false)}
              className="h-10 rounded-xl px-4 text-sm font-medium hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!diagramPrompt.trim() || diagramBusy}
              onClick={() => void generateDiagram()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Sparkles size={15} />
              {diagramBusy ? 'Generating…' : 'Generate diagram'}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
