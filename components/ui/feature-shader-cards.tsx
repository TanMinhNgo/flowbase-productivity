'use client';

import { Warp } from '@paper-design/shaders-react';
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  KanbanSquare,
  LayoutDashboard,
  NotebookPen,
  PanelsTopLeft,
} from 'lucide-react';

const features = [
  {
    title: 'Smart dashboard',
    description:
      'See priorities, connected work, and your next move in one calm command center.',
    icon: LayoutDashboard,
  },
  {
    title: 'AI assistant',
    description:
      'Turn a thought into a plan, a useful draft, or a focused next action in seconds.',
    icon: Bot,
  },
  {
    title: 'Calendar and reminders',
    description:
      'Give commitments a visible place alongside the work that makes them matter.',
    icon: CalendarDays,
  },
  {
    title: 'Kanban boards',
    description:
      'Move projects from intent to done with a clear, shared path for every task.',
    icon: KanbanSquare,
  },
  {
    title: 'Connected notes',
    description:
      'Write living documents that stay close to the decisions, people, and work around them.',
    icon: NotebookPen,
  },
  {
    title: 'Visual whiteboards',
    description:
      'Map ideas, systems, and decisions without breaking the momentum of your team.',
    icon: PanelsTopLeft,
  },
] as const;

const shaderConfigs = [
  {
    proportion: 0.36,
    softness: 0.85,
    distortion: 0.13,
    swirl: 0.62,
    swirlIterations: 8,
    shape: 'checks' as const,
    shapeScale: 0.1,
    colors: [
      'hsl(12, 100%, 68%)',
      'hsl(20, 100%, 76%)',
      'hsl(8, 75%, 57%)',
      'hsl(30, 100%, 82%)',
    ],
  },
  {
    proportion: 0.42,
    softness: 1.05,
    distortion: 0.16,
    swirl: 0.74,
    swirlIterations: 11,
    shape: 'stripes' as const,
    shapeScale: 0.11,
    colors: [
      'hsl(30, 100%, 67%)',
      'hsl(38, 100%, 75%)',
      'hsl(18, 91%, 62%)',
      'hsl(46, 100%, 82%)',
    ],
  },
  {
    proportion: 0.38,
    softness: 0.9,
    distortion: 0.14,
    swirl: 0.7,
    swirlIterations: 9,
    shape: 'checks' as const,
    shapeScale: 0.09,
    colors: [
      'hsl(270, 35%, 66%)',
      'hsl(282, 42%, 76%)',
      'hsl(252, 31%, 58%)',
      'hsl(294, 45%, 82%)',
    ],
  },
  {
    proportion: 0.44,
    softness: 1.1,
    distortion: 0.18,
    swirl: 0.8,
    swirlIterations: 12,
    shape: 'stripes' as const,
    shapeScale: 0.12,
    colors: [
      'hsl(150, 34%, 66%)',
      'hsl(163, 42%, 76%)',
      'hsl(142, 31%, 56%)',
      'hsl(174, 46%, 82%)',
    ],
  },
  {
    proportion: 0.4,
    softness: 0.95,
    distortion: 0.15,
    swirl: 0.72,
    swirlIterations: 10,
    shape: 'checks' as const,
    shapeScale: 0.1,
    colors: [
      'hsl(38, 93%, 64%)',
      'hsl(46, 100%, 76%)',
      'hsl(29, 85%, 58%)',
      'hsl(52, 100%, 84%)',
    ],
  },
  {
    proportion: 0.4,
    softness: 1,
    distortion: 0.16,
    swirl: 0.7,
    swirlIterations: 10,
    shape: 'stripes' as const,
    shapeScale: 0.11,
    colors: [
      'hsl(12, 91%, 68%)',
      'hsl(24, 96%, 78%)',
      'hsl(0, 72%, 59%)',
      'hsl(32, 100%, 84%)',
    ],
  },
] as const;

export default function FeatureShaderCards() {
  return (
    <section
      id="features"
      className="bg-background px-5 py-24 sm:px-8 lg:px-10 lg:py-32"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Everything connected
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
            The tools you need, in one place.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            Plan, create, and collaborate without losing the context that
            connects your work.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const config = shaderConfigs[index];
            return (
              <article
                key={feature.title}
                className="group relative min-h-[282px] overflow-hidden rounded-2xl border border-border shadow-lg"
              >
                <Warp
                  className="absolute inset-0 size-full"
                  proportion={config.proportion}
                  softness={config.softness}
                  distortion={config.distortion}
                  swirl={config.swirl}
                  swirlIterations={config.swirlIterations}
                  shape={config.shape}
                  shapeScale={config.shapeScale}
                  scale={1}
                  rotation={0}
                  speed={0.55}
                  colors={[...config.colors]}
                />
                <div className="absolute inset-0 bg-foreground/75 transition duration-500 group-hover:bg-foreground/65" />
                <div className="relative flex h-full min-h-[282px] flex-col p-7 text-primary-foreground sm:p-8">
                  <span className="grid size-11 place-items-center rounded-xl border border-white/25 bg-white/10 shadow-sm backdrop-blur-sm">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-8 text-xl font-semibold tracking-[-0.035em]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">
                    {feature.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-7 text-sm font-semibold text-white/90">
                    Explore tool{' '}
                    <ArrowUpRight
                      size={16}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
