// src/components/layout/app-sidebar.tsx
import { memo, useMemo } from "react";
import { FileText, LayoutDashboard, Landmark, Package, Users, Wallet, Warehouse, X, Zap, History } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const adminItems = [
  { to: "/admin",            label: "Dashboard",      icon: LayoutDashboard },
  { to: "/products",         label: "Products",       icon: Package },
  { to: "/stock",            label: "Warehousing",    icon: Warehouse },
  { to: "/invoices/new",     label: "Create Invoice", icon: FileText },
  { to: "/invoices",         label: "Invoice List",   icon: FileText },
  { to: "/admin/payments",   label: "Payments",       icon: Wallet },
  { to: "/admin/audit-logs", label: "Audit Logs",     icon: History },
  { to: "/admin/users",      label: "Users",          icon: Users },
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

export const AppSidebar = memo(function AppSidebar({
  collapsed = false,
  mobile = false,
  onSidebarToggle,
  onNavigate,
  onClose,
}: AppSidebarProps) {
  const { user } = useAuth();
  const items = user?.role === "admin" ? adminItems : draItems;
  const isCollapsed = collapsed && !mobile;

  // Memoize the nav item rendering to avoid unnecessary re-renders of list
  const navItems = useMemo(() => items.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={`${to}-${label}`}
      to={to}
      end={END_ROUTES.includes(to)}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          // Base styles
          "flex items-center rounded-[8px] text-[13px] font-medium transition-all duration-200",
          // Collapsed — icon-only square
          isCollapsed && "h-9 w-9 justify-center",
          // Expanded
          !isCollapsed && "gap-2.5 px-3 py-2",
          // Active state with left border accent to visually connect to the shell
          isActive
            ? cn(
                "bg-[#EAEBF8] text-[#6F72BE] font-semibold",
                // Add left border only when expanded to mimic a "connected" tab
                !isCollapsed && "border-l-[3px] border-l-[#6F72BE] shadow-sm"
              )
            : "text-[#6B6B8A] hover:bg-[#F6F7FC] hover:text-[#6F72BE]",
        )
      }
      title={isCollapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )), [items, isCollapsed, onNavigate]);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-[#DFE1F0] bg-white py-3 transition-all duration-300",
        mobile ? "h-full w-full" : "hidden md:flex md:h-screen md:sticky md:top-0",
        isCollapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      {/* Logo area */}
      <div className={cn("mb-4", isCollapsed ? "flex justify-center px-2" : "px-2.5")}>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-[10px] border border-[#DFE1F0] bg-[#F6F7FC] p-2.5",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#6F72BE]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-[#1E1E30]">Debt Recovery</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9898B4]">Portal</p>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          {mobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-[6px] border border-[#DFE1F0] p-1.5 text-[#9898B4] hover:bg-[#EAEBF8] hover:text-[#6F72BE] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav label */}
      {!isCollapsed && (
        <p className="mb-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-[#9898B4]">
          Main
        </p>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {navItems}
      </nav>
    </aside>
  );
});