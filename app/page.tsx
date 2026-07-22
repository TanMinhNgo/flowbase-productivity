import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Files,
  KanbanSquare,
  LayoutDashboard,
  MessageCircleMore,
  NotebookPen,
  PanelsTopLeft,
  Play,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WandSparkles,
} from "lucide-react";

const features = [
  {
    title: "Smart dashboard",
    description: "See work, priorities, and upcoming moments in one calm command center.",
    icon: LayoutDashboard,
    className: "md:col-span-2 bg-[#eaf0ff] dark:bg-[#18233d]",
  },
  {
    title: "AI assistant",
    description: "Turn a thought into an organized next step in seconds.",
    icon: Bot,
    className: "bg-[#f1edff] dark:bg-[#292043]",
  },
  {
    title: "Calendar and reminders",
    description: "Plan the week without losing the work behind each event.",
    icon: CalendarDays,
    className: "bg-[#edf8f6] dark:bg-[#16312e]",
  },
  {
    title: "Kanban boards",
    description: "Give every project a visible path from intent to done.",
    icon: KanbanSquare,
    className: "md:col-span-2 bg-[#fff4e8] dark:bg-[#3a291b]",
  },
  {
    title: "Notion-style notes",
    description: "Write living documents that stay connected to the work.",
    icon: NotebookPen,
    className: "bg-[#f4f5f8] dark:bg-[#242733]",
  },
  {
    title: "Visual whiteboards",
    description: "Map ideas, decisions, and systems without leaving your workspace.",
    icon: PanelsTopLeft,
    className: "bg-[#ecf2ff] dark:bg-[#1b2945]",
  },
  {
    title: "AI template builder",
    description: "Create project systems and mini apps from a simple prompt.",
    icon: WandSparkles,
    className: "md:col-span-2 bg-[#eef8f4] dark:bg-[#17352d]",
  },
  {
    title: "Live collaboration",
    description: "Create together with presence, comments, and shared context.",
    icon: UsersRound,
    className: "bg-[#f6f0fb] dark:bg-[#30213a]",
  },
  {
    title: "Custom categories",
    description: "Shape Flowbase around your process, not the other way around.",
    icon: Settings2,
    className: "bg-[#f3f6f9] dark:bg-[#252b34]",
  },
];

const workflows = [
  {
    title: "Organize your workspace",
    description: "Bring notes, tasks, events, and boards into one connected home.",
    icon: Files,
  },
  {
    title: "Let AI handle the setup",
    description: "Ask for a plan, a template, a summary, or the next best action.",
    icon: BrainCircuit,
  },
  {
    title: "Collaborate and move work forward",
    description: "Keep the whole team aligned with shared context and visible progress.",
    icon: UsersRound,
  },
];

const useCases = [
  ["Founders", "Keep strategy, launches, and customer learning connected."],
  ["Students", "Turn lecture notes into study plans that stay on track."],
  ["Teams", "Plan work together without switching between five tools."],
  ["Creators", "Capture ideas, build content systems, and ship consistently."],
  ["Project managers", "Make every milestone, owner, and dependency clear."],
  ["Personal systems", "Build a workspace that supports how you actually think."],
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "A focused home for your everyday work.",
    features: ["Personal workspace", "Notes and tasks", "Starter AI credits", "One shared space"],
  },
  {
    name: "Pro",
    price: "$12",
    description: "For individuals building a serious system.",
    features: ["Unlimited notes and boards", "Advanced AI workflows", "Calendar automations", "Custom templates"],
    featured: true,
  },
  {
    name: "Team",
    price: "$20",
    description: "Shared momentum for the whole organization.",
    features: ["Everything in Pro", "Live collaboration", "Team spaces and roles", "Priority support"],
  },
];

const testimonials = [
  {
    quote: "Flowbase finally lets our team plan, discuss, and execute in the same place. The context never gets lost.",
    name: "Mina Alvarez",
    role: "Product lead, Northstar Studio",
  },
  {
    quote: "I use it to turn scattered research into a real weekly plan. The AI feels useful because it understands the workspace.",
    name: "Darren Okafor",
    role: "Independent founder",
  },
  {
    quote: "Our project handoffs got dramatically clearer once notes, boards, and comments started living together.",
    name: "Elise Tan",
    role: "Operations director, Kinship Labs",
  },
];

const faqs = [
  ["What can the AI assistant do?", "It can turn ideas into tasks, draft and refine notes, build plans, create reminders, generate diagrams, and suggest reusable workspace templates."],
  ["How does real-time collaboration work?", "Shared workspaces support active presence, task comments, and live updates. The collaboration experience is designed for Liveblocks-powered team workflows."],
  ["Can I use Flowbase for notes and whiteboards?", "Yes. Notes, kanban boards, calendars, and visual whiteboards are connected parts of the same workspace."],
  ["What is the AI template builder?", "Describe the workflow you need and Flowbase helps create a structured template, from a content calendar to a project hub or lightweight internal tool."],
  ["Is my workspace private?", "Your workspace is private by default. You control who can access shared spaces and what collaborators can do inside them."],
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#3269d6]">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold tracking-[-0.045em] text-[#14171f] sm:text-4xl dark:text-[#f5f7fb]">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-[#5e6575] dark:text-[#b4bccb]">{description}</p> : null}
    </div>
  );
}

function PrimaryButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Link href="/sign-up" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#175ee9] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(23,94,233,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#104ec9] active:translate-y-0 ${className}`}>
      {children}
      <ArrowRight size={16} strokeWidth={2.25} />
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#fbfcff] text-[#14171f] selection:bg-[#cfe0ff] dark:bg-[#10131a] dark:text-[#f5f7fb]">
      <nav className="sticky top-0 z-20 border-b border-[#e7eaf1]/80 bg-[#fbfcff]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#10131a]/90">
        <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-5 lg:px-8">
          <Link href="#top" className="inline-flex items-center gap-2 font-semibold tracking-[-0.04em]">
            <span className="grid size-8 place-items-center rounded-xl bg-[#175ee9] text-white shadow-[0_7px_16px_rgba(23,94,233,0.25)]"><Sparkles size={16} fill="currentColor" strokeWidth={1.8} /></span>
            <span className="text-lg">flowbase</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-[#626a7a] lg:flex dark:text-[#b6bece]">
            <a href="#features" className="transition hover:text-[#175ee9]">Product</a>
            <a href="#how-it-works" className="transition hover:text-[#175ee9]">How it works</a>
            <a href="#collaboration" className="transition hover:text-[#175ee9]">Teams</a>
            <a href="#pricing" className="transition hover:text-[#175ee9]">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-[#414858] transition hover:text-[#175ee9] sm:inline-flex dark:text-[#d3d9e5]">Log in</Link>
            <PrimaryButton className="min-h-10 px-4 py-2">Get started</PrimaryButton>
          </div>
        </div>
      </nav>

      <section id="top" className="relative mx-auto grid min-h-[calc(100dvh-70px)] max-w-[1400px] items-center gap-12 px-5 pb-14 pt-16 lg:grid-cols-[0.83fr_1.17fr] lg:px-8 lg:pb-16 lg:pt-20">
        <div className="relative z-10 animate-[rise_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
          <p className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#3269d6]"><Sparkles size={14} strokeWidth={2.2} /> Built for focused teams</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em] sm:text-6xl lg:text-[4.25rem]">Your AI-powered workspace for work that moves.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#5e6575] dark:text-[#b4bccb]">Notes, tasks, whiteboards, and collaboration stay together so you can spend less time managing tools.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton>Get started</PrimaryButton>
            <a href="#showcase" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dce1eb] bg-white px-5 py-3 text-sm font-semibold text-[#343b4b] transition hover:-translate-y-0.5 hover:border-[#aeb9cf] hover:bg-[#f5f7fb] active:translate-y-0 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:hover:bg-white/10"><Play size={15} fill="currentColor" strokeWidth={2.2} /> Watch demo</a>
          </div>
        </div>
        <div className="relative animate-[rise_850ms_cubic-bezier(0.16,1,0.3,1)_120ms_both]">
          <div className="absolute -inset-12 -z-10 rounded-full bg-[#dce9ff]/75 blur-3xl dark:bg-[#1a3979]/30" />
          <div className="overflow-hidden rounded-2xl border border-white/90 bg-white p-2 shadow-[0_30px_80px_rgba(42,66,112,0.20)] dark:border-white/10 dark:bg-[#1b202b]">
            <Image src="/flowbase-dashboard.png" alt="Flowbase workspace dashboard with calendar, notes, and kanban board" width={1600} height={1000} priority className="h-auto w-full rounded-[11px]" />
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7eaf1] bg-white/60 py-7 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-9 gap-y-4 px-5 text-sm font-semibold text-[#687083] lg:px-8 dark:text-[#aeb7c8]">
          <span className="inline-flex items-center gap-2"><Bot size={18} className="text-[#175ee9]" /> AI assistant</span>
          <span className="inline-flex items-center gap-2"><UsersRound size={18} className="text-[#175ee9]" /> Real-time collaboration</span>
          <span className="inline-flex items-center gap-2"><LayoutDashboard size={18} className="text-[#175ee9]" /> One smart workspace</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-[#175ee9]" /> Private by default</span>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8 lg:py-32">
        <SectionHeading eyebrow="Everything connected" title="The tools you need, in one place." description="Flowbase gives every part of your work a shared context, so each tool makes the next one more useful." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description, className }) => (
            <article key={title} className={`group min-h-52 rounded-2xl border border-white/80 p-6 shadow-[0_14px_34px_rgba(36,56,95,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(36,56,95,0.12)] dark:border-white/5 ${className}`}>
              <span className="grid size-10 place-items-center rounded-xl bg-white/75 text-[#175ee9] shadow-sm dark:bg-white/10"><Icon size={20} strokeWidth={1.9} /></span>
              <h3 className="mt-9 text-lg font-semibold tracking-[-0.03em] text-[#242a36] dark:text-[#f4f6fb]">{title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#5e6575] dark:text-[#bdc4d1]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#edf3ff] py-24 dark:bg-[#151e30] lg:py-32">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
          <SectionHeading eyebrow="A calmer way to work" title="A system that starts simple and scales with you." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {workflows.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-white/80 bg-white/75 p-7 shadow-[0_14px_34px_rgba(36,56,95,0.06)] dark:border-white/10 dark:bg-white/5">
                <Icon size={26} strokeWidth={1.7} className="text-[#175ee9]" />
                <h3 className="mt-16 text-xl font-semibold tracking-[-0.035em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5e6575] dark:text-[#bdc4d1]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="showcase" className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-2xl border border-[#e4e9f2] bg-[#f0f4fa] p-2 shadow-[0_25px_60px_rgba(35,55,92,0.12)] dark:border-white/10 dark:bg-[#1b202b]">
            <Image src="/flowbase-whiteboard.png" alt="Flowbase collaborative roadmap whiteboard with AI assistant" width={1600} height={1000} className="h-auto w-full rounded-[11px]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3269d6]">From idea to execution</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Think visually. Keep every decision connected.</h2>
            <p className="mt-5 text-base leading-7 text-[#5e6575] dark:text-[#b4bccb]">Turn a whiteboard into an actionable plan, link decisions to notes, and let AI surface what needs attention.</p>
            <div className="mt-8 space-y-4">
              {["Map plans with visual boards and linked docs", "Ask AI to summarize decisions and identify next steps", "Keep comments, collaborators, and tasks in their shared context"].map((item) => <p key={item} className="flex gap-3 text-sm font-medium leading-6"><Check size={18} className="mt-0.5 shrink-0 text-[#175ee9]" strokeWidth={2.3} />{item}</p>)}
            </div>
            <a href="#pricing" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#175ee9] transition hover:gap-3">Explore the workspace <ChevronRight size={17} strokeWidth={2.2} /></a>
          </div>
        </div>
      </section>

      <section className="bg-[#141923] py-24 text-white lg:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7ca8ff]">AI that understands the work</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">A useful second brain, built into your workspace.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#b9c2d2]">Flowbase AI works across the context you already have, helping you create, connect, and move faster without another blank chat window.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Create tasks from a meeting note", "Add calendar reminders from a plan", "Refine and summarize written work", "Generate diagrams from an idea", "Build templates and mini apps", "Surface productivity insights"].map((item, index) => (
              <div key={item} className={`rounded-2xl border border-white/10 p-5 transition hover:border-[#4e83ed] hover:bg-white/5 ${index === 0 || index === 5 ? "bg-[#1c2638]" : "bg-white/[0.03]"}`}>
                <WandSparkles size={19} strokeWidth={1.8} className="text-[#76a0ff]" />
                <p className="mt-10 text-sm font-medium leading-6 text-[#edf1f8]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="collaboration" className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8 lg:py-32">
        <div className="rounded-2xl bg-[#eff5ff] p-7 sm:p-10 lg:p-14 dark:bg-[#17233a]">
          <div className="grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionHeading eyebrow="Better together" title="A shared home for the whole team." description="Live presence, comments, and shared boards keep every contributor close to the same source of truth." />
            <div className="grid gap-3 sm:grid-cols-3">
              {[{ icon: UsersRound, label: "Active presence" }, { icon: MessageCircleMore, label: "Task comments" }, { icon: Clock3, label: "Live updates" }].map(({ icon: Icon, label }) => <div key={label} className="rounded-xl bg-white p-5 shadow-[0_10px_24px_rgba(36,56,95,0.07)] dark:bg-[#202e47]"><Icon size={21} className="text-[#175ee9]" strokeWidth={1.8} /><p className="mt-8 text-sm font-semibold">{label}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-24 lg:px-8 lg:pb-32">
        <SectionHeading title="One workspace, many ways to use it." description="Build a focused operating system for the work you do every day." />
        <div className="mt-10 grid gap-x-10 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map(([title, description]) => <article key={title} className="group flex items-start gap-4 border-b border-[#e4e8f0] pb-7 dark:border-white/10"><span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-[#edf3ff] text-[#175ee9] dark:bg-[#1b3158]"><ChevronRight size={17} strokeWidth={2.2} /></span><div><h3 className="font-semibold tracking-[-0.025em]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#687083] dark:text-[#b5bdca]">{description}</p></div></article>)}
        </div>
      </section>

      <section id="pricing" className="bg-[#f2f5fa] py-24 dark:bg-[#151a24] lg:py-32">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
          <SectionHeading eyebrow="Simple pricing" title="Start small. Grow without switching tools." description="Choose the workspace that fits today. Upgrade when the work asks for more." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => <article key={plan.name} className={`relative rounded-2xl border p-7 ${plan.featured ? "border-[#175ee9] bg-[#175ee9] text-white shadow-[0_20px_48px_rgba(23,94,233,0.25)]" : "border-[#e1e6ef] bg-white dark:border-white/10 dark:bg-[#1d222d]"}`}>
              {plan.featured ? <span className="absolute right-6 top-6 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Most popular</span> : null}
              <h3 className="text-xl font-semibold tracking-[-0.04em]">{plan.name}</h3>
              <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-[#dbe8ff]" : "text-[#687083] dark:text-[#b5bdca]"}`}>{plan.description}</p>
              <p className="mt-8 text-4xl font-semibold tracking-[-0.05em]">{plan.price}<span className={`ml-1 text-sm font-medium ${plan.featured ? "text-[#dbe8ff]" : "text-[#7a8190]"}`}>{plan.price === "$0" ? "forever" : "/ month"}</span></p>
              <Link href="/sign-up" className={`mt-8 flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] ${plan.featured ? "bg-white text-[#175ee9] hover:bg-[#edf3ff]" : "bg-[#eef3ff] text-[#175ee9] hover:bg-[#dce8ff] dark:bg-[#21345b] dark:text-[#dce8ff]"}`}>Start for free</Link>
              <ul className="mt-8 space-y-4">{plan.features.map((feature) => <li key={feature} className={`flex gap-3 text-sm ${plan.featured ? "text-[#eff5ff]" : "text-[#535b6a] dark:text-[#c0c7d4]"}`}><Check size={17} className="shrink-0" strokeWidth={2.2} />{feature}</li>)}</ul>
            </article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8 lg:py-32">
        <SectionHeading title="Built for people who want less friction." />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map(({ quote, name, role }) => <figure key={name} className="rounded-2xl border border-[#e4e8f0] bg-white p-7 shadow-[0_12px_30px_rgba(36,56,95,0.05)] dark:border-white/10 dark:bg-[#1b202b]"><blockquote className="text-base leading-7 tracking-[-0.015em]">“{quote}”</blockquote><figcaption className="mt-9 text-sm"><p className="font-semibold">{name}</p><p className="mt-1 text-[#717989] dark:text-[#afb8c7]">{role}</p></figcaption></figure>)}
        </div>
      </section>

      <section className="bg-[#edf3ff] py-24 dark:bg-[#17233a] lg:py-32">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <SectionHeading title="Questions, answered." />
          <div className="mt-10 divide-y divide-[#dce3ef] dark:divide-white/10">
            {faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold"><span>{question}</span><Plus size={20} className="shrink-0 text-[#175ee9] transition group-open:rotate-45" strokeWidth={2.2} /></summary><p className="max-w-2xl pt-4 text-sm leading-7 text-[#606878] dark:text-[#bec6d3]">{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8 lg:py-28">
        <div className="rounded-2xl bg-[#175ee9] px-7 py-14 text-white shadow-[0_24px_60px_rgba(23,94,233,0.25)] sm:px-12 lg:flex lg:items-end lg:justify-between lg:px-16">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#cbdcff]">Your work, connected</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Build your entire productivity system in one AI workspace.</h2></div>
          <PrimaryButton className="mt-8 bg-white text-[#175ee9] shadow-none hover:bg-[#edf3ff] lg:mt-0">Start for free</PrimaryButton>
        </div>
      </section>

      <footer className="border-t border-[#e7eaf1] py-12 dark:border-white/10">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)] lg:px-8">
          <div><Link href="#top" className="inline-flex items-center gap-2 font-semibold tracking-[-0.04em]"><span className="grid size-8 place-items-center rounded-xl bg-[#175ee9] text-white"><Sparkles size={16} fill="currentColor" /></span><span className="text-lg">flowbase</span></Link><p className="mt-4 max-w-xs text-sm leading-6 text-[#687083] dark:text-[#b1bac9]">A connected workspace for focused individuals and collaborative teams.</p></div>
          {["Product", "Resources", "Company"].map((group, groupIndex) => <div key={group}><p className="text-sm font-semibold">{group}</p><div className="mt-4 space-y-3 text-sm text-[#687083] dark:text-[#b1bac9]">{[["Features", "Pricing", "Integrations"], ["Help center", "Guides", "Status"], ["About", "Privacy", "Terms"]][groupIndex].map((item) => <a key={item} href="#top" className="block transition hover:text-[#175ee9]">{item}</a>)}</div></div>)}
        </div>
      </footer>
    </main>
  );
}
