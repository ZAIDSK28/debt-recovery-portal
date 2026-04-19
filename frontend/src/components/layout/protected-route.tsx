import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.75),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f0f9ff_100%)] px-6">
      <div className="w-full max-w-sm rounded-[20px] border border-sky-100 bg-white/90 p-8 text-center shadow-[0_16px_40px_rgba(14,165,233,0.12)] backdrop-blur">
        <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,#7dd3fc,#38bdf8,#0ea5e9)] shadow-[0_10px_30px_rgba(56,189,248,0.22)]" />
        <p className="text-sm font-medium text-slate-600">Loading workspace…</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  allowedRole,
}: {
  allowedRole?: "admin" | "dra";
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dra"} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dra"} replace />;
  }

  return <Outlet />;
}