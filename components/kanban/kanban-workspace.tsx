'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Flag,
  GripVertical,
  LayoutPanelTop,
  Loader2,
  MessageCircle,
  NotebookPen,
  Palette,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Composer, LiveblocksUiConfig, Thread } from '@liveblocks/react-ui';
import '@liveblocks/react-ui/styles.css';

import { RoomProvider, useBroadcastEvent, useEventListener, useOthers, useThreads } from '@/liveblocks.config';
import { roomIdForBoard } from '@/lib/liveblocks';

type Board = { id: number; name: string; color: string };
type Column = { id: number; boardId: number; name: string; position: number };
type Task = {
  id: number;
  boardId: number;
  columnId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  labels: string;
  syncCalendar: boolean;
  linkedToNotes: boolean;
  calendarItemId: number | null;
  position: number;
};

const colors = [
  { id: 'coral', label: 'Coral', className: 'bg-primary' },
  { id: 'amber', label: 'Amber', className: 'bg-amber-400' },
  { id: 'mint', label: 'Mint', className: 'bg-emerald-400' },
  { id: 'lilac', label: 'Lilac', className: 'bg-violet-400' },
  { id: 'sky', label: 'Sky', className: 'bg-sky-400' },
];
const labelStyles: Record<string, string> = {
  Focus: 'bg-primary/15 text-primary',
  Team: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  Personal:
    'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  Feature:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Bug: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};
const priorities: Record<string, string> = {
  low: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  medium: 'text-amber-700 bg-amber-50 dark:bg-amber-500/10',
  high: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10',
};
const today = () => {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function KanbanWorkspace({
  initialBoards,
  initialColumns,
  initialTasks,
}: {
  initialBoards: Board[];
  initialColumns: Column[];
  initialTasks: Task[];
}) {
  const [boards, setBoards] = useState(initialBoards);
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(
    initialBoards[0]?.id ?? null,
  );
  const [boardDialog, setBoardDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState<{
    columnId: number;
    task?: Task;
  } | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('coral');
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [columnName, setColumnName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [commentTask, setCommentTask] = useState<Task | null>(null);

  const selectedBoard = boards.find((board) => board.id === selectedBoardId);
  const boardColumns = useMemo(
    () =>
      columns
        .filter((column) => column.boardId === selectedBoardId)
        .sort((a, b) => a.position - b.position),
    [columns, selectedBoardId],
  );
  const colorClass = (id: string) =>
    colors.find((color) => color.id === id)?.className || 'bg-primary';
  const request = async (action: string, data: Record<string, unknown>) => {
    const response = await fetch('/api/kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Something went wrong.');
    return result;
  };
  const refreshWorkspace = async () => {
    const response = await fetch('/api/kanban');
    if (!response.ok) return;
    const result = await response.json();
    setBoards(result.boards);
    setColumns(result.columns);
    setTasks(result.tasks);
  };
  const notifyBoardMutation = (boardId: number) => {
    window.dispatchEvent(
      new CustomEvent('flowbase-kanban-mutated', { detail: boardId }),
    );
  };

  const createBoard = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await request('createBoard', {
        name: newBoardName,
        color: newBoardColor,
      });
      setBoards((current) => [result.board, ...current]);
      setColumns((current) => [...current, ...result.columns]);
      setSelectedBoardId(result.board.id);
      setNewBoardName('');
      setNewBoardColor('coral');
      setBoardDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create board.');
    } finally {
      setSaving(false);
    }
  };
  const createColumn = async () => {
    if (!selectedBoardId) return;
    const name = window.prompt('Column name');
    if (!name?.trim()) return;
    try {
      const result = await request('createColumn', {
        boardId: selectedBoardId,
        name,
      });
      setColumns((current) => [...current, result.column]);
      notifyBoardMutation(selectedBoardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add column.');
    }
  };
  const saveColumn = async (column: Column) => {
    if (!columnName.trim()) return;
    try {
      const result = await request('updateColumn', {
        boardId: column.boardId,
        columnId: column.id,
        name: columnName,
      });
      setColumns((current) =>
        current.map((item) => (item.id === column.id ? result.column : item)),
      );
      setEditingColumn(null);
      notifyBoardMutation(column.boardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update column.');
    }
  };
  const deleteColumn = async (column: Column) => {
    if (
      !window.confirm(
        `Delete “${column.name}”? Its tasks will move to another column.`,
      )
    )
      return;
    try {
      const result = await request('deleteColumn', {
        boardId: column.boardId,
        columnId: column.id,
      });
      setColumns((current) =>
        current.filter((item) => item.id !== result.deletedId),
      );
      setTasks((current) =>
        current.map((item) =>
          item.columnId === result.deletedId
            ? { ...item, columnId: result.fallbackId }
            : item,
        ),
      );
      notifyBoardMutation(column.boardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete column.');
    }
  };
  const moveTask = async (taskId: number, targetColumnId: number) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.columnId === targetColumnId || !selectedBoardId) return;
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, columnId: targetColumnId } : item,
      ),
    );
    try {
      const result = await request('moveTask', {
        boardId: selectedBoardId,
        taskId,
        targetColumnId,
      });
      setTasks((current) =>
        current.map((item) => (item.id === taskId ? result.task : item)),
      );
      notifyBoardMutation(selectedBoardId);
    } catch (err) {
      setTasks((current) =>
        current.map((item) => (item.id === taskId ? task : item)),
      );
      setError(err instanceof Error ? err.message : 'Could not move task.');
    }
  };
  const deleteTask = async (task: Task) => {
    if (!selectedBoardId || !window.confirm(`Delete “${task.title}”?`)) return;
    try {
      await request('deleteTask', {
        boardId: selectedBoardId,
        taskId: task.id,
      });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      notifyBoardMutation(selectedBoardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete task.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 sm:p-5 lg:px-8 lg:py-5">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-primary">
            <LayoutPanelTop className="size-5" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Kanban / Tasks
            </h1>
          </div>
          <button
            onClick={() => setBoardDialog(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
          >
            <Plus className="size-4" /> New board
          </button>
        </div>
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <button onClick={() => setError('')}>
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="grid min-w-0 gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm lg:min-h-155">
            <div className="mb-3 flex items-center justify-between px-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Your boards
              </span>
              <Palette className="size-4 text-primary" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => setSelectedBoardId(board.id)}
                  className={`group flex min-w-44 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${selectedBoardId === board.id ? 'bg-secondary font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`}
                >
                  <span
                    className={`size-3 shrink-0 rounded-full ${colorClass(board.color)}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{board.name}</span>
                  <ChevronRight
                    className={`size-4 transition ${selectedBoardId === board.id ? 'text-primary' : 'opacity-0 group-hover:opacity-100'}`}
                  />
                </button>
              ))}
            </div>
            {!boards.length && (
              <div className="p-4 text-center text-sm leading-6 text-muted-foreground">
                Create a board to start shaping your work.
              </div>
            )}
            <button
              onClick={() => setBoardDialog(true)}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-secondary/50 hover:text-primary"
            >
              <Plus className="size-4" /> Create board
            </button>
          </aside>
          <BoardRoom board={selectedBoard} onRemoteMutation={refreshWorkspace}>
            <main className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            {selectedBoard ? (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`size-4 rounded-full ${colorClass(selectedBoard.color)}`}
                    />
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedBoard.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {boardColumns.length} of 5 columns
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ActiveCollaborators onOpen={() => setCollaborationOpen(true)} />
                    <button onClick={() => setCollaborationOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"><Share2 className="size-4" /> Collaboration</button>
                    <button disabled={boardColumns.length >= 5} onClick={createColumn} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"><Plus className="size-4" /> Add column</button>
                  </div>
                </div>
                <div className="flex min-h-127.5 gap-4 overflow-x-auto pb-3">
                  {boardColumns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      tasks={tasks
                        .filter((task) => task.columnId === column.id)
                        .sort((a, b) => a.position - b.position)}
                      editing={editingColumn === column.id}
                      columnName={columnName}
                      onColumnName={setColumnName}
                      onEditColumn={() => {
                        setEditingColumn(column.id);
                        setColumnName(column.name);
                      }}
                      onSaveColumn={() => saveColumn(column)}
                      onDeleteColumn={() => deleteColumn(column)}
                      onAddTask={() => setTaskDialog({ columnId: column.id })}
                      onEditTask={(task) =>
                        setTaskDialog({ columnId: column.id, task })
                      }
                      onDeleteTask={deleteTask}
                      onDropTask={moveTask}
                      onOpenComments={setCommentTask}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyBoard onCreate={() => setBoardDialog(true)} />
            )}
            </main>
            {commentTask && <TaskCommentsPanel task={commentTask} onClose={() => setCommentTask(null)} />}
          </BoardRoom>
        </div>
      </div>
      {boardDialog && (
        <Modal
          title="Create a Kanban board"
          onClose={() => setBoardDialog(false)}
        >
          <form onSubmit={createBoard} className="space-y-5">
            <label className="block text-sm font-semibold">
              Board name
              <input
                autoFocus
                value={newBoardName}
                onChange={(event) => setNewBoardName(event.target.value)}
                placeholder="e.g. Product launch"
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 outline-none ring-primary/30 focus:ring-4"
              />
            </label>
            <div>
              <p className="text-sm font-semibold">Board color</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    type="button"
                    title={color.label}
                    key={color.id}
                    onClick={() => setNewBoardColor(color.id)}
                    className={`size-9 rounded-full ${color.className} ring-offset-2 ring-offset-card transition ${newBoardColor === color.id ? 'ring-2 ring-foreground' : 'hover:scale-110'}`}
                  />
                ))}
              </div>
            </div>
            <button
              disabled={saving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />} Create
              board
            </button>
          </form>
        </Modal>
      )}
      {taskDialog && (
        <TaskDialog
          boardId={selectedBoardId!}
          columnId={taskDialog.columnId}
          task={taskDialog.task}
          onClose={() => setTaskDialog(null)}
          onSaved={(task, isNew) => {
            setTasks((current) =>
              isNew
                ? [...current, task]
                : current.map((item) => (item.id === task.id ? task : item)),
            );
            setTaskDialog(null);
            notifyBoardMutation(selectedBoardId!);
          }}
        />
      )}
      {selectedBoard && collaborationOpen && <CollaborationDialog board={selectedBoard} onClose={() => setCollaborationOpen(false)} />}
    </div>
  );
}

function BoardRoom({ board, onRemoteMutation, children }: { board?: Board; onRemoteMutation: () => void; children: ReactNode }) {
  if (!board) return <>{children}</>;
  return <RoomProvider id={roomIdForBoard(board.id)} initialPresence={{}}><RealtimeBridge boardId={board.id} onRemoteMutation={onRemoteMutation} />{children}</RoomProvider>;
}

function RealtimeBridge({ boardId, onRemoteMutation }: { boardId: number; onRemoteMutation: () => void }) {
  const broadcast = useBroadcastEvent();
  useEventListener((message) => {
    if (message.event.type === 'board-mutated') onRemoteMutation();
  });
  useEffect(() => {
    const handler = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === boardId) broadcast({ type: 'board-mutated' });
    };
    window.addEventListener('flowbase-kanban-mutated', handler);
    return () => window.removeEventListener('flowbase-kanban-mutated', handler);
  }, [boardId, broadcast]);
  return null;
}

function ActiveCollaborators({ onOpen }: { onOpen: () => void }) {
  const others = useOthers();
  return <button onClick={onOpen} title="Open collaboration settings" className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-2 transition hover:border-primary/40"><Users className="mr-1.5 size-4 text-primary" />{others.slice(0, 3).map((user) => { const info = user.info; return <span key={user.connectionId} className="-ml-1 grid size-6 place-items-center overflow-hidden rounded-full border-2 border-card bg-primary text-[9px] font-bold text-primary-foreground">{info?.avatar ? <img src={info.avatar} alt="" className="size-full object-cover" /> : (info?.name || '?').slice(0, 2).toUpperCase()}</span>; })}<span className="ml-1 text-xs font-semibold text-muted-foreground">{others.length ? `${others.length} active` : 'Collaborate'}</span></button>;
}

function TaskCommentBadge({ taskId, onOpen }: { taskId: number; onOpen: () => void }) {
  const { threads = [] } = useThreads();
  const count = threads.filter((thread) => thread.metadata.taskId === String(taskId)).reduce((total, thread) => total + thread.comments.length, 0);
  return <button onClick={(event) => { event.stopPropagation(); onOpen(); }} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground transition hover:bg-secondary hover:text-primary" title="Open task comments"><MessageCircle className="size-3.5" />{count > 0 && <span className="text-[10px] font-bold">{count}</span>}</button>;
}

type CollaboratorProfile = { clerkId: string; name: string | null; email: string | null; imageUrl: string | null };
function CollaborationDialog({ board, onClose }: { board: Board; onClose: () => void }) {
  const [profiles, setProfiles] = useState<CollaboratorProfile[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { void fetch(`/api/kanban/${board.id}/collaborators`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setProfiles([data.owner, ...data.collaborators]); setIsOwner(data.isOwner); }).catch((err) => setError(err instanceof Error ? err.message : 'Could not load collaborators.')); }, [board.id]);
  const invite = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch(`/api/kanban/${board.id}/collaborators`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setProfiles((current) => current.some((profile) => profile.clerkId === data.collaborator.clerkId) ? current : [...current, data.collaborator]); setEmail(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not invite this user.'); } finally { setSaving(false); } };
  return <Modal title="Settings / Collaboration" onClose={onClose}><div className="space-y-5"><div className="rounded-xl bg-secondary/60 p-3"><p className="text-sm font-semibold">Shared with</p><div className="mt-3 space-y-2">{profiles.length ? profiles.map((profile, index) => <div key={profile.clerkId} className="flex items-center gap-3 rounded-lg bg-card p-2"><span className="grid size-8 place-items-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground">{profile.imageUrl ? <img src={profile.imageUrl} alt="" className="size-full object-cover" /> : (profile.name || profile.email || '?').slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{profile.name || 'Flowbase collaborator'}</span><span className="block truncate text-xs text-muted-foreground">{profile.email || 'No email available'}</span></span>{index === 0 && <span className="text-[10px] font-bold text-primary">OWNER</span>}</div>) : <p className="py-3 text-sm text-muted-foreground">No collaborators yet.</p>}</div></div>{isOwner && <form onSubmit={invite} className="space-y-3"><label className="block text-sm font-semibold">Invite by email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 outline-none ring-primary/30 focus:ring-4" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<button disabled={saving} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"><Share2 className="size-4" />{saving ? 'Inviting…' : 'Invite collaborator'}</button></form>}{!isOwner && <p className="rounded-xl border border-border p-3 text-sm text-muted-foreground">Only the board owner can invite collaborators.</p>}</div></Modal>;
}

function TaskCommentsPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const { threads = [] } = useThreads();
  const taskThreads = threads.filter((thread) => thread.metadata.taskId === String(task.id));
  return <LiveblocksUiConfig emojibaseUrl="https://unpkg.com/emojibase-data"><Modal title={`Comments · ${task.title}`} onClose={onClose}><div className="space-y-4"><p className="text-sm text-muted-foreground">Discuss this task with everyone who has access to the board.</p><div className="max-h-[48vh] space-y-3 overflow-y-auto">{taskThreads.length ? taskThreads.map((thread) => <Thread key={thread.id} thread={thread} />) : <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">No comments yet. Start the conversation below.</div>}</div><div className="rounded-xl border border-border bg-secondary/40 p-2"><Composer metadata={{ taskId: String(task.id) }} /></div></div></Modal></LiveblocksUiConfig>;
}

function KanbanColumn({
  column,
  tasks,
  editing,
  columnName,
  onColumnName,
  onEditColumn,
  onSaveColumn,
  onDeleteColumn,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDropTask,
  onOpenComments,
}: {
  column: Column;
  tasks: Task[];
  editing: boolean;
  columnName: string;
  onColumnName: (value: string) => void;
  onEditColumn: () => void;
  onSaveColumn: () => void;
  onDeleteColumn: () => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDropTask: (taskId: number, columnId: number) => void;
  onOpenComments: (task: Task) => void;
}) {
  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const id = Number(event.dataTransfer.getData('taskId'));
        if (id) onDropTask(id, column.id);
      }}
      className="w-70.5 shrink-0 rounded-2xl bg-secondary/55 p-3 dark:bg-secondary/45"
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <GripVertical className="size-4 text-muted-foreground" />
        {editing ? (
          <input
            autoFocus
            value={columnName}
            onChange={(event) => onColumnName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSaveColumn()}
            onBlur={onSaveColumn}
            className="min-w-0 flex-1 rounded-md border border-primary/30 bg-card px-2 py-1 text-sm font-bold outline-none"
          />
        ) : (
          <h3 className="flex-1 text-sm font-bold">
            {column.name}{' '}
            <span className="ml-1 font-medium text-muted-foreground">
              {tasks.length}
            </span>
          </h3>
        )}
        <div className="flex items-center">
          <button
            onClick={onEditColumn}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-card hover:text-primary"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onDeleteColumn}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-card hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task)}
            onOpenComments={() => onOpenComments(task)}
          />
        ))}
      </div>
      <button
        onClick={onAddTask}
        className="mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-card hover:text-primary"
      >
        <Plus className="size-4" /> Add task
      </button>
    </section>
  );
}
function TaskCard({
  task,
  onEdit,
  onDelete,
  onOpenComments,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onOpenComments: () => void;
}) {
  const labels = (() => {
    try {
      return JSON.parse(task.labels) as string[];
    } catch {
      return [];
    }
  })();
  return (
    <article
      draggable
      onDragStart={(event) =>
        event.dataTransfer.setData('taskId', String(task.id))
      }
      onClick={onEdit}
      className="group cursor-grab rounded-xl border border-border/70 bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md active:cursor-grabbing"
    >
        <div className="flex gap-2">
          <h4 className="min-w-0 flex-1 text-sm font-semibold leading-5">
            {task.title}
          </h4>
          <TaskCommentBadge taskId={task.id} onOpen={onOpenComments} />
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {labels.map((label) => (
          <span
            key={label}
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${labelStyles[label] || 'bg-secondary text-muted-foreground'}`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-bold capitalize ${priorities[task.priority] || priorities.medium}`}
        >
          <Flag className="size-3" />
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" />
            {new Date(`${task.dueDate}T12:00:00`).toLocaleDateString(
              undefined,
              { month: 'short', day: 'numeric' },
            )}
          </span>
        )}
        <span className="ml-auto flex gap-1">
          {task.syncCalendar && (
            <CalendarDays className="size-3.5 text-primary" />
          )}
          {task.linkedToNotes && (
            <NotebookPen className="size-3.5 text-violet-500" />
          )}
        </span>
      </div>
    </article>
  );
}
function TaskDialog({
  boardId,
  columnId,
  task,
  onClose,
  onSaved,
}: {
  boardId: number;
  columnId: number;
  task?: Task;
  onClose: () => void;
  onSaved: (task: Task, isNew: boolean) => void;
}) {
  const parsedLabels = (() => {
    try {
      return task ? (JSON.parse(task.labels) as string[]) : [];
    } catch {
      return [];
    }
  })();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || today());
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [labels, setLabels] = useState<string[]>(parsedLabels);
  const [syncCalendar, setSyncCalendar] = useState(task?.syncCalendar || false);
  const [linkedToNotes, setLinkedToNotes] = useState(
    task?.linkedToNotes || false,
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: task ? 'updateTask' : 'createTask',
          boardId,
          columnId,
          taskId: task?.id,
          title,
          description,
          dueDate,
          priority,
          labels,
          syncCalendar,
          linkedToNotes,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onSaved(result.task, !task);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save task.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={task ? 'Edit task' : 'Add task'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Title
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to happen?"
            className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 outline-none ring-primary/30 focus:ring-4"
          />
        </label>
        <label className="block text-sm font-semibold">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add context, links, or details…"
            className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-border bg-background p-3 outline-none ring-primary/30 focus:ring-4"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold">Labels</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(labelStyles).map((label) => (
              <button
                type="button"
                key={label}
                onClick={() =>
                  setLabels((current) =>
                    current.includes(label)
                      ? current.filter((item) => item !== label)
                      : [...current, label],
                  )
                }
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${labels.includes(label) ? labelStyles[label] + ' ring-1 ring-current' : 'bg-secondary text-muted-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Toggle
          checked={syncCalendar}
          onChange={setSyncCalendar}
          icon={<CalendarDays className="size-4 text-primary" />}
          title="Sync with Calendar"
          text={
            task?.syncCalendar
              ? 'Calendar event stays in sync'
              : 'Also add this task to Calendar'
          }
          disabled={Boolean(task?.syncCalendar)}
        />
        <Toggle
          checked={linkedToNotes}
          onChange={setLinkedToNotes}
          icon={<NotebookPen className="size-4 text-violet-500" />}
          title="Link with Notes"
          text="Mark this task as connected to Notes"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          disabled={saving}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {task ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </Modal>
  );
}
function Toggle({
  checked,
  onChange,
  icon,
  title,
  text,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: ReactNode;
  title: string;
  text: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 ${disabled ? 'opacity-70' : 'hover:bg-secondary/50'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-primary"
      />
      <span>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </label>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function EmptyBoard({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid min-h-130 place-items-center text-center">
      <div>
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
          <ClipboardList className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Your next board starts here</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Create a cozy space for the work you want to make progress on.
        </p>
        <button
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Create your first board
        </button>
      </div>
    </div>
  );
}
