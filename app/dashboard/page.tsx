import { ArrowRight, Bot, NotebookPen, PanelsTopLeft, Sparkles } from "lucide-react";
import Link from "next/link";

const starterActions = [
  { href: "/dashboard/notes", label: "Write a note", description: "Capture an idea before it disappears.", icon: NotebookPen, color: "text-[#c55a7c] bg-[#ffedf3]" },
  { href: "/dashboard/whiteboard", label: "Open a whiteboard", description: "Sketch out a new direction visually.", icon: PanelsTopLeft, color: "text-[#138bad] bg-[#e5f6fb]" },
  { href: "/dashboard/ai-assistant", label: "Ask Flowbase AI", description: "Turn a thought into an organized plan.", icon: Bot, color: "text-[#7255d8] bg-[#eeeaff]" },
];

export default function DashboardPage() {
  return (
    <div className="animate-[rise_500ms_cubic-bezier(0.16,1,0.3,1)_both]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3a73d8]">Workspace overview</p>
      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><h1 className="text-3xl font-semibold tracking-[-0.055em] text-[#1d2635] sm:text-4xl dark:text-[#f6f8fc]">Your workspace is ready.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#6a7484] dark:text-[#adb8c8]">Start with a single idea. Flowbase will keep the notes, plans, and people around it connected.</p></div>
        <Link href="/dashboard/ai-assistant" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2468e5] px-4 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(36,104,229,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1c58c8] active:translate-y-0"><Sparkles size={16} fill="currentColor" />Create with AI</Link>
      </div>

      <section className="mt-10 rounded-2xl border border-[#e1e8f2] bg-white p-6 shadow-[0_14px_32px_rgba(37,57,96,0.06)] sm:p-8 dark:border-white/10 dark:bg-[#1b2330]">
        <span className="grid size-11 place-items-center rounded-xl bg-[#e9f1ff] text-[#2468e5] dark:bg-[#1c3a70]"><Sparkles size={20} fill="currentColor" /></span>
        <h2 className="mt-7 text-xl font-semibold tracking-[-0.035em]">Make your first workspace move.</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-[#6a7484] dark:text-[#adb8c8]">Create something small, then connect it to the people and projects that matter. Your dashboard will grow with real work.</p>
        <div className="mt-7 grid gap-3 lg:grid-cols-3">
          {starterActions.map(({ href, label, description, icon: Icon, color }) => <Link key={href} href={href} className="group rounded-xl border border-[#e7edf5] p-4 transition hover:-translate-y-0.5 hover:border-[#bcd2fb] hover:shadow-[0_10px_20px_rgba(37,57,96,0.07)] dark:border-white/10 dark:hover:border-[#3c66aa]"><span className={`grid size-8 place-items-center rounded-lg ${color}`}><Icon size={16} strokeWidth={2} /></span><h3 className="mt-7 text-sm font-semibold">{label}</h3><p className="mt-1 text-[13px] leading-5 text-[#728093] dark:text-[#aeb9c9]">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2468e5]">Open <ArrowRight size={13} className="transition group-hover:translate-x-0.5" /></span></Link>)}
        </div>
      </section>
    </div>
  );
}
