'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import {
  Bot,
  BrainCircuit,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileStack,
  KanbanSquare,
  LayoutDashboard,
  Menu,
  NotebookPen,
  PanelsTopLeft,
  Settings2,
  Sparkles,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type MenuItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  iconClassName: string;
};

const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        iconClassName: 'text-[#146cf5] bg-[#e5efff]',
      },
      {
        href: '/dashboard/ai-assistant',
        label: 'AI Assistant',
        icon: Bot,
        iconClassName: 'text-[#7443e5] bg-[#eee8ff]',
      },
    ],
  },
  {
    label: 'Plan',
    items: [
      {
        href: '/dashboard/calendar',
        label: 'Calendar',
        icon: CalendarDays,
        iconClassName: 'text-[#00a682] bg-[#def9f1]',
      },
      {
        href: '/dashboard/tasks',
        label: 'Task / Kanban',
        icon: KanbanSquare,
        iconClassName: 'text-[#f08725] bg-[#fff0df]',
      },
    ],
  },
  {
    label: 'Create',
    items: [
      {
        href: '/dashboard/notes',
        label: 'Notes',
        icon: NotebookPen,
        iconClassName: 'text-[#d94e83] bg-[#ffebf3]',
      },
      {
        href: '/dashboard/whiteboard',
        label: 'Whiteboard',
        icon: PanelsTopLeft,
        iconClassName: 'text-[#008fbd] bg-[#e2f7ff]',
      },
      {
        href: '/dashboard/spaces',
        label: 'Pages / Spaces',
        icon: FileStack,
        iconClassName: 'text-[#719600] bg-[#f0f8d8]',
      },
    ],
  },
  {
    label: 'Build with AI',
    items: [
      {
        href: '/dashboard/templates',
        label: 'AI Template Builder',
        icon: BrainCircuit,
        iconClassName: 'text-[#994dd8] bg-[#f6e9ff]',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/dashboard/settings',
        label: 'Settings',
        icon: Settings2,
        iconClassName: 'text-[#607187] bg-[#edf1f5]',
      },
    ],
  },
];

function isActiveRoute(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
}

function NavContent({
  collapsed,
  isDark,
  onNavigate,
  onToggleTheme,
}: {
  collapsed: boolean;
  isDark: boolean;
  onNavigate?: () => void;
  onToggleTheme: () => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const displayName = user?.fullName ?? user?.firstName ?? 'Your account';

  return (
    <>
      <div
        className={`flex h-16 items-center border-b border-[#dfe8f6] bg-[linear-gradient(135deg,#ffffff_0%,#f4f8ff_100%)] px-3 dark:border-white/10 dark:bg-none ${collapsed ? 'justify-center' : 'gap-2'}`}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2.5"
          title="Flowbase dashboard"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#2468e5] text-white shadow-[0_8px_18px_rgba(36,104,229,0.22)]">
            <Sparkles size={17} fill="currentColor" strokeWidth={1.8} />
          </span>
          {!collapsed ? (
            <span className="truncate text-[17px] font-semibold tracking-[-0.045em] text-[#1d2635] dark:text-[#f6f8fc]">
              flowbase
            </span>
          ) : null}
        </Link>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-2 py-3"
        aria-label="Workspace navigation"
      >
        {menuGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex ? 'mt-4' : ''}>
            {!collapsed ? (
              <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8b9eb9] dark:text-[#788397]">
                {group.label}
              </p>
            ) : (
              <div className="mx-2 mb-1.5 h-px bg-[#e7eef8] dark:bg-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, iconClassName }) => {
                const active = isActiveRoute(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    className={`group flex h-8 items-center rounded-md px-2 text-[12px] font-medium transition duration-200 ${collapsed ? 'justify-center' : 'gap-2'} ${active ? 'bg-[#e4efff] text-[#1461d2] shadow-[inset_0_0_0_1px_rgba(93,151,246,0.16)] dark:bg-[#1c3a70] dark:text-[#dce9ff]' : 'text-[#68778b] hover:bg-[#eef5ff] hover:text-[#174da8] dark:text-[#aeb7c6] dark:hover:bg-white/[0.07] dark:hover:text-[#f4f6fa]'}`}
                  >
                    <span
                      className={`grid size-5.5 shrink-0 place-items-center rounded-md transition group-hover:scale-105 ${iconClassName} ${active ? 'ring-1 ring-[#a9cafb]' : ''}`}
                    >
                      <Icon size={13} strokeWidth={2.1} />
                    </span>
                    {!collapsed ? (
                      <span className="truncate">{label}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#e8edf4] p-2 dark:border-white/10">
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          title={collapsed ? 'Help & feedback' : undefined}
          className={`flex h-8 items-center rounded-md px-2 text-[12px] font-medium text-[#68778b] transition hover:bg-[#eef5ff] hover:text-[#174da8] dark:text-[#aeb7c6] dark:hover:bg-white/[0.07] dark:hover:text-[#f4f6fa] ${collapsed ? 'justify-center' : 'gap-2'}`}
        >
          <CircleHelp
            size={16}
            className="shrink-0 text-[#4d83d9]"
            strokeWidth={1.9}
          />
          {!collapsed ? <span>Help & feedback</span> : null}
        </Link>
        <button
          type="button"
          onClick={onToggleTheme}
          title={
            collapsed
              ? isDark
                ? 'Switch to light mode'
                : 'Switch to dark mode'
              : undefined
          }
          className={`mt-1 flex h-8 w-full items-center rounded-md px-2 text-[12px] font-medium text-[#68778b] transition hover:bg-[#fff0eb] hover:text-[#ef5b4d] dark:text-[#cfc1bc] dark:hover:bg-white/8 dark:hover:text-[#ffc5b8] ${collapsed ? 'justify-center' : 'gap-2'}`}
        >
          {isDark ? (
            <Sun
              size={16}
              className="shrink-0 text-[#f2a64b]"
              strokeWidth={1.9}
            />
          ) : (
            <Moon
              size={16}
              className="shrink-0 text-[#d96a59]"
              strokeWidth={1.9}
            />
          )}
          {!collapsed ? (
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          ) : null}
        </button>
        <div
          className={`mt-1 flex min-h-10 items-center rounded-md bg-[#eef5ff] px-2 dark:bg-white/5 ${collapsed ? 'justify-center' : 'gap-2'}`}
        >
          <UserButton appearance={{ elements: { avatarBox: 'h-7 w-7' } }} />
          {!collapsed ? (
            <span className="min-w-0 truncate text-[12px] font-medium text-[#4c5768] dark:text-[#d6dce6]">
              {displayName}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setCollapsed(
      window.localStorage.getItem('flowbase-sidebar-collapsed') === 'true',
    );
    const savedTheme = window.localStorage.getItem('flowbase-theme');
    const nextIsDark = savedTheme
      ? savedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle('dark', nextIsDark);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem('flowbase-sidebar-collapsed', String(next));
      return next;
    });
  };

  const toggleTheme = () => {
    setIsDark((current) => {
      const next = !current;
      window.localStorage.setItem('flowbase-theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  return (
    <div className="min-h-dvh bg-[#f5f9ff] dark:bg-[#111721]">
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-[#dfe8f6] bg-white transition-[width] duration-300 lg:flex dark:border-white/10 dark:bg-[#181f2a] ${collapsed ? 'w-16' : 'w-61'}`}
      >
        <NavContent
          collapsed={collapsed}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-22 grid size-6 place-items-center rounded-full border border-[#dde4ee] bg-white text-[#607086] shadow-sm transition hover:border-[#9db7e8] hover:text-[#2468e5] dark:border-white/15 dark:bg-[#232c3b] dark:text-[#b5c0d2]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      <header className="sticky top-0 z-10 flex h-15.5 items-center justify-between border-b border-[#e8edf4] bg-white/90 px-4 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-[#181f2a]/90">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="grid size-9 place-items-center rounded-lg text-[#4a5769] hover:bg-[#eef3fa] dark:text-[#d8deea] dark:hover:bg-white/10"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.045em]"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-[#2468e5] text-white">
            <Sparkles size={14} fill="currentColor" />
          </span>
          flowbase
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid size-9 place-items-center rounded-lg text-[#617086] hover:bg-[#fff0eb] hover:text-[#ef5b4d] dark:text-[#d8d0cf] dark:hover:bg-white/10"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <UserButton appearance={{ elements: { avatarBox: 'h-7 w-7' } }} />
        </div>
      </header>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Workspace navigation"
        >
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-[#152035]/35 backdrop-blur-[1px]"
          />
          <aside className="relative flex h-full w-69 flex-col bg-white shadow-[18px_0_48px_rgba(20,35,60,0.18)] dark:bg-[#181f2a]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 grid size-8 place-items-center rounded-lg text-[#647084] hover:bg-[#f2f5f9] dark:hover:bg-white/10"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <NavContent
              collapsed={false}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div
        className={`min-h-dvh transition-[padding] duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-61'}`}
      >
        <main className="mx-auto min-h-[calc(100dvh-62px)] max-w-[1600px] px-4 py-6 sm:px-7 lg:min-h-dvh lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
