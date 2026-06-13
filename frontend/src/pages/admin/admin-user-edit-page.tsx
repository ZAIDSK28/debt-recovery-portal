// src/pages/admin/admin-user-edit-page.tsx
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ResponsiveTableSkeleton } from "@/components/common/loading-state";
import { UserForm } from "@/components/users/user-form";
import { useUser } from "@/hooks/useUsers";

export default function AdminUserEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const userId = Number(params.id);
  const query = useUser(userId, Number.isFinite(userId));

  const handleBack = () => navigate("/admin/users");

  if (!Number.isFinite(userId)) {
    return (
      <AppShell title="Edit User">
        <EmptyState title="Invalid user" description="The requested user id is invalid." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit User">
      <div className="space-y-5">
        <PageHeader
          title="Edit User"
          description="Update user profile, role, and active status."
          actions={
            <Button variant="outline" onClick={handleBack} className="h-9 gap-1.5 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          }
        />

        {query.isLoading ? (
          <ResponsiveTableSkeleton />
        ) : !query.data ? (
          <EmptyState title="User not found" description="The requested user could not be loaded." />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <UserForm
              user={query.data}
              onSuccess={() => {
                navigate("/admin/users", { replace: true });
              }}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}