// src/components/layout/protected-route.tsx
import { Navigate, Outlet } from "react-router-dom";
import { Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Loader className="h-8 w-8 animate-spin text-[#6F72BE]" />
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