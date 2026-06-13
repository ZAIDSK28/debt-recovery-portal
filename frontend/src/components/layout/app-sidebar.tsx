import {
  FileClock,
  FileText,
  LayoutDashboard,
  Landmark,
  LogOut,
  Package,
  Receipt,
  Users,
  Wallet,
  Warehouse,
  X,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const adminItems = [
  { to: "/admin",           label: "Dashboard",      icon: LayoutDashboard },
  { to: "/products",        label: "Products",       icon: Package },
  { to: "/stock",           label: "Warehousing",    icon: Warehouse },
  { to: "/invoices/new",    label: "Create Invoice", icon: FileText },
  { to: "/invoices",        label: "Invoice List",   icon: FileText },
  { to: "/admin/payments",  label: "Payments",       icon: Wallet },
  { to: "/admin/cheques",   label: "Cheques",        icon: Receipt },
  { to: "/admin/electronic",label: "Electronic",     icon: FileClock },
  { to: "/admin/users",     label: "Users",          icon: Users },
];

const draItems = [
  { to: "/dra", label: "Assigned Bills", icon: Landmark },
];

const END_ROUTES = [
  "/admin", "/dra", "/invoices", "/invoices/new", "/products", "/stock", "/admin/users",
];

interface AppSidebarProps {
  collapsed?: boolean;
  mobile?: boolean;
  onSidebarToggle?: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function AppSidebar({
  collapsed = false,
  mobile = false,
  onSidebarToggle,
  onNavigate,
  onClose,
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const items = user?.role === "admin" ? adminItems : draItems;
  const initials = user?.full_name?.trim().slice(0, 2).toUpperCase() ?? "DR";
  const isCollapsed = collapsed && !mobile;

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    onClose?.();
  };

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-gray-200 bg-white py-3 transition-all duration-300",
        mobile ? "h-full w-full px-2.5" : "hidden md:flex",
        isCollapsed ? "w-[64px] px-2" : "w-[240px] px-2.5",
      )}
    >
      {/* Logo + toggle area */}
      <div className={cn("mb-4", isCollapsed ? "flex justify-center" : "")}>
        <div
          className={cn(
            "relative flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-2.5",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6F72BE]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">Debt Recovery</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Portal</p>
              </div>
            )}
          </div>
          {/* Desktop collapse toggle */}
          {!mobile && onSidebarToggle && (
            <button
              type="button"
              onClick={onSidebarToggle}
              className="rounded-lg border border-gray-200 p-1 text-gray-500 hover:bg-gray-100 hover:text-[#6F72BE]"
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          )}
          {/* Mobile close button */}
          {mobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#6F72BE]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav label */}
      {!isCollapsed && (
        <p className="mb-1.5 px-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
          Main
        </p>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={END_ROUTES.includes(to)}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                isCollapsed ? "h-9 w-9 justify-center" : "gap-2.5 px-2.5 py-1.5",
                isActive
                  ? "bg-[#EAEBF8] text-[#6F72BE]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#6F72BE]",
              )
            }
            title={isCollapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div
        className={cn(
          "mt-3 rounded-xl border border-gray-200 bg-gray-50",
          isCollapsed ? "p-1.5" : "p-2.5",
        )}
      >
        {!isCollapsed && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6F72BE] text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{user?.full_name}</p>
              <p className="truncate text-xs text-gray-500">{user?.username}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center rounded-lg text-sm text-gray-600 transition-colors hover:bg-white hover:text-red-500",
            isCollapsed ? "justify-center p-1.5" : "gap-2 px-2 py-1.5",
          )}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}