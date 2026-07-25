export const TEMPLATE_ICONS = [
  'Flame',
  'WalletCards',
  'CookingPot',
  'BookOpenCheck',
  'ChartNoAxesCombined',
  'ListTodo',
  'CalendarCheck',
  'LayoutTemplate',
] as const;
export const TEMPLATE_BLOCKS = [
  'stats',
  'list',
  'table',
  'form',
  'progress',
  'checklist',
  'buttons',
  'tags',
  'chart',
] as const;
export type TemplateBlockType = (typeof TEMPLATE_BLOCKS)[number];
export type TemplateBlock = {
  id: string;
  type: TemplateBlockType;
  title: string;
  fields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'checkbox' | 'select';
    options?: string[];
  }>;
  items?: Array<Record<string, unknown>>;
  value?: number;
  total?: number;
  actions?: string[];
  tags?: string[];
};
export type TemplateSpec = {
  appName: string;
  description: string;
  icon: (typeof TEMPLATE_ICONS)[number];
  color: string;
  layout: 'single-page';
  sections: Array<{ id: string; title: string; components: TemplateBlock[] }>;
  actions: string[];
  sampleData: Record<string, unknown>;
};

export function parseTemplateSpec(value: unknown): TemplateSpec | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const icon = TEMPLATE_ICONS.includes(
    raw.icon as (typeof TEMPLATE_ICONS)[number],
  )
    ? (raw.icon as TemplateSpec['icon'])
    : 'LayoutTemplate';
  const color =
    typeof raw.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.color)
      ? raw.color
      : '#7c5ce0';
  const sections: TemplateSpec['sections'] = [];
  if (Array.isArray(raw.sections))
    for (const [sectionIndex, section] of raw.sections.slice(0, 6).entries()) {
      const data =
        section && typeof section === 'object'
          ? (section as Record<string, unknown>)
          : {};
      const components: TemplateBlock[] = [];
      if (Array.isArray(data.components))
        for (const [componentIndex, component] of data.components
          .slice(0, 10)
          .entries()) {
          const item =
            component && typeof component === 'object'
              ? (component as Record<string, unknown>)
              : {};
          if (!TEMPLATE_BLOCKS.includes(item.type as TemplateBlockType))
            continue;
          const fields: NonNullable<TemplateBlock['fields']> = [];
          if (Array.isArray(item.fields))
            for (const field of item.fields.slice(0, 8)) {
              const input =
                field && typeof field === 'object'
                  ? (field as Record<string, unknown>)
                  : null;
              if (
                !input ||
                typeof input.key !== 'string' ||
                typeof input.label !== 'string'
              )
                continue;
              fields.push({
                key: input.key.slice(0, 50),
                label: input.label.slice(0, 80),
                type: ['text', 'number', 'date', 'checkbox', 'select'].includes(
                  String(input.type),
                )
                  ? (input.type as NonNullable<
                      TemplateBlock['fields']
                    >[number]['type'])
                  : 'text',
                options: Array.isArray(input.options)
                  ? input.options
                      .filter(
                        (option): option is string =>
                          typeof option === 'string',
                      )
                      .slice(0, 8)
                  : undefined,
              });
            }
          components.push({
            id:
              typeof item.id === 'string'
                ? item.id.slice(0, 64)
                : `block-${sectionIndex}-${componentIndex}`,
            type: item.type as TemplateBlockType,
            title:
              typeof item.title === 'string'
                ? item.title.slice(0, 80)
                : 'Untitled block',
            fields: fields.length ? fields : undefined,
            items: Array.isArray(item.items)
              ? item.items
                  .slice(0, 12)
                  .filter((entry): entry is Record<string, unknown> =>
                    Boolean(entry && typeof entry === 'object'),
                  )
              : undefined,
            value:
              typeof item.value === 'number'
                ? Math.max(0, item.value)
                : undefined,
            total:
              typeof item.total === 'number'
                ? Math.max(0, item.total)
                : undefined,
            actions: Array.isArray(item.actions)
              ? item.actions
                  .filter(
                    (action): action is string => typeof action === 'string',
                  )
                  .slice(0, 5)
              : undefined,
            tags: Array.isArray(item.tags)
              ? item.tags
                  .filter((tag): tag is string => typeof tag === 'string')
                  .slice(0, 8)
              : undefined,
          });
        }
      if (components.length)
        sections.push({
          id:
            typeof data.id === 'string'
              ? data.id.slice(0, 64)
              : `section-${sectionIndex}`,
          title:
            typeof data.title === 'string'
              ? data.title.slice(0, 80)
              : 'Workspace',
          components,
        });
    }
  if (!sections.length || typeof raw.appName !== 'string') return null;
  return {
    appName: raw.appName.slice(0, 100),
    description:
      typeof raw.description === 'string' ? raw.description.slice(0, 300) : '',
    icon,
    color,
    layout: 'single-page',
    sections,
    actions: Array.isArray(raw.actions)
      ? raw.actions
          .filter((action): action is string => typeof action === 'string')
          .slice(0, 8)
      : [],
    sampleData:
      raw.sampleData && typeof raw.sampleData === 'object'
        ? (raw.sampleData as Record<string, unknown>)
        : {},
  };
}
