// src/components/layout/app-sidebar.tsx
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

export function AppSidebar({
  collapsed = false,
  mobile = false,
  onNavigate,
  onClose,
}: {
  collapsed?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const { user, logout } = useAuth();
  const items = user?.role === "admin" ? adminItems : draItems;
  const initials = user?.full_name?.trim().slice(0, 2).toUpperCase() ?? "DR";
  const isCollapsed = collapsed && !mobile;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-[#DFE1F0] bg-white py-3",
        mobile ? "h-full w-full px-2.5" : "hidden md:flex",
        isCollapsed ? "w-[56px] px-2" : "w-[192px] px-2.5",
      )}
    >
      {/* Logo */}
      <div className={cn("mb-4", isCollapsed ? "flex justify-center" : "")}>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-[14px] border border-[#DFE1F0] bg-[#F6F7FC] p-2.5",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#6F72BE]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-[#1E1E30]">Debt Recovery</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9898B4]">Portal</p>
              </div>
            )}
          </div>
          {mobile && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[#DFE1F0] p-1.5 text-[#6B6B8A] hover:bg-[#EAEBF8] hover:text-[#6F72BE]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav label */}
      {!isCollapsed && (
        <p className="mb-1.5 px-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9898B4]">
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
                "flex items-center rounded-[8px] text-[12.5px] font-medium transition-colors",
                isCollapsed ? "h-8 w-8 justify-center" : "gap-2.5 px-2.5 py-1.5",
                isActive
                  ? "bg-[#EAEBF8] text-[#6F72BE]"
                  : "text-[#6B6B8A] hover:bg-[#F6F7FC] hover:text-[#6F72BE]",
              )
            }
            title={isCollapsed ? label : undefined}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div
        className={cn(
          "mt-3 rounded-[12px] border border-[#DFE1F0] bg-[#F6F7FC]",
          isCollapsed ? "p-1.5" : "p-2.5",
        )}
      >
        {!isCollapsed && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6F72BE] text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[#1E1E30]">{user?.full_name}</p>
              <p className="truncate text-[10px] text-[#9898B4]">{user?.username}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => { logout(); onClose?.(); }}
          className={cn(
            "flex w-full items-center rounded-[8px] text-[12px] text-[#6B6B8A] transition-colors hover:bg-white hover:text-[#E04E6A]",
            isCollapsed ? "justify-center p-1.5" : "gap-2 px-2 py-1.5",
          )}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}