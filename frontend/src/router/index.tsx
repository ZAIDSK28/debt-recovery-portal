import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";

const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const VerifyOtpPage = lazy(() => import("@/pages/auth/verify-otp-page"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/admin-dashboard-page"));
const AdminPaymentsPage = lazy(() => import("@/pages/admin/admin-payments-page"));
const AdminChequesPage = lazy(() => import("@/pages/admin/admin-cheques-page"));
const AdminElectronicPage = lazy(() => import("@/pages/admin/admin-electronic-page"));
const DRADashboardPage = lazy(() => import("@/pages/dra/dra-dashboard-page"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/verify",
    element: <VerifyOtpPage />,
  },
  {
    element: <ProtectedRoute allowedRole="admin" />,
    children: [
      {
        path: "/admin",
        element: <AdminDashboardPage />,
      },
      {
        path: "/admin/payments",
        element: <AdminPaymentsPage />,
      },
      {
        path: "/admin/cheques",
        element: <AdminChequesPage />,
      },
      {
        path: "/admin/electronic",
        element: <AdminElectronicPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRole="dra" />,
    children: [
      {
        path: "/dra",
        element: <DRADashboardPage />,
      },
    ],
  },
  {
    path: "*",
    element: <LoginPage />,
  },
]);