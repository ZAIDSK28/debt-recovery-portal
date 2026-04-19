// src/components/layout/app-header.tsx

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export function AppHeader({
  title,
  onMenuClick,
  onSidebarToggle,
  isSidebarCollapsed,
}: {
  title: string;
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onSidebarToggle}
          className="hidden rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 md:inline-flex"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>

        <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
      </div>
    </header>
  );
}