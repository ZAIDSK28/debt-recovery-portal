// src/pages/admin/admin-audit-logs-page.tsx
import { useCallback, useMemo, useState } from "react";
import { History } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { parseAuditLog, type ParsedAuditLog } from "@/lib/auditParser";
import type { AuditLog } from "@/api/audit.api";

const ACTION_OPTIONS = [
  "bill.created",
  "bill.updated",
  "bill.deleted",
  "bill.assigned",
  "bill.imported",
  "payment.recorded",
  "payment.status_updated",
  "printable_invoice.created",
  "user.created",
  "user.updated",
  "user.password_set",
  "user.activated",
  "user.deactivated",
  "stock.transfer.created",
  "dashboard.daily_metrics.rebuilt",
  "auth.login.success",
  "auth.login.otp_requested",
  "auth.otp.verified",
  "auth.otp.resent",
];

const ENTITY_TYPES = [
  "bill",
  "payment",
  "printable_invoice",
  "user",
  "StockTransfer",
  "dashboard",
  "bill_import",
];

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>("-created_at");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const debouncedActor = useDebounce(actorFilter, 400);

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      ordering,
      action: actionFilter !== "all" ? actionFilter : undefined,
      entity_type: entityFilter !== "all" ? entityFilter : undefined,
      actor_username: debouncedActor || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
    [page, pageSize, debouncedSearch, ordering, actionFilter, entityFilter, debouncedActor, startDate, endDate]
  );

  const query = useAuditLogs(params);

  const handleSortChange = useCallback((ord: string | undefined) => {
    setOrdering(ord);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setActionFilter("all");
    setEntityFilter("all");
    setActorFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }, []);

  const parsedData = useMemo(() => {
    return (query.data?.results ?? []).map((log: AuditLog) => parseAuditLog(log));
  }, [query.data?.results]);

  const columns = useMemo<DataTableColumn<ParsedAuditLog>[]>(() => [
    {
      key: "timestamp",
      header: "Date & Time",
      sortKey: "created_at",
      render: (r) => <span className="text-[12px] text-[#9898B4]">{r.timestamp}</span>,
    },
    {
      key: "actor",
      header: "User",
      render: (r) => <span className="font-medium">{r.actor}</span>,
    },
    {
      key: "action",
      header: "Action",
      render: (r) => <span className="text-[13px]">{r.action}</span>,
    },
    {
      key: "entity",
      header: "Entity",
      render: (r) => <span className="capitalize text-[#6B6B8A]">{r.entity}</span>,
    },
    {
      key: "description",
      header: "Details",
      cellClassName: "max-w-[350px]",
      render: (r) => (
        <div className="truncate text-[12px] text-[#6B6B8A] group-hover:whitespace-normal" title={r.description}>
          {r.description}
        </div>
      ),
    },
    {
      key: "ipAddress",
      header: "IP",
      render: (r) => <span className="font-mono text-[11px]">{r.ipAddress || "—"}</span>,
    },
  ], []);

  const isDirty = Boolean(
    search || actionFilter !== "all" || entityFilter !== "all" || actorFilter || startDate || endDate
  );

  return (
    <AppShell title="Audit Logs">
      <div className="space-y-4">
        <PageHeader
          title="Audit Logs"
          description="Track all system activity – user actions, changes, and events."
        />

        <DataTable
          columns={columns}
          data={parsedData}
          total={query.data?.count ?? 0}
          page={page}
          pageSize={pageSize}
          ordering={ordering}
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          onPageChange={setPage}
          onSortChange={handleSortChange}
          rowKey={(r) => r.id}
          minWidth={1000}
          filters={
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[180px] flex-1">
                  <SearchInput
                    placeholder="Search actions, entities, metadata…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px]">Action</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="h-8 w-[160px]">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {ACTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt.replace(/\./g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px]">Entity</Label>
                  <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All entities</SelectItem>
                      {ENTITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px]">User</Label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={actorFilter}
                    onChange={(e) => setActorFilter(e.target.value)}
                    className="h-8 w-[120px] rounded-[8px] border border-[#DFE1F0] px-2.5 text-[12px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px]">From</Label>
                  <DateInput
                    value={startDate}
                    onChange={(v) => setStartDate(v)}
                    clearable
                    max={endDate || undefined}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px]">To</Label>
                  <DateInput
                    value={endDate}
                    onChange={(v) => setEndDate(v)}
                    clearable
                    min={startDate || undefined}
                  />
                </div>
                {isDirty && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          }
          emptyState={
            <EmptyState
              icon={<History className="h-6 w-6" />}
              title="No audit logs found"
              description="System activity will appear here as users interact with the portal."
            />
          }
        />
      </div>
    </AppShell>
  );
}