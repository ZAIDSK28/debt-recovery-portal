import {
  FileClock,
  FileText,
  LayoutDashboard,
  Landmark,
  LogOut,
  Receipt,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const adminItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices/new", label: "Create Invoice", icon: FileText },
  { to: "/invoices", label: "Invoice List", icon: FileText },
  { to: "/admin/payments", label: "Payments", icon: Wallet },
  { to: "/admin/cheques", label: "Cheques", icon: Receipt },
  { to: "/admin/electronic", label: "Electronic", icon: FileClock },
];

const draItems = [{ to: "/dra", label: "Assigned Bills", icon: Landmark }];

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

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  return (
    <aside
      className={cn(
        "shrink-0 flex-col border-r border-slate-200 bg-white/96 py-4 text-slate-700 backdrop-blur",
        mobile ? "flex h-full w-full px-3" : "hidden md:flex",
        collapsed && !mobile ? "w-[88px] px-3" : "w-[220px] px-3"
      )}
    >
      <div className={cn("mb-5", collapsed && !mobile ? "px-0" : "px-1")}>
        <div
          className={cn(
            "rounded-2xl border border-slate-100 bg-white p-3 shadow-sm",
            collapsed && !mobile
              ? "flex justify-center px-2 py-4"
              : "flex items-center justify-between gap-3"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && !mobile ? "justify-center" : ""
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7dd3fc,#38bdf8,#0ea5e9)] text-white shadow-[0_8px_20px_rgba(56,189,248,0.25)]">
              <Zap className="h-5 w-5" />
            </div>

            {!(collapsed && !mobile) ? (
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold tracking-tight text-sky-900">
                  Debt Recovery
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Portal
                </p>
              </div>
            ) : null}
          </div>

          {mobile ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-1 pb-2">
        {!(collapsed && !mobile) ? (
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Main
          </p>
        ) : null}

        <nav className="space-y-1.5">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={
                to === "/admin" ||
                to === "/dra" ||
                to === "/invoices" ||
                to === "/invoices/new"
              }
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "rounded-xl text-[13.5px] font-medium transition-all",
                  collapsed && !mobile
                    ? "flex h-11 items-center justify-center px-0"
                    : "flex items-center gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-[linear-gradient(135deg,#e0f2fe,#bae6fd)] text-sky-800 shadow-sm"
                    : "text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                )
              }
              title={collapsed && !mobile ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!(collapsed && !mobile) ? (
                <span className="truncate">{label}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </div>

      <div
        className={cn(
          "mt-auto rounded-2xl border border-slate-100 bg-slate-50 text-sm shadow-sm",
          collapsed && !mobile ? "p-2" : "p-3"
        )}
      >
        {!(collapsed && !mobile) ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7dd3fc,#0ea5e9)] text-xs font-bold text-white">
              {user?.full_name?.slice(0, 2).toUpperCase() || "DR"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-700">
                {user?.full_name}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {user?.username}
              </p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "mt-3 flex w-full rounded-xl text-slate-500 transition hover:bg-white hover:text-sky-700",
            collapsed && !mobile
              ? "justify-center p-2"
              : "items-center gap-2 px-2 py-2"
          )}
          title={collapsed && !mobile ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!(collapsed && !mobile) ? <span>Sign out</span> : null}
        </button>
      </div>
    </aside>
  );
}