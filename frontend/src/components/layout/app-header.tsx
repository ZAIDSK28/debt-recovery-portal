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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-gray-50 px-3 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-100 hover:text-[#6F72BE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAEBF8] md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          type="button"
          onClick={onSidebarToggle}
          className="hidden h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-100 hover:text-[#6F72BE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAEBF8] md:inline-flex"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" />
          )}
        </button>

        <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
          {title}
        </h1>
      </div>
    </header>
  );
}