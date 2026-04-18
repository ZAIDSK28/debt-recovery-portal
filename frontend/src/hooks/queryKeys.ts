// src/hooks/queryKeys.ts

export const queryKeys = {
  bills: (params?: unknown) => ["bills", params] as const,
  myAssignments: (params?: unknown) => ["my-assignments", params] as const,
  routes: ["routes"] as const,
  outlets: (routeId?: number | null) => ["outlets", routeId] as const,
  users: (role?: string) => ["users", role] as const,
  payments: (params?: unknown) => ["payments", params] as const,
  todayTotals: ["today-totals"] as const,
  dailySummary: (days: number) => ["daily-summary", days] as const,
  invoiceReports: (params?: unknown) => ["invoice-reports", params] as const,
  invoiceReportDetail: (id: number) => ["invoice-report", id] as const,
};