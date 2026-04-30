// src/pages/admin/admin-users-page.tsx
import { useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Shield, ShieldOff, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableWrapper, TBody, TD, TH, THead } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivateUser, useDeactivateUser, useUsers } from "@/hooks/useUsers";
import { getApiError } from "@/lib/utils";
import { SetPasswordDialog } from "@/components/users/set-password-dialog";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "dra">("all");
  const [search, setSearch] = useState("");
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);

  const usersQuery = useUsers(roleFilter === "all" ? undefined : roleFilter);
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  const rows = useMemo(() => {
    const users = usersQuery.data ?? [];
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) =>
      [user.username, user.full_name, user.email, user.role].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [usersQuery.data, search]);

  async function handleToggleActive(id: number, isActive?: boolean) {
    try {
      if (isActive) {
        const response = await deactivateMutation.mutateAsync(id);
        toast.success(response.detail);
      } else {
        const response = await activateMutation.mutateAsync(id);
        toast.success(response.detail);
      }
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <AppShell title="Users">
      <div className="space-y-5">
        <PageHeader
          title="Users"
          description="Create, update, activate, deactivate, and manage passwords for admin and DRA users."
          actions={
            <Button className="w-full sm:w-auto" onClick={() => navigate("/admin/users/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-sm xl:grid-cols-[1fr_220px]">
          <SearchInput
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="dra">DRA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {usersQuery.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No users found"
            description="Create a new user or change your filters."
            action={
              <Button onClick={() => navigate("/admin/users/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <TableWrapper className="w-full rounded-none border-0 shadow-none">
              <Table className="w-full min-w-[1100px] table-auto">
                <THead>
                  <tr>
                    <TH>Username</TH>
                    <TH>Full Name</TH>
                    <TH>Email</TH>
                    <TH>Role</TH>
                    <TH>Active</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100 hover:bg-sky-50">
                      <TD className="font-medium text-slate-900">{user.username}</TD>
                      <TD>{user.full_name}</TD>
                      <TD>{user.email || "—"}</TD>
                      <TD className="capitalize">{user.role}</TD>
                      <TD>{user.is_active ? "Active" : "Inactive"}</TD>
                      <TD className="whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setPasswordUserId(user.id)}>
                            <KeyRound className="mr-1 h-3.5 w-3.5" />
                            Password
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggleActive(user.id, user.is_active)}
                            disabled={activateMutation.isPending || deactivateMutation.isPending}
                          >
                            {user.is_active ? (
                              <>
                                <ShieldOff className="mr-1 h-3.5 w-3.5 text-red-500" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Shield className="mr-1 h-3.5 w-3.5 text-green-600" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </TableWrapper>
          </div>
        )}
      </div>

      <SetPasswordDialog
        open={passwordUserId !== null}
        onOpenChange={(open) => {
          if (!open) setPasswordUserId(null);
        }}
        userId={passwordUserId}
      />
    </AppShell>
  );
}