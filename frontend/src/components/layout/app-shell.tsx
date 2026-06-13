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

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        {/* Desktop sidebar – hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar
            collapsed={collapsed}
            onSidebarToggle={() => setCollapsed((prev) => !prev)}
          />
        </div>

        {/* Mobile overlay sidebar */}
        <div
          className={cn(
            "fixed inset-0 z-40 md:hidden",
            mobileOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-gray-900/20 transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={closeMobileSidebar}
          />
          {/* Sidebar panel */}
          <div
            className={cn(
              "absolute left-0 top-0 h-full w-[84vw] max-w-72 transform transition-transform duration-300 ease-out",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <AppSidebar
              mobile
              onNavigate={closeMobileSidebar}
              onClose={closeMobileSidebar}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AppHeader
            title={title}
            onMenuClick={() => setMobileOpen(true)}
            onSidebarToggle={() => setCollapsed((prev) => !prev)}
            isSidebarCollapsed={collapsed}
          />
          <main className="flex-1 p-4 md:p-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 md:p-5">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}