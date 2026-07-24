'use client';

import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Underline from '@tiptap/extension-underline';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  EditorContent,
  type Editor as TiptapEditor,
  useEditor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ArchiveRestore,
  Bold,
  Check,
  ChevronDown,
  CircleDot,
  Code2,
  Copy,
  FilePenLine,
  FilePlus2,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  LoaderCircle,
  Mic,
  PanelLeft,
  Pin,
  PinOff,
  Quote,
  Search,
  Sparkles,
  Strikethrough,
  Square,
  Trash2,
  Underline as UnderlineIcon,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAssemblyAIStreaming } from '@/hooks/use-assemblyai-streaming';

type NoteColor = 'coral' | 'apricot' | 'rose' | 'violet' | 'sky' | 'mint';
type Note = {
  id: number;
  title: string;
  content: string;
  plainText: string;
  color: NoteColor;
  isPinned: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
type SaveState = 'loading' | 'saved' | 'saving' | 'error';

const COLORS: Record<NoteColor, { label: string; dot: string; tint: string }> =
  {
    coral: { label: 'Coral', dot: 'bg-[#ff7e5f]', tint: 'bg-[#fff0eb]' },
    apricot: { label: 'Apricot', dot: 'bg-[#f7a24e]', tint: 'bg-[#fff3e3]' },
    rose: { label: 'Rose', dot: 'bg-[#df6287]', tint: 'bg-[#fff0f4]' },
    violet: { label: 'Violet', dot: 'bg-[#9b76d8]', tint: 'bg-[#f5f0ff]' },
    sky: { label: 'Sky', dot: 'bg-[#4f9eca]', tint: 'bg-[#eef8ff]' },
    mint: { label: 'Mint', dot: 'bg-[#46a68d]', tint: 'bg-[#eafaf5]' },
  };
const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };
const slashActions = [
  [
    'Text',
    FilePenLine,
    (editor: TiptapEditor) => editor.chain().focus().setParagraph().run(),
  ],
  [
    'Heading 1',
    Heading1,
    (editor: TiptapEditor) =>
      editor.chain().focus().setNode('heading', { level: 1 }).run(),
  ],
  [
    'Heading 2',
    Heading2,
    (editor: TiptapEditor) =>
      editor.chain().focus().setNode('heading', { level: 2 }).run(),
  ],
  [
    'Bullet list',
    List,
    (editor: TiptapEditor) => editor.chain().focus().toggleBulletList().run(),
  ],
  [
    'Numbered list',
    ListOrdered,
    (editor: TiptapEditor) => editor.chain().focus().toggleOrderedList().run(),
  ],
  [
    'Task list',
    ListChecks,
    (editor: TiptapEditor) => editor.chain().focus().toggleTaskList().run(),
  ],
  [
    'Quote',
    Quote,
    (editor: TiptapEditor) => editor.chain().focus().toggleBlockquote().run(),
  ],
  [
    'Code block',
    Code2,
    (editor: TiptapEditor) => editor.chain().focus().toggleCodeBlock().run(),
  ],
] as const;

function relativeTime(value: string) {
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
}
async function callApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data;
}

function IconButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-8 place-items-center rounded-lg transition ${active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}`}
    >
      {children}
    </button>
  );
}

function Editor({
  note,
  onChange,
  onAI,
}: {
  note: Note;
  onChange: (content: string, plainText: string) => void;
  onAI: (state: SaveState, message?: string) => void;
}) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [selection, setSelection] = useState('');
  const voiceInsertionRef = useRef<number | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Press / for commands' }),
      CharacterCount,
    ],
    content: EMPTY_DOC,
    editorProps: {
      attributes: { class: 'flowbase-editor focus:outline-none' },
    },
    onUpdate: ({ editor: current }) => {
      onChange(JSON.stringify(current.getJSON()), current.getText());
      const { $from } = current.state.selection;
      setSlashOpen(
        $from.parent.textContent.slice(0, $from.parentOffset).includes('/'),
      );
    },
  });
  useEffect(() => {
    if (!editor) return;
    try {
      editor.commands.setContent(JSON.parse(note.content), {
        emitUpdate: false,
      });
    } catch {
      editor.commands.setContent(EMPTY_DOC, { emitUpdate: false });
    }
    setSlashOpen(false);
    setAiOpen(false);
  }, [editor, note.id, note.content]);
  const insertVoiceTranscript = useCallback(
    (transcript: string) => {
      if (!editor) return;
      const documentEnd = editor.state.doc.content.size;
      const requestedPosition = voiceInsertionRef.current;
      const position =
        requestedPosition !== null &&
        requestedPosition >= 0 &&
        requestedPosition <= documentEnd
          ? requestedPosition
          : documentEnd;
      const previousCharacter =
        position > 0
          ? editor.state.doc.textBetween(position - 1, position, '')
          : '';
      const text = `${previousCharacter && !/\s/.test(previousCharacter) ? ' ' : ''}${transcript}`;
      editor.chain().focus().insertContentAt(position, text).run();
      voiceInsertionRef.current = position + text.length;
    },
    [editor],
  );
  const voice = useAssemblyAIStreaming({
    onFinalTranscript: insertVoiceTranscript,
  });
  if (!editor)
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        <LoaderCircle className="mr-2 size-4 animate-spin" />
        Loading editor
      </div>
    );
  const runSlash = (action: (current: TiptapEditor) => void) => {
    const { from } = editor.state.selection;
    const before = editor.state.doc.textBetween(
      Math.max(0, from - 100),
      from,
      '\n',
    );
    const slash = before.lastIndexOf('/');
    if (slash >= 0)
      editor
        .chain()
        .focus()
        .deleteRange({ from: from - (before.length - slash), to: from })
        .run();
    action(editor);
    setSlashOpen(false);
  };
  const refine = async (action: string) => {
    if (!selection) return;
    onAI('saving');
    try {
      const result = await callApi<{ text: string }>('/api/notes/refine', {
        method: 'POST',
        body: JSON.stringify({ action, text: selection }),
      });
      editor.chain().focus().insertContent(result.text).run();
      setAiOpen(false);
      onAI('saved');
    } catch (error) {
      onAI(
        'error',
        error instanceof Error ? error.message : 'AI Refine failed.',
      );
    }
  };
  const startVoice = () => {
    voiceInsertionRef.current = editor.isFocused
      ? editor.state.selection.from
      : editor.state.doc.content.size;
    void voice.start();
  };
  const menu = (
    <>
      <IconButton
        label="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() =>
          editor.chain().focus().setNode('heading', { level: 1 }).run()
        }
      >
        <Heading1 size={16} />
      </IconButton>
      <IconButton
        label="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() =>
          editor.chain().focus().setNode('heading', { level: 2 }).run()
        }
      >
        <Heading2 size={16} />
      </IconButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <IconButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={16} />
      </IconButton>
      <IconButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} />
      </IconButton>
      <IconButton
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={16} />
      </IconButton>
      <IconButton
        label="Strike through"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={16} />
      </IconButton>
      <IconButton
        label="Highlight"
        active={editor.isActive('highlight')}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter size={16} />
      </IconButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <IconButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </IconButton>
      <IconButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </IconButton>
      <IconButton
        label="Task list"
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListChecks size={16} />
      </IconButton>
      <IconButton
        label="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={16} />
      </IconButton>
      <IconButton
        label="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 size={16} />
      </IconButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <button
        type="button"
        onClick={voice.isRecording ? voice.stop : startVoice}
        className={`flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition ${voice.isRecording ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        aria-label={voice.isRecording ? 'Stop recording' : 'Speak to Note'}
      >
        {voice.isRecording ? (
          <Square size={12} fill="currentColor" />
        ) : (
          <Mic size={14} />
        )}
        <span className={voice.isRecording ? 'relative flex size-2' : 'hidden'}>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
        {voice.isRecording ? 'Stop' : 'Speak to Note'}
      </button>
    </>
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-y border-border bg-card/95 px-3 py-2 backdrop-blur">
        {menu}
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-10 lg:px-14">
        {voice.preview ? (
          <div className="mb-5 rounded-xl border border-primary/25 bg-secondary/65 px-3 py-2 text-sm leading-6 text-secondary-foreground">
            <span className="mr-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <Mic size={13} className="animate-pulse" />
              Listening
            </span>
            {voice.preview}
          </div>
        ) : null}
        {voice.error ? (
          <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {voice.error}
          </div>
        ) : null}
        {slashOpen ? (
          <div className="absolute left-5 top-4 z-20 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg sm:left-10 lg:left-14">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Insert block
            </p>
            {slashActions.map(([label, Icon, action]) => (
              <button
                key={label}
                type="button"
                onClick={() => runSlash(action)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"
              >
                <Icon size={15} className="text-primary" />
                {label}
              </button>
            ))}
          </div>
        ) : null}
        <EditorContent editor={editor} />
      </div>
      <BubbleMenu
        editor={editor}
        options={{ placement: 'top', offset: 8 }}
        className="flex items-center rounded-xl border border-border bg-card p-1 shadow-lg"
      >
        <IconButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </IconButton>
        <IconButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </IconButton>
        <div className="relative border-l border-border pl-1">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              const { from, to } = editor.state.selection;
              setSelection(editor.state.doc.textBetween(from, to, ' '));
              setAiOpen((current) => !current);
            }}
            className="flex h-8 items-center gap-1 rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground"
          >
            <Sparkles size={13} />
            AI Refine
            <ChevronDown size={12} />
          </button>
          {aiOpen ? (
            <div className="absolute bottom-10 right-0 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl">
              {[
                ['grammar', 'Improve grammar'],
                ['rephrase', 'Rephrase'],
                ['shorter', 'Make shorter'],
                ['longer', 'Make longer'],
                ['simplify', 'Simplify language'],
                ['tone', 'Change tone'],
              ].map(([action, label]) => (
                <button
                  key={action}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void refine(action)}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </BubbleMenu>
    </div>
  );
}

export function NotesWorkspace() {
  const [items, setItems] = useState<Note[]>([]);
  const [trash, setTrash] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [status, setStatus] = useState<SaveState>('loading');
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const visible = useMemo(
    () =>
      (showTrash ? trash : items).filter((note) =>
        `${note.title} ${note.plainText}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, trash, search, showTrash],
  );
  const load = useCallback(async () => {
    try {
      const data = await callApi<{ items: Note[]; trash: Note[] }>(
        '/api/notes',
      );
      setItems(data.items);
      setTrash(data.trash);
      setSelectedId((id) => id ?? data.items[0]?.id ?? null);
      setStatus('saved');
    } catch (reason) {
      setStatus('error');
      setError(
        reason instanceof Error ? reason.message : 'Could not load notes.',
      );
    }
  }, []);
  useEffect(() => {
    void load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);
  const replace = (note: Note) =>
    setItems((current) =>
      current
        .map((item) => (item.id === note.id ? note : item))
        .sort(
          (a, b) =>
            Number(b.isPinned) - Number(a.isPinned) ||
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    );
  const patch = async (id: number, body: Record<string, unknown>) => {
    const data = await callApi<{ item: Note }>(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    replace(data.item);
    return data.item;
  };
  const create = async () => {
    const data = await callApi<{ item: Note }>('/api/notes', {
      method: 'POST',
      body: '{}',
    });
    setItems((current) => [data.item, ...current]);
    setSelectedId(data.item.id);
    setShowTrash(false);
    setMobileOpen(false);
  };
  const saveContent = (content: string, plainText: string) => {
    if (!selected) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    const id = selected.id;
    timer.current = setTimeout(() => {
      void patch(id, { content, plainText })
        .then(() => setStatus('saved'))
        .catch((reason) => {
          setStatus('error');
          setError(
            reason instanceof Error ? reason.message : 'Could not save note.',
          );
        });
    }, 750);
  };
  const moveToTrash = async (note: Note) => {
    await callApi(`/api/notes/${note.id}`, { method: 'DELETE' });
    setItems((current) => current.filter((item) => item.id !== note.id));
    setTrash((current) => [
      { ...note, deletedAt: new Date().toISOString() },
      ...current,
    ]);
    if (selectedId === note.id)
      setSelectedId(items.find((item) => item.id !== note.id)?.id ?? null);
  };
  const restore = async (note: Note) => {
    const item = await patch(note.id, { deletedAt: null });
    setTrash((current) => current.filter((entry) => entry.id !== note.id));
    setItems((current) => [item, ...current]);
    setSelectedId(item.id);
    setShowTrash(false);
  };
  const noteList = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative px-3 pb-3">
        <Search
          size={15}
          className="pointer-events-none absolute left-6 top-2.5 text-muted-foreground"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={showTrash ? 'Search trash' : 'Search notes'}
          className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {visible.length ? (
          visible.map((note) => (
            <div
              key={note.id}
              className={`group relative mb-1 rounded-xl ${!showTrash && selectedId === note.id ? `${COLORS[note.color].tint} ring-1 ring-primary/20` : 'hover:bg-secondary/70'}`}
            >
              <button
                type="button"
                onClick={() => {
                  if (!showTrash) setSelectedId(note.id);
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${COLORS[note.color].dot}`}
                />
                <FilePenLine size={15} className="text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-sm font-medium">
                    {note.title}
                    {note.isPinned ? (
                      <Pin
                        size={12}
                        className="text-primary"
                        fill="currentColor"
                      />
                    ) : null}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {relativeTime(note.updatedAt)}
                  </span>
                </span>
              </button>
              <div className="absolute right-1 top-1 hidden rounded-lg bg-card/95 p-0.5 shadow-sm group-hover:flex">
                {showTrash ? (
                  <>
                    <IconButton
                      label="Restore"
                      onClick={() => void restore(note)}
                    >
                      <ArchiveRestore size={14} />
                    </IconButton>
                    <IconButton
                      label="Delete permanently"
                      onClick={() =>
                        void callApi(`/api/notes/${note.id}?permanent=true`, {
                          method: 'DELETE',
                        }).then(() =>
                          setTrash((current) =>
                            current.filter((item) => item.id !== note.id),
                          ),
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton
                      label={note.isPinned ? 'Unpin' : 'Pin'}
                      onClick={() =>
                        void patch(note.id, { isPinned: !note.isPinned })
                      }
                    >
                      <Pin
                        size={14}
                        fill={note.isPinned ? 'currentColor' : 'none'}
                      />
                    </IconButton>
                    <IconButton
                      label="Duplicate"
                      onClick={() =>
                        void patch(note.id, { duplicate: true }).then(
                          (data) => {
                            setItems((current) => [data, ...current]);
                            setSelectedId(data.id);
                          },
                        )
                      }
                    >
                      <Copy size={14} />
                    </IconButton>
                    <IconButton
                      label="Move to trash"
                      onClick={() => void moveToTrash(note)}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {showTrash ? 'Trash is empty.' : 'No notes found.'}
          </p>
        )}
      </div>
    </div>
  );
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-360 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgba(117,72,53,0.08)]">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background/70 md:flex">
        <div className="p-3">
          <button
            type="button"
            onClick={() => void create()}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            <FilePlus2 size={16} />
            New Note
          </button>
        </div>
        {noteList}
        <button
          type="button"
          onClick={() => {
            setShowTrash((current) => !current);
            setSearch('');
          }}
          className={`m-2 flex h-9 items-center gap-2 rounded-lg px-2 text-sm ${showTrash ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          <Trash2 size={15} />
          Trash {trash.length ? `(${trash.length})` : ''}
        </button>
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/30"
            aria-label="Close notes panel"
          />
          <aside className="relative flex h-full w-[min(22rem,88vw)] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between p-3">
              <strong>Notes</strong>
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
                onClick={() => void create()}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
              >
                <FilePlus2 size={16} />
                New Note
              </button>
            </div>
            {noteList}
            <button
              type="button"
              onClick={() => {
                setShowTrash((current) => !current);
                setSearch('');
              }}
              className="m-2 flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-secondary"
            >
              <Trash2 size={15} />
              Trash
            </button>
          </aside>
        </div>
      ) : null}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-20 flex min-h-16 items-center gap-2 border-b border-border bg-card px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Open notes panel"
          >
            <PanelLeft size={18} />
          </button>
          {selected ? (
            <>
              <input
                value={selected.title}
                onChange={(event) =>
                  replace({ ...selected, title: event.target.value })
                }
                onBlur={(event) => {
                  if (event.target.value.trim())
                    void patch(selected.id, { title: event.target.value });
                }}
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight outline-none"
                aria-label="Note title"
              />
              <span
                className={`hidden text-xs sm:inline ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {status === 'saving'
                  ? 'Saving...'
                  : status === 'error'
                    ? 'Save failed'
                    : 'Saved'}
              </span>
              <div className="group relative">
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                  aria-label="Choose note color"
                >
                  <CircleDot size={16} />
                </button>
                <div className="absolute right-0 top-9 z-30 hidden w-40 rounded-xl border border-border bg-card p-2 shadow-lg group-hover:block group-focus-within:block">
                  {(Object.keys(COLORS) as NoteColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => void patch(selected.id, { color })}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary"
                    >
                      <span
                        className={`size-2 rounded-full ${COLORS[color].dot}`}
                      />
                      {COLORS[color].label}
                      {selected.color === color ? (
                        <Check size={14} className="ml-auto text-primary" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
              <IconButton
                label={selected.isPinned ? 'Unpin note' : 'Pin note'}
                onClick={() =>
                  void patch(selected.id, { isPinned: !selected.isPinned })
                }
              >
                {selected.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              </IconButton>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Select a note or create one to start writing.
            </span>
          )}
        </header>
        {error ? (
          <div className="border-b border-destructive/20 bg-destructive/10 px-5 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {selected ? (
          <>
            <Editor
              key={selected.id}
              note={selected}
              onChange={saveContent}
              onAI={(next, message) => {
                setStatus(next);
                if (message) setError(message);
                else if (next === 'saved') setError('');
              }}
            />
            <footer className="flex items-center justify-between border-t border-border px-5 py-2 text-xs text-muted-foreground">
              <span>Press / for commands</span>
              <span>
                {selected.plainText.trim()
                  ? selected.plainText.trim().split(/\s+/).length
                  : 0}{' '}
                words
              </span>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
              <FilePenLine size={22} />
            </span>
            <h1 className="mt-4 text-xl font-semibold">
              Your notes, in one calm place
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Create a note to capture an idea, shape it with blocks, and refine
              it when you need a clearer draft.
            </p>
            <button
              type="button"
              onClick={() => void create()}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <FilePlus2 size={16} />
              Create your first note
            </button>
          </div>
        )}
      </main>
    </section>
  );
}
