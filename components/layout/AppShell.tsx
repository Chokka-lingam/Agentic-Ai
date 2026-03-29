"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import type { ProfileSummary } from "@/lib/types";

type AppShellProps = {
  children: ReactNode;
  userEmail?: string | null;
  profile?: ProfileSummary | null;
};

export function AppShell({ children, userEmail, profile }: AppShellProps) {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarOffset = isDesktopSidebarOpen ? "md:pl-72" : "md:pl-24";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <AppSidebar
        isOpen={isDesktopSidebarOpen}
        onToggle={() => setIsDesktopSidebarOpen((current) => !current)}
        onNavigate={() => setIsMobileSidebarOpen(false)}
      />
      <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      <div className={`min-h-screen transition-all duration-300 ${sidebarOffset}`}>
        <AppTopbar onMenuClick={() => setIsMobileSidebarOpen(true)} userEmail={userEmail} profile={profile} />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
