'use client';
import * as Icons from 'lucide-react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TemplateBlock, TemplateSpec } from '@/lib/ai-templates';

export function TemplateIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon =
    (Icons[name as keyof typeof Icons] as React.ComponentType<{
      className?: string;
      size?: number;
    }>) ?? Icons.LayoutTemplate;
  return <Icon className={className} size={18} />;
}
function Block({
  block,
  data,
  onChange,
  color,
  interactive,
}: {
  block: TemplateBlock;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  color: string;
  interactive: boolean;
}) {
  const [newItem, setNewItem] = useState('');
  const items = Array.isArray(data[block.id])
    ? (data[block.id] as Array<Record<string, unknown>>)
    : (block.items ?? []);
  if (
    block.type === 'stats' ||
    block.type === 'progress' ||
    block.type === 'chart'
  ) {
    const value = Number(data[block.id] ?? block.value ?? 0);
    const total = Number(block.total ?? 100);
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{block.title}</p>
          {interactive ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() =>
                  onChange({ ...data, [block.id]: Math.max(0, value - 1) })
                }
                className="grid size-7 place-items-center rounded-md bg-secondary"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...data, [block.id]: value + 1 })}
                className="grid size-7 place-items-center rounded-md text-white"
                style={{ backgroundColor: color }}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-3xl font-semibold" style={{ color }}>
          {value}
          {block.type === 'progress' ? `%` : ''}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, total ? (value / total) * 100 : 0)}%`,
              backgroundColor: color,
            }}
          />
        </div>
        {interactive && block.type === 'progress' ? (
          <input
            aria-label={`${block.title} progress`}
            type="range"
            min="0"
            max={total || 100}
            value={value}
            onChange={(event) =>
              onChange({ ...data, [block.id]: Number(event.target.value) })
            }
            className="mt-3 w-full accent-primary"
          />
        ) : null}
      </div>
    );
  }
  if (block.type === 'checklist')
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-medium">{block.title}</p>
        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <label key={index} className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(item.done)}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, done: event.target.checked };
                  onChange({ ...data, [block.id]: next });
                }}
              />
              <span
                className={
                  item.done ? 'text-muted-foreground line-through' : ''
                }
              >
                {String(item.label ?? item.name ?? 'Task')}
              </span>
            </label>
          ))}
        </div>
        {interactive ? (
          <div className="mt-3 flex gap-2">
            <input
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && newItem.trim()) {
                  event.preventDefault();
                  onChange({
                    ...data,
                    [block.id]: [
                      ...items,
                      { label: newItem.trim(), done: false },
                    ],
                  });
                  setNewItem('');
                }
              }}
              placeholder="Add an item"
              className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (newItem.trim()) {
                  onChange({
                    ...data,
                    [block.id]: [
                      ...items,
                      { label: newItem.trim(), done: false },
                    ],
                  });
                  setNewItem('');
                }
              }}
              className="rounded-lg px-2 text-white"
              style={{ backgroundColor: color }}
            >
              <Plus size={15} />
            </button>
          </div>
        ) : null}
      </div>
    );
  if (block.type === 'form')
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-medium">{block.title}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(block.fields ?? []).map((field) => (
            <label key={field.key} className="text-sm">
              <span className="mb-1 block text-muted-foreground">
                {field.label}
              </span>
              {field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={Boolean(data[field.key])}
                  onChange={(event) =>
                    onChange({ ...data, [field.key]: event.target.checked })
                  }
                  className="mt-2 size-4"
                />
              ) : field.type === 'select' ? (
                <select
                  value={String(data[field.key] ?? '')}
                  onChange={(event) =>
                    onChange({ ...data, [field.key]: event.target.value })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={
                    field.type === 'number'
                      ? 'number'
                      : field.type === 'date'
                        ? 'date'
                        : 'text'
                  }
                  value={String(data[field.key] ?? '')}
                  onChange={(event) =>
                    onChange({ ...data, [field.key]: event.target.value })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 outline-none focus:ring-2 focus:ring-primary/20"
                />
              )}
            </label>
          ))}
        </div>
      </div>
    );
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{block.title}</p>
        {block.tags?.length ? (
          <span className="text-xs" style={{ color }}>
            {block.tags.join(' · ')}
          </span>
        ) : null}
      </div>
      {items.length ? (
        <div className="mt-3 divide-y divide-border">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {Object.values(item)
                  .filter(
                    (value) =>
                      typeof value === 'string' || typeof value === 'number',
                  )
                  .join(' · ')}
              </span>
              {interactive ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...data,
                      [block.id]: items.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {interactive && ['list', 'table'].includes(block.type) ? (
        <div className="mt-3 flex gap-2">
          <input
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && newItem.trim()) {
                event.preventDefault();
                onChange({
                  ...data,
                  [block.id]: [...items, { name: newItem.trim() }],
                });
                setNewItem('');
              }
            }}
            placeholder={`Add to ${block.title}`}
            className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (newItem.trim()) {
                onChange({
                  ...data,
                  [block.id]: [...items, { name: newItem.trim() }],
                });
                setNewItem('');
              }
            }}
            className="rounded-lg px-2 text-white"
            style={{ backgroundColor: color }}
          >
            <Plus size={15} />
          </button>
        </div>
      ) : null}
      {block.actions?.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() =>
            onChange({
              ...data,
              [`${block.id}:${action}`]: !(
                data[`${block.id}:${action}`] === true
              ),
            })
          }
          className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {action}
        </button>
      ))}
    </div>
  );
}
export function TemplateRenderer({
  spec,
  runtimeData,
  onChange,
}: {
  spec: TemplateSpec;
  runtimeData: Record<string, unknown>;
  onChange?: (data: Record<string, unknown>) => void;
}) {
  const data = useMemo(() => runtimeData ?? {}, [runtimeData]);
  const interactive = Boolean(onChange);
  return (
    <div className="space-y-5">
      {spec.sections.map((section) => (
        <section key={section.id}>
          <h2 className="mb-3 text-lg font-semibold">{section.title}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.components.map((block) => (
              <Block
                key={block.id}
                block={block}
                data={data}
                onChange={onChange ?? (() => {})}
                color={spec.color}
                interactive={interactive}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
