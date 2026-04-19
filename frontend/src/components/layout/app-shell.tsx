import { useState, type ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.75),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#f0f9ff_100%)]">
      <div className="flex min-h-screen">
        <AppSidebar collapsed={collapsed} />

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[84vw] max-w-72">
              <AppSidebar collapsed={false} />
            </div>
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AppHeader
            title={title}
            onMenuClick={() => setMobileOpen(true)}
            onSidebarToggle={() => setCollapsed((prev) => !prev)}
            isSidebarCollapsed={collapsed}
          />
          <main className={cn("flex-1 px-3 py-3.5 sm:px-4 sm:py-5 md:px-6 md:py-6")}>{children}</main>
        </div>
      </div>
    </div>
  );
}