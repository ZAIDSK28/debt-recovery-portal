// src/pages/admin/admin-user-create-page.tsx
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/page-header";
import { UserForm } from "@/components/users/user-form";

export default function AdminUserCreatePage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Create User"
          description="Add a new admin or DRA user."
        />

        <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <UserForm
            onSuccess={() => {
              navigate("/admin/users", { replace: true });
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}