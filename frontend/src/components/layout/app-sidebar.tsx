// src/components/layout/app-sidebar.tsx

import { FileClock, FileText, LayoutDashboard, Landmark, LogOut, Receipt, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const adminItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/payments", label: "Payments", icon: Wallet },
  { to: "/admin/cheques", label: "Cheques", icon: Receipt },
  { to: "/admin/electronic", label: "Electronic", icon: FileClock },
  { to: "/invoices", label: "Invoice List", icon: FileText },
  { to: "/invoices/new", label: "Create Invoice", icon: FileText },
];

const draItems = [{ to: "/dra", label: "Assigned Bills", icon: Landmark }];

export function AppSidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const { user, logout } = useAuth();
  const items = user?.role === "admin" ? adminItems : draItems;

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-gradient-to-b from-indigo-600 to-violet-700 py-5 text-white transition-all duration-200 md:flex",
        collapsed ? "w-[88px] px-3" : "w-60 px-4"
      )}
    >
      <div className={cn("mb-6 md:mb-8", collapsed ? "px-0" : "px-2")}>
        <div
          className={cn(
            "rounded-2xl bg-white/10 backdrop-blur",
            collapsed ? "flex justify-center px-2 py-4" : "p-4"
          )}
        >
          {!collapsed ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Debt Recovery</p>
              <h2 className="mt-1 text-xl font-bold">Portal</h2>
            </>
          ) : (
            <span className="text-lg font-bold">DR</span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin" || to === "/dra" || to === "/invoices" || to === "/invoices/new"}
            className={({ isActive }) =>
              cn(
                "rounded-xl text-sm font-medium transition-colors",
                collapsed
                  ? "flex h-11 items-center justify-center px-0"
                  : "flex items-center gap-3 px-3 py-2.5",
                isActive ? "bg-white text-indigo-700 shadow-sm" : "text-white/85 hover:bg-white/10"
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span className="truncate">{label}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div
        className={cn(
          "mt-6 rounded-2xl bg-white/10 text-sm backdrop-blur",
          collapsed ? "p-2" : "p-3"
        )}
      >
        {!collapsed ? (
          <>
            <p className="truncate font-semibold">{user?.full_name}</p>
            <p className="truncate text-white/70">{user?.username}</p>
          </>
        ) : null}

        <button
          type="button"
          onClick={logout}
          className={cn(
            "mt-4 flex w-full text-white/90 transition hover:text-white",
            collapsed ? "justify-center rounded-xl p-2 hover:bg-white/10" : "items-center gap-2"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Sign out</span> : null}
        </button>
      </div>
    </aside>
  );
}