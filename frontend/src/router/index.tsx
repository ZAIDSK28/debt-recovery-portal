// src/router/index.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/layout/protected-route";

const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const VerifyOtpPage = lazy(() => import("@/pages/auth/verify-otp-page"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/admin-dashboard-page"));
const AdminPaymentsPage = lazy(() => import("@/pages/admin/admin-payments-page"));
const AdminChequesPage = lazy(() => import("@/pages/admin/admin-cheques-page"));
const AdminElectronicPage = lazy(() => import("@/pages/admin/admin-electronic-page"));
const AdminUsersPage = lazy(() => import("@/pages/admin/admin-users-page"));
const AdminUserCreatePage = lazy(() => import("@/pages/admin/admin-user-create-page"));
const AdminUserEditPage = lazy(() => import("@/pages/admin/admin-user-edit-page"));
const DRADashboardPage = lazy(() => import("@/pages/dra/dra-dashboard-page"));
const InvoicesListPage = lazy(() => import("@/pages/invoices/invoices-list-page"));
const CreateInvoicePage = lazy(() => import("@/pages/invoices/create-invoice-page"));
const InvoiceDetailPage = lazy(() => import("@/pages/invoices/invoice-detail-page"));
const InvoiceEditPage = lazy(() => import("@/pages/invoices/invoice-edit-page"));
const ProductsListPage = lazy(() => import("@/pages/products/products-list-page"));
const ProductCreatePage = lazy(() => import("@/pages/products/product-create-page"));
const ProductEditPage = lazy(() => import("@/pages/products/product-edit-page"));
const StockManagementPage = lazy(() => import("@/pages/stock/stock-management-page"));
const ErrorPage = lazy(() => import("@/pages/error-page"));

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/verify",
        element: <VerifyOtpPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRole="admin" />,
    errorElement: <ErrorPage />,
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
      {
        path: "/admin/users",
        element: <AdminUsersPage />,
      },
      {
        path: "/admin/users/new",
        element: <AdminUserCreatePage />,
      },
      {
        path: "/admin/users/:id/edit",
        element: <AdminUserEditPage />,
      },
      {
        path: "/products",
        element: <ProductsListPage />,
      },
      {
        path: "/products/new",
        element: <ProductCreatePage />,
      },
      {
        path: "/products/:id/edit",
        element: <ProductEditPage />,
      },
      {
        path: "/stock",
        element: <StockManagementPage />,
      },
      {
        path: "/invoices",
        element: <InvoicesListPage />,
      },
      {
        path: "/invoices/new",
        element: <CreateInvoicePage />,
      },
      {
        path: "/invoices/:id/edit",
        element: <InvoiceEditPage />,
      },
      {
        path: "/invoices/:id",
        element: <InvoiceDetailPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRole="dra" />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/dra",
        element: <DRADashboardPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
    errorElement: <ErrorPage />,
  },
]);