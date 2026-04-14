import { FileClock, LayoutDashboard, Landmark, LogOut, Receipt, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const adminItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/payments", label: "Payments", icon: Wallet },
  { to: "/admin/cheques", label: "Cheques", icon: Receipt },
  { to: "/admin/electronic", label: "Electronic", icon: FileClock },
];

const draItems = [{ to: "/dra", label: "Assigned Bills", icon: Landmark }];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const items = user?.role === "admin" ? adminItems : draItems;

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-gradient-to-b from-indigo-600 to-violet-700 px-4 py-5 text-white md:flex">
      <div className="mb-8 px-2">
        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Debt Recovery</p>
          <h2 className="mt-1 text-xl font-bold">Portal</h2>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin" || to === "/dra"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white text-indigo-700 shadow-sm" : "text-white/85 hover:bg-white/10"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl bg-white/10 p-3 text-sm backdrop-blur">
        <p className="font-semibold">{user?.full_name}</p>
        <p className="text-white/70">{user?.username}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-4 flex items-center gap-2 text-white/90 transition hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}