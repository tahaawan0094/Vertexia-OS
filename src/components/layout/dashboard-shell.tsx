"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  user: any;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore user's collapse preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vertexia_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem("vertexia_sidebar_collapsed", String(collapsed));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation with controlled collapse state */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={handleToggleCollapse} />

      {/* Main Content Area: dynamically animates margin/padding when sidebar collapses */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        {/* Top Header */}
        <Header user={user} />

        {/* Page Viewport */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
