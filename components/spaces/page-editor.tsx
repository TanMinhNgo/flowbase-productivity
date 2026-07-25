'use client';

import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Archive,
  ArrowLeft,
  Bold,
  CheckSquare,
  Copy,
  Download,
  FileText,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  MoreHorizontal,
  Quote,
  Redo2,
  Share2,
  Star,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkspaceLoading } from '@/components/ui/workspace-loading';

type Page = {
  id: number;
  title: string;
  template: string;
  description: string;
  content: string;
  plainText: string;
  isFavorite: boolean;
  updatedAt: string;
  updatedBy: string;
};
type Space = { id: number; name: string };
async function request<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data;
}
const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };

export function SpacePageEditor({
  spaceId,
  pageId,
}: {
  spaceId: number;
  pageId: number;
}) {
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [status, setStatus] = useState<
    'loading' | 'saved' | 'saving' | 'error'
  >('loading');
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef<Page | null>(null);
  const loadedEditorPageId = useRef<number | null>(null);
  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      const data = await request<{ item: Page }>(
        `/api/spaces/${spaceId}/pages/${pageId}`,
        { method: 'PATCH', body: JSON.stringify(body) },
      );
      setPage((current) =>
        current ? { ...current, ...data.item } : data.item,
      );
      return data.item;
    },
    [spaceId, pageId],
  );
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Press / for commands' }),
    ],
    content: emptyDoc,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'spaces-editor min-h-[42vh] px-5 py-7 outline-none sm:px-10',
      },
    },
    onUpdate: ({ editor: current }) => {
      if (!pageRef.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setStatus('saving');
      const content = JSON.stringify(current.getJSON());
      const plainText = current.getText();
      saveTimer.current = setTimeout(
        () =>
          void patch({ content, plainText })
            .then(() => setStatus('saved'))
            .catch((reason) => {
              setStatus('error');
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Could not save Page.',
              );
            }),
        700,
      );
    },
  });
  useEffect(() => {
    void request<{
      page: Page;
      space: Space;
      commentsCount: number;
      linkedTasksCount: number;
    }>(`/api/spaces/${spaceId}/pages/${pageId}`)
      .then((data) => {
        setPage(data.page);
        setSpace(data.space);
        setStatus('saved');
      })
      .catch((reason) => {
        setStatus('error');
        setError(
          reason instanceof Error ? reason.message : 'Could not load Page.',
        );
      });
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [spaceId, pageId]);
  useEffect(() => {
    if (!editor || !page || loadedEditorPageId.current === page.id) return;
    loadedEditorPageId.current = page.id;
    editor.commands.setContent(JSON.parse(page.content), { emitUpdate: false });
  }, [editor, page]);
  const exportPage = () => {
    if (!page) return;
    const blob = new Blob([`# ${page.title}\n\n${page.plainText}`], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${page.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'page'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };
  if (!page || !space)
    return error ? <div className="grid min-h-80 place-items-center text-sm text-destructive">{error}</div> : <WorkspaceLoading variant="editor" />;
  return (
    <section className="mx-auto max-w-270 pb-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/spaces/${spaceId}`}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <ArrowLeft size={15} /> {space.name}
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{page.title}</span>
      </div>
      <header className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {page.template}
          </span>
          <span
            className={`ml-auto text-xs ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {status === 'saving'
              ? 'Saving…'
              : status === 'error'
                ? 'Save failed'
                : 'Saved'}
          </span>
          <button
            type="button"
            onClick={() => void patch({ isFavorite: !page.isFavorite })}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
            aria-label="Favorite page"
          >
            <Star
              size={16}
              className={page.isFavorite ? 'fill-primary text-primary' : ''}
            />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label="Page actions"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() =>
                    void patch({ duplicate: true }).then((copy) =>
                      router.push(
                        `/dashboard/spaces/${spaceId}/pages/${copy.id}`,
                      ),
                    )
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Copy size={15} />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={exportPage}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Download size={15} />
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/spaces/${spaceId}`)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Share2 size={15} />
                  Share Space
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void patch({ archived: true }).then(() =>
                      router.push(`/dashboard/spaces/${spaceId}`),
                    )
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Archive size={15} />
                  Archive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${page.title}?`))
                      void request(`/api/spaces/${spaceId}/pages/${pageId}`, {
                        method: 'DELETE',
                      }).then(() =>
                        router.push(`/dashboard/spaces/${spaceId}`),
                      );
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
        <div className="px-5 pt-7 sm:px-10">
          <input
            value={page.title}
            onChange={(event) =>
              setPage({ ...page, title: event.target.value })
            }
            onBlur={(event) => {
              if (event.target.value.trim())
                void patch({ title: event.target.value });
            }}
            className="w-full bg-transparent text-3xl font-semibold tracking-tighter outline-none"
            aria-label="Page title"
          />
          <textarea
            value={page.description}
            onChange={(event) =>
              setPage({ ...page, description: event.target.value })
            }
            onBlur={(event) => void patch({ description: event.target.value })}
            placeholder="Add a short description"
            className="mt-3 min-h-12 w-full resize-none bg-transparent text-sm leading-6 text-muted-foreground outline-none"
          />
        </div>
        <div className="mt-5 flex items-center gap-1 overflow-x-auto border-y border-border bg-secondary/25 px-4 py-2 sm:px-8">
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`grid size-8 place-items-center rounded-lg ${editor?.isActive('bold') ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Bold"
            aria-label="Bold"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`grid size-8 place-items-center rounded-lg ${editor?.isActive('italic') ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Italic"
            aria-label="Italic"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`grid size-8 place-items-center rounded-lg ${editor?.isActive('underline') ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Underline"
            aria-label="Underline"
          >
            <UnderlineIcon size={15} />
          </button>
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${editor?.isActive('heading', { level: 1 }) ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Heading 1"
            aria-label="Heading 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${editor?.isActive('heading', { level: 2 }) ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Heading 2"
            aria-label="Heading 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${editor?.isActive('bulletList') ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Bullet list"
            aria-label="Bullet list"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${editor?.isActive('orderedList') ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Numbered list"
            aria-label="Numbered list"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${editor?.isActive('taskList') ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Checklist"
            aria-label="Checklist"
          >
            <CheckSquare size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${editor?.isActive('blockquote') ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Quote"
            aria-label="Quote"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${editor?.isActive('highlight') ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Highlight"
            aria-label="Highlight"
          >
            <Highlighter size={16} />
          </button>
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          <button
            type="button"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-35"
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-35"
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>
        <EditorContent editor={editor} />
      </header>
      <aside className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-4">
        <span className="flex items-center gap-2">
          <FileText size={15} className="text-primary" />
          {page.template}
        </span>
        <span>Space: {space.name}</span>
        <span>Comments: 0</span>
        <span>Linked tasks: 0</span>
        <span className="sm:col-span-4 text-xs text-muted-foreground">
          Last edited{' '}
          {new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(page.updatedAt))}
        </span>
      </aside>
    </section>
  );
}
