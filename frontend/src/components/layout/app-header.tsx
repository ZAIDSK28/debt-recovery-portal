// src/components/layout/app-header.tsx
import { LogOut, Menu, ChevronsLeft, ChevronsRight, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AppHeader({
  onMenuClick,
  onSidebarToggle,
  isSidebarCollapsed,
}: {
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const initials = user?.full_name?.trim().slice(0, 2).toUpperCase() ?? "DR";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 sm:px-6">
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

        {/* Desktop sidebar toggle – improved icon */}
        <button
          type="button"
          onClick={onSidebarToggle}
          className="hidden h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-100 hover:text-[#6F72BE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAEBF8] md:inline-flex"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronsRight className="h-4.5 w-4.5" />
          ) : (
            <ChevronsLeft className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      {/* Right side: user info + logout – shifted left with proper margin */}
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6F72BE] text-[11px] font-bold text-white">
            {initials}
          </div>
          <div className="hidden flex-col items-start md:flex">
            <p className="text-[13px] font-semibold leading-tight text-[#1E1E30]">{user?.full_name}</p>
            <p className="text-[10px] text-[#9898B4]">{user?.username}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-8 items-center gap-1.5 rounded-[8px] border border-[#DFE1F0] bg-white px-2.5 text-[12px] font-medium text-[#6B6B8A] transition-all hover:bg-[#FDEEF1] hover:text-[#E04E6A] hover:border-[#E04E6A]/30"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}