import { Bot, BrainCircuit, CalendarDays, FileStack, KanbanSquare, NotebookPen, PanelsTopLeft, Settings2 } from "lucide-react";
import { notFound } from "next/navigation";

const modules = {
  "ai-assistant": { title: "AI Assistant", description: "Ask Flowbase to organize an idea, draft a plan, or create your next workspace building block.", icon: Bot, tone: "text-[#7255d8] bg-[#eeeaff]" },
  calendar: { title: "Calendar", description: "Bring your commitments and the work behind them into one connected planning view.", icon: CalendarDays, tone: "text-[#159878] bg-[#e5f7f1]" },
  tasks: { title: "Task / Kanban", description: "Turn projects into visible work and give every next action a clear place to live.", icon: KanbanSquare, tone: "text-[#d47727] bg-[#fff1e4]" },
  notes: { title: "Notes", description: "Build a connected library of ideas, documents, and decisions without losing the context around them.", icon: NotebookPen, tone: "text-[#c55a7c] bg-[#ffedf3]" },
  whiteboard: { title: "Whiteboard", description: "Map strategy, systems, and creative thinking in a shared visual space.", icon: PanelsTopLeft, tone: "text-[#138bad] bg-[#e5f6fb]" },
  spaces: { title: "Pages / Spaces", description: "Create focused homes for your projects, teams, and ongoing areas of work.", icon: FileStack, tone: "text-[#6c7b3d] bg-[#f1f6df]" },
  templates: { title: "AI Template Builder", description: "Describe the system you need and Flowbase will help build a reusable starting point.", icon: BrainCircuit, tone: "text-[#8a5cc7] bg-[#f4eaff]" },
  settings: { title: "Settings", description: "Shape Flowbase around your preferences, workspace structure, and collaboration needs.", icon: Settings2, tone: "text-[#607187] bg-[#edf1f5]" },
} as const;

export function generateStaticParams() {
  return Object.keys(modules).map((module) => ({ module }));
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const config = modules[module as keyof typeof modules];

  if (!config) notFound();

  const Icon = config.icon;
  return (
    <div className="animate-[rise_500ms_cubic-bezier(0.16,1,0.3,1)_both]">
      <span className={`grid size-12 place-items-center rounded-2xl ${config.tone}`}><Icon size={23} strokeWidth={1.8} /></span>
      <h1 className="mt-7 text-3xl font-semibold tracking-[-0.055em] text-[#1d2635] sm:text-4xl dark:text-[#f6f8fc]">{config.title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#6a7484] dark:text-[#adb8c8]">{config.description}</p>
      <section className="mt-10 grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#cedaeb] bg-white/65 p-8 text-center dark:border-[#41516a] dark:bg-white/[0.03]">
        <div><p className="text-sm font-semibold text-[#3e4b5e] dark:text-[#dce4ef]">This workspace is ready for its first real workflow.</p><p className="mt-2 max-w-md text-[13px] leading-6 text-[#738094] dark:text-[#aab6c7]">The navigation and protected workspace shell are in place. This module will gain its full product experience in the next build step.</p></div>
      </section>
    </div>
  );
}
