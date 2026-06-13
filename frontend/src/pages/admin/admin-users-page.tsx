// src/pages/admin/admin-users-page.tsx
import { useCallback, useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Shield, ShieldOff, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { SetPasswordDialog } from "@/components/users/set-password-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // Client-side search (users endpoint returns all — no backend pagination)
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
      } catch (err) {
        toast.error(getApiError(err));
      }
    },
    [activateMutation, deactivateMutation],
  );

  const columns: DataTableColumn<User>[] = [
    {
      key: "username",
      header: "Username",
      render: (r) => (
        <span className="font-mono text-[12px] font-semibold text-[#6F72BE]">
          {r.username}
        </span>
      ),
    },
    {
      key: "full_name",
      header: "Full Name",
      render: (r) => <span className="font-medium text-[#1E1E30]">{r.full_name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (r) => (
        <span className="text-[#6B6B8A]">{r.email || "—"}</span>
      ),
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
      header: "",
      headerClassName: "w-[100px]",
      cellClassName: "w-[100px]",
      render: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          {/* Edit */}
          <Button
            variant="ghost"
            size="icon"
            title="Edit user"
            onClick={() => navigate(`/admin/users/${r.id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {/* Set password */}
          <Button
            variant="ghost"
            size="icon"
            title="Set password"
            onClick={() => setPasswordUserId(r.id)}
          >
            <KeyRound className="h-3.5 w-3.5" />
          </Button>

          {/* Toggle active */}
          <Button
            variant="ghost"
            size="icon"
            title={r.is_active ? "Deactivate user" : "Activate user"}
            disabled={activateMutation.isPending || deactivateMutation.isPending}
            onClick={() => void handleToggleActive(r.id, r.is_active)}
            className={
              r.is_active
                ? "text-[#9898B4] hover:bg-[#FDEEF1] hover:text-[#E04E6A]"
                : "text-[#9898B4] hover:bg-[#E3F7EC] hover:text-[#22A55A]"
            }
          >
            {r.is_active ? (
              <ShieldOff className="h-3.5 w-3.5" />
            ) : (
              <Shield className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Users"
          description="Create, update, activate, deactivate, and manage passwords for admin and DRA users."
          actions={
            <Button onClick={() => navigate("/admin/users/new")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
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
          minWidth={820}
          filters={
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by username, name, or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-[130px]">
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
              icon={<Users className="h-5 w-5" />}
              title="No users found"
              description="Create a new user or adjust your filters."
              action={
                <Button onClick={() => navigate("/admin/users/new")}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
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