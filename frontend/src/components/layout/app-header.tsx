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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/90 bg-white/85 px-3 backdrop-blur-xl sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm md:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          onClick={onSidebarToggle}
          className="hidden rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 md:inline-flex"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
        </button>

        <h1 className="truncate text-[15px] font-semibold text-slate-800 sm:text-base">{title}</h1>
      </div>
    </header>
  );
}