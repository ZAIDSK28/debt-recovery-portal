// src/components/layout/app-shell.tsx
import { useEffect, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

const APP_NAME = "Debt Recovery Portal";

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    document.title = title ? `${title} \u2014 ${APP_NAME}` : APP_NAME;
  }, [title]);

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-[#EAEBF8]">
      {/* Flex container for desktop layout */}
      <div className="hidden md:flex">
        {/* Fixed sidebar – width controlled by collapsed state */}
        <div className={cn("transition-all duration-300", collapsed ? "w-[64px]" : "w-[240px]")}>
          <AppSidebar
            collapsed={collapsed}
            onSidebarToggle={() => setCollapsed((prev) => !prev)}
          />
        </div>

        {/* Main content – takes remaining width */}
        <div className="flex-1 min-h-screen flex flex-col">
          <AppHeader
            onMenuClick={() => {}}
            onSidebarToggle={() => setCollapsed((prev) => !prev)}
            isSidebarCollapsed={collapsed}
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>

      {/* Mobile layout – uses overlay sidebar */}
      <div className="md:hidden">
        <div
          className={cn(
            "fixed inset-0 z-40",
            mobileOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 bg-gray-900/20 transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={closeMobileSidebar}
          />
          <div
            className={cn(
              "absolute left-0 top-0 h-full w-[84vw] max-w-72 transform transition-transform duration-300 ease-out",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <AppSidebar
              mobile
              onNavigate={closeMobileSidebar}
              onClose={closeMobileSidebar}
            />
          </div>
        </div>

        {/* Header and content on mobile – no sidebar margin */}
        <AppHeader
          onMenuClick={() => setMobileOpen(true)}
          onSidebarToggle={() => setCollapsed((prev) => !prev)}
          isSidebarCollapsed={collapsed}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}