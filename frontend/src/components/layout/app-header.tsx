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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#DFE1F0] bg-[#ECEEF8] px-3 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-[12px]
            border
            border-[#DFE1F0]
            bg-white
            text-[#6B6B8A]
            shadow-[0_2px_8px_rgba(30,30,48,0.06)]
            transition-all
            duration-200
            hover:shadow-[0_4px_12px_rgba(30,30,48,0.08)]
            hover:text-[#6F72BE]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#EAEBF8]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[#ECEEF8]
            md:hidden
          "
          aria-label="Open menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          onClick={onSidebarToggle}
          className="
            hidden
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-[12px]
            border
            border-[#DFE1F0]
            bg-white
            text-[#6B6B8A]
            shadow-[0_2px_8px_rgba(30,30,48,0.06)]
            transition-all
            duration-200
            hover:bg-[#EAEBF8]
            hover:text-[#6F72BE]
            hover:shadow-[0_4px_12px_rgba(30,30,48,0.08)]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#EAEBF8]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[#ECEEF8]
            md:inline-flex
          "
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" />
          )}
        </button>

        <h1 className="truncate text-[15px] font-semibold text-[#1E1E30] sm:text-base">
          {title}
        </h1>
      </div>
    </header>
  );
}