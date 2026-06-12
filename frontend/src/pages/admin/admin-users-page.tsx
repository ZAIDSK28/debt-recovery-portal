// src/pages/admin/admin-users-page.tsx
import { useCallback, useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Shield, ShieldOff, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SetPasswordDialog } from "@/components/users/set-password-dialog";
import { useActivateUser, useDeactivateUser, useUsers } from "@/hooks/useUsers";
import { getApiError } from "@/lib/utils";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "dra">("all");
  const [search, setSearch] = useState("");
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);

  const usersQuery = useUsers(roleFilter === "all" ? undefined : roleFilter);
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  // Users endpoint returns all (no backend pagination/search) — filter client-side
  const rows = useMemo(() => {
    const all = usersQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((u) =>
      [u.username, u.full_name, u.email, u.role].some((v) =>
        String(v ?? "").toLowerCase().includes(term),
      ),
    );
  }, [usersQuery.data, search]);

  const handleToggleActive = useCallback(
    async (id: number, isActive: boolean) => {
      try {
        const res = isActive
          ? await deactivateMutation.mutateAsync(id)
          : await activateMutation.mutateAsync(id);
        toast.success(res.detail);
      } catch (error) {
        toast.error(getApiError(error));
      }
    },
    [activateMutation, deactivateMutation],
  );

  const columns: DataTableColumn<User>[] = [
    {
      key: "username",
      header: "Username",
      render: (r) => <span className="font-medium text-[#1E1E30]">{r.username}</span>,
    },
    { key: "full_name", header: "Full Name" },
    {
      key: "email",
      header: "Email",
      render: (r) => <span className="text-[#6B6B8A]">{r.email || "—"}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (r) => (
        <Badge variant={r.role === "admin" ? "default" : "muted"} className="capitalize">
          {r.role}
        </Badge>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (r) =>
        r.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/users/${r.id}/edit`)}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPasswordUserId(r.id)}>
            <KeyRound className="mr-1 h-3.5 w-3.5" />
            Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleToggleActive(r.id, r.is_active)}
            disabled={activateMutation.isPending || deactivateMutation.isPending}
          >
            {r.is_active ? (
              <>
                <ShieldOff className="mr-1 h-3.5 w-3.5 text-[#E04E6A]" />
                Deactivate
              </>
            ) : (
              <>
                <Shield className="mr-1 h-3.5 w-3.5 text-[#22A55A]" />
                Activate
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Users">
      <div className="space-y-5">
        <PageHeader
          title="Users"
          description="Create, update, activate, deactivate, and manage passwords for admin and DRA users."
          actions={
            <Button onClick={() => navigate("/admin/users/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          }
        />

        <DataTable
          columns={columns}
          data={rows}
          total={rows.length}
          page={1}
          pageSize={rows.length || 1}
          isLoading={usersQuery.isLoading}
          isFetching={usersQuery.isFetching}
          onPageChange={() => {}}
          onSortChange={() => {}}
          rowKey={(r) => r.id}
          minWidth={900}
          filters={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by username, name, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-44">
                <Select
                  value={roleFilter}
                  onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="dra">DRA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          emptyState={
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No users found"
              description="Create a new user or adjust your filters."
              action={
                <Button onClick={() => navigate("/admin/users/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              }
            />
          }
        />
      </div>

      <SetPasswordDialog
        open={passwordUserId !== null}
        onOpenChange={(open) => { if (!open) setPasswordUserId(null); }}
        userId={passwordUserId}
      />
    </AppShell>
  );
}