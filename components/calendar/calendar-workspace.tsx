'use client';

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  GripVertical,
  Plus,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type CalendarItemData = {
  id: number;
  title: string;
  notes: string | null;
  kind: string;
  category: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
};

const categories = {
  work: {
    label: 'Work',
    dot: 'bg-[#2563eb]',
    chip: 'bg-[#e8f0ff] text-[#245ac1] dark:bg-[#203d70] dark:text-[#c7dcff]',
  },
  personal: {
    label: 'Personal',
    dot: 'bg-[#c45a91]',
    chip: 'bg-[#ffedf5] text-[#ad3e76] dark:bg-[#54243e] dark:text-[#ffc7df]',
  },
  meeting: {
    label: 'Meeting',
    dot: 'bg-[#d88324]',
    chip: 'bg-[#fff2df] text-[#ad6617] dark:bg-[#553b1c] dark:text-[#ffd49f]',
  },
  study: {
    label: 'Study',
    dot: 'bg-[#7557d9]',
    chip: 'bg-[#f0ebff] text-[#6545c5] dark:bg-[#382b68] dark:text-[#ddd1ff]',
  },
  health: {
    label: 'Health',
    dot: 'bg-[#168b70]',
    chip: 'bg-[#e4f8f0] text-[#11755e] dark:bg-[#173f36] dark:text-[#b7f4df]',
  },
} as const;

type Category = keyof typeof categories;
type FormState = {
  title: string;
  kind: 'task' | 'reminder';
  category: Category;
  date: string;
  time: string;
  notes: string;
  scheduled: boolean;
};

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(value: Date) {
  return addDays(value, -value.getDay());
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function formatTime(value: string | null) {
  if (!value) return '';
  const [hours, minutes] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2020, 0, 1, hours, minutes));
}

function categoryFor(item: CalendarItemData) {
  return categories[item.category as Category] ?? categories.work;
}

export function CalendarWorkspace({
  initialItems,
}: {
  initialItems: CalendarItemData[];
}) {
  const [today, setToday] = useState(() => new Date());
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(today);
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [view, setView] = useState<'month' | 'week'>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>({
    title: '',
    kind: 'task',
    category: 'work',
    date: dateKey(today),
    time: '',
    notes: '',
    scheduled: true,
  });
  const [editingItem, setEditingItem] = useState<CalendarItemData | null>(null);

  // Client components render once on Vercel too. Reset this state after
  // hydration so "Today" follows the visitor's local browser timezone.
  useEffect(() => {
    const localToday = new Date();
    const localDateKey = dateKey(localToday);
    setToday(localToday);
    setCursor(localToday);
    setSelectedDate(localDateKey);
    setForm((current) =>
      current.title === '' ? { ...current, date: localDateKey } : current,
    );
  }, []);

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [cursor]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        addDays(startOfWeek(cursor), index),
      ),
    [cursor],
  );
  const visibleDays = view === 'month' ? monthDays : weekDays;
  const drafts = items.filter((item) => !item.scheduledDate);

  const openCreate = (date = selectedDate, scheduled = true) => {
    setError('');
    setEditingItem(null);
    setForm({
      title: '',
      kind: 'task',
      category: 'work',
      date,
      time: '',
      notes: '',
      scheduled,
    });
    setModalOpen(true);
  };

  const openEdit = (item: CalendarItemData) => {
    setError('');
    setSelectedDate(item.scheduledDate ?? selectedDate);
    setEditingItem(item);
    setForm({
      title: item.title,
      kind: item.kind === 'reminder' ? 'reminder' : 'task',
      category:
        item.category in categories ? (item.category as Category) : 'work',
      date: item.scheduledDate ?? selectedDate,
      time: item.scheduledTime?.slice(0, 5) ?? '',
      notes: item.notes ?? '',
      scheduled: Boolean(item.scheduledDate),
    });
    setModalOpen(true);
  };

  const moveItem = async (itemId: number, scheduledDate: string) => {
    const prior = items;
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, scheduledDate } : item,
      ),
    );
    const response = await fetch(`/api/calendar-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledDate }),
    });
    if (!response.ok) {
      setItems(prior);
      setError('We could not reschedule that item. Please try again.');
    }
  };

  const onDrop = (event: React.DragEvent, key: string) => {
    event.preventDefault();
    const itemId = Number(event.dataTransfer.getData('text/plain'));
    if (Number.isInteger(itemId)) void moveItem(itemId, key);
  };

  const createItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Add a short title for this item.');
      return;
    }
    setSaving(true);
    setError('');
    const payloadBody = {
      title: form.title,
      kind: form.kind,
      category: form.category,
      notes: form.notes,
      scheduledDate: form.scheduled ? form.date : null,
      scheduledTime: form.time || null,
    };
    const response = await fetch(
      editingItem
        ? `/api/calendar-items/${editingItem.id}`
        : '/api/calendar-items',
      {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      },
    );
    const payload = (await response.json()) as {
      item?: CalendarItemData;
      error?: string;
    };
    setSaving(false);
    if (!response.ok || !payload.item) {
      setError(payload.error ?? 'We could not save this item.');
      return;
    }
    setItems((current) =>
      editingItem
        ? current.map((item) =>
            item.id === payload.item!.id ? payload.item! : item,
          )
        : [...current, payload.item!],
    );
    setEditingItem(null);
    setModalOpen(false);
  };

  const changeRange = (direction: number) => {
    setCursor((current) =>
      view === 'month'
        ? new Date(current.getFullYear(), current.getMonth() + direction, 1)
        : addDays(current, direction * 7),
    );
  };

  return (
    <div className="animate-[rise_500ms_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2a7f74]">
            Planning space
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-[#1d2635] sm:text-4xl dark:text-[#f6f8fc]">
            Calendar
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6a7484] dark:text-[#adb8c8]">
            Give every commitment a calm, visible place to land.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-[#2468e5] px-4 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(36,104,229,0.22)] transition hover:bg-[#1c58c8] xl:self-auto"
        >
          <Plus size={17} strokeWidth={2.3} />
          New task
        </button>
      </div>

      {error ? (
        <div
          className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[#f3c4c4] bg-[#fff4f4] px-4 py-3 text-sm text-[#a33a3a] dark:border-[#6b3434] dark:bg-[#402020] dark:text-[#ffc6c6]"
          role="alert"
        >
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="mt-7 grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-2xl border border-[#e1e8f2] bg-white p-3 shadow-[0_14px_32px_rgba(37,57,96,0.06)] sm:p-5 dark:border-white/10 dark:bg-[#1b2330]">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeRange(-1)}
                className="grid size-8 place-items-center rounded-lg text-[#637187] transition hover:bg-[#edf4ff] hover:text-[#2468e5] dark:text-[#b7c1d0] dark:hover:bg-white/10"
                aria-label="Previous period"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => changeRange(1)}
                className="grid size-8 place-items-center rounded-lg text-[#637187] transition hover:bg-[#edf4ff] hover:text-[#2468e5] dark:text-[#b7c1d0] dark:hover:bg-white/10"
                aria-label="Next period"
              >
                <ChevronRight size={18} />
              </button>
              <h2 className="ml-2 text-base font-semibold tracking-tight text-[#253044] dark:text-white">
                {view === 'month'
                  ? formatMonth(cursor)
                  : `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(weekDays[0])} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(weekDays[6])}`}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCursor(today);
                  setSelectedDate(dateKey(today));
                }}
                className="h-8 rounded-lg border border-[#dbe5f1] px-3 text-xs font-semibold text-[#526176] transition hover:border-[#a8c5f4] hover:text-[#2468e5] dark:border-white/10 dark:text-[#c5cdd9]"
              >
                Today
              </button>
              <div className="flex rounded-lg bg-[#f1f5fa] p-0.5 dark:bg-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setView('month')}
                  className={`h-7 rounded-md px-2.5 text-xs font-semibold ${view === 'month' ? 'bg-white text-[#2468e5] shadow-sm dark:bg-[#2a3546] dark:text-[#dce9ff]' : 'text-[#718096] dark:text-[#aeb9c9]'}`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setView('week')}
                  className={`h-7 rounded-md px-2.5 text-xs font-semibold ${view === 'week' ? 'bg-white text-[#2468e5] shadow-sm dark:bg-[#2a3546] dark:text-[#dce9ff]' : 'text-[#718096] dark:text-[#aeb9c9]'}`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>
          <div
            className={`grid grid-cols-7 overflow-hidden rounded-xl border border-[#e5ebf3] dark:border-white/10 ${view === 'week' ? 'min-h-117.5' : ''}`}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="border-b border-[#e5ebf3] bg-[#f8faff] px-1 py-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#8190a5] dark:border-white/10 dark:bg-white/3 dark:text-[#98a4b6] sm:px-2"
              >
                {day}
              </div>
            ))}
            {visibleDays.map((day) => {
              const key = dateKey(day);
              const isCurrentMonth = day.getMonth() === cursor.getMonth();
              const dayItems = items.filter(
                (item) => item.scheduledDate === key,
              );
              const isToday = key === dateKey(today);
              return (
                <div
                  key={key}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDrop(event, key)}
                  onClick={() => {
                    setSelectedDate(key);
                  }}
                  className={`group min-h-24.5 min-w-0 border-b border-r border-[#e5ebf3] p-1.5 transition last:border-r-0 hover:bg-[#f7fbff] dark:border-white/10 dark:hover:bg-white/4 sm:min-h-29.5 sm:p-2 ${view === 'week' ? 'sm:min-h-97.5' : ''} ${!isCurrentMonth && view === 'month' ? 'bg-[#fbfcfe] text-[#a8b2c0] dark:bg-white/1.5' : ''} ${selectedDate === key ? 'bg-[#f3f8ff] dark:bg-[#183054]/40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid size-6 place-items-center rounded-full text-[11px] font-semibold ${isToday ? 'bg-[#2468e5] text-white' : 'text-[#556377] dark:text-[#c5cfdd]'}`}
                    >
                      {day.getDate()}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedDate(key);
                        openCreate(key);
                      }}
                      className="grid size-6 place-items-center rounded-md text-[#9ba8b9] opacity-0 transition hover:bg-[#e1edff] hover:text-[#2468e5] group-hover:opacity-100 focus:opacity-100 dark:hover:bg-white/10"
                      aria-label={`Add item on ${key}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, view === 'week' ? 8 : 3).map((item) => {
                      const style = categoryFor(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          draggable
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(item);
                          }}
                          onDragStart={(event) => {
                            event.dataTransfer.setData(
                              'text/plain',
                              String(item.id),
                            );
                            event.dataTransfer.effectAllowed = 'move';
                          }}
                          className={`flex w-full cursor-grab items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-[10px] font-semibold active:cursor-grabbing sm:text-[11px] ${style.chip}`}
                          title={`${item.kind === 'reminder' ? 'Reminder' : 'Task'}: ${item.title}`}
                        >
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${item.kind === 'reminder' ? 'bg-[#e17f3d]' : style.dot}`}
                          />
                          <span className="truncate">
                            {item.scheduledTime
                              ? `${formatTime(item.scheduledTime)} `
                              : ''}
                            {item.title}
                          </span>
                        </button>
                      );
                    })}
                    {dayItems.length > (view === 'week' ? 8 : 3) ? (
                      <p className="px-1 text-[10px] font-semibold text-[#718096] dark:text-[#aeb9c9]">
                        +{dayItems.length - (view === 'week' ? 8 : 3)} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[#65748a] dark:text-[#b2bdcb]">
            <span className="font-semibold text-[#4d5b70] dark:text-[#d7dfe9]">
              Legend
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-[#2563eb]" />
              Task
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-[#e17f3d]" />
              Reminder
            </span>
            {Object.values(categories).map((category) => (
              <span
                key={category.label}
                className="inline-flex items-center gap-1.5"
              >
                <i className={`size-2 rounded-full ${category.dot}`} />
                {category.label}
              </span>
            ))}
          </div>
        </section>
        <aside className="min-w-0 rounded-2xl border border-[#dfe9f5] bg-[linear-gradient(145deg,#fafdff_0%,#f0f7ff_100%)] p-4 shadow-[0_14px_32px_rgba(37,57,96,0.05)] dark:border-white/10 dark:bg-[#1b2735] 2xl:sticky 2xl:top-7 2xl:h-fit">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#27364a] dark:text-white">
                Draft tasks
              </h2>
              <p className="mt-1 text-[12px] leading-5 text-[#708096] dark:text-[#b1bdcc]">
                Keep unscheduled work nearby, then drop it onto a day.
              </p>
            </div>
            <span className="grid size-7 place-items-center rounded-lg bg-white text-[11px] font-bold text-[#2468e5] shadow-sm dark:bg-white/10">
              {drafts.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => openCreate(selectedDate, false)}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#a9c8f4] bg-white/70 text-xs font-semibold text-[#2468e5] transition hover:border-[#2468e5] hover:bg-white dark:bg-white/5"
          >
            <Plus size={15} />
            Add a draft
          </button>
          <div className="mt-4 space-y-2">
            {drafts.length ? (
              drafts.map((item) => {
                const style = categoryFor(item);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', String(item.id));
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="group flex cursor-grab items-start gap-2 rounded-xl border border-white bg-white p-3 shadow-[0_5px_14px_rgba(36,75,130,0.06)] transition hover:-translate-y-0.5 active:cursor-grabbing dark:border-white/10 dark:bg-[#202d3d]"
                  >
                    <GripVertical
                      size={15}
                      className="mt-0.5 shrink-0 text-[#aab8c9]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#354257] dark:text-[#eef3fb]">
                        {item.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${style.chip}`}
                        >
                          <i className={`size-1.5 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                        {item.kind === 'reminder' ? (
                          <Clock3
                            size={12}
                            className="text-[#d57a3a]"
                            aria-label="Reminder"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-[#c7d8ed] px-4 py-8 text-center dark:border-white/10">
                <p className="text-xs font-semibold text-[#53647a] dark:text-[#d3dbe7]">
                  Nothing waiting to be scheduled.
                </p>
                <p className="mt-1 text-[11px] leading-5 text-[#8390a3] dark:text-[#a9b5c5]">
                  Save an idea here when you do not have a date yet.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-40 grid place-items-end bg-[#152035]/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close dialog"
            onClick={() => setModalOpen(false)}
          />
          <form
            onSubmit={createItem}
            className="relative w-full max-w-lg rounded-t-2xl border border-[#e1e8f2] bg-white p-5 shadow-[0_24px_70px_rgba(12,32,65,0.25)] sm:rounded-2xl sm:p-6 dark:border-white/10 dark:bg-[#1b2330]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="calendar-dialog-title"
                  className="text-lg font-semibold tracking-[-0.03em]"
                >
                  {form.scheduled ? 'Add to calendar' : 'Save a draft task'}
                </h2>
                <p className="mt-1 text-sm text-[#718096] dark:text-[#adbacb]">
                  Capture the work, then give it the right context.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-[#6d7c90] hover:bg-[#f0f4f8] dark:hover:bg-white/10"
                aria-label="Close dialog"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-semibold text-[#536177] dark:text-[#d5dce7]">
                Task title
                <input
                  required
                  autoFocus
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="What needs your attention?"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#dce5f0] bg-white px-3 text-sm text-[#263449] outline-none transition placeholder:text-[#a6b1c0] focus:border-[#5b93ee] focus:ring-2 focus:ring-[#d9e9ff] dark:border-white/10 dark:bg-white/4 dark:text-white"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-[#536177] dark:text-[#d5dce7]">
                  Type
                  <select
                    value={form.kind}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        kind: event.target.value as FormState['kind'],
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#dce5f0] bg-white px-3 text-sm font-medium outline-none dark:border-white/10 dark:bg-white/4"
                  >
                    <option value="task">Task</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-[#536177] dark:text-[#d5dce7]">
                  Category
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category: event.target.value as Category,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#dce5f0] bg-white px-3 text-sm font-medium outline-none dark:border-white/10 dark:bg-white/4"
                  >
                    {Object.entries(categories).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#536177] dark:text-[#d5dce7]">
                <input
                  type="checkbox"
                  checked={form.scheduled}
                  onChange={(event) =>
                    setForm({ ...form, scheduled: event.target.checked })
                  }
                  className="size-4 accent-[#2468e5]"
                />
                Schedule this now
              </label>
              {form.scheduled ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-[#536177] dark:text-[#d5dce7]">
                    Date
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(event) =>
                        setForm({ ...form, date: event.target.value })
                      }
                      className="mt-1.5 h-10 w-full rounded-lg border border-[#dce5f0] bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-white/4"
                    />
                  </label>
                  <label className="text-xs font-semibold text-[#536177] dark:text-[#d5dce7]">
                    Time{' '}
                    <span className="font-normal text-[#94a0af]">optional</span>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(event) =>
                        setForm({ ...form, time: event.target.value })
                      }
                      className="mt-1.5 h-10 w-full rounded-lg border border-[#dce5f0] bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-white/4"
                    />
                  </label>
                </div>
              ) : null}
              <label className="block text-xs font-semibold text-[#536177] dark:text-[#d5dce7]">
                Details{' '}
                <span className="font-normal text-[#94a0af]">optional</span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  rows={3}
                  placeholder="Add context, a link, or a quick note..."
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#dce5f0] bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-[#a6b1c0] focus:border-[#5b93ee] focus:ring-2 focus:ring-[#d9e9ff] dark:border-white/10 dark:bg-white/4"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-9 rounded-lg px-3 text-sm font-semibold text-[#68778b] hover:bg-[#f0f4f8] Fdark:text-[#c5cedb] dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                type="submit"
                className="h-9 rounded-lg bg-[#2468e5] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(36,104,229,0.2)] transition hover:bg-[#1c58c8] disabled:opacity-60"
              >
                {saving
                  ? 'Saving...'
                  : form.scheduled
                    ? 'Create task'
                    : 'Save draft'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
