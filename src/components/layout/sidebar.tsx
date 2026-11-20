"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Users,
  Building2,
  CalendarClock,
  LifeBuoy,
  Package,
  KeyRound,
  FolderKanban,
  UserCog,
  Wallet,
  Receipt,
  TrendingDown,
  FileText,
  BarChart3,
  BookOpen,
  Bell,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Activity Center", href: "/activity", icon: Activity },
    ],
  },
  {
    group: "CUSTOMER MANAGEMENT",
    items: [
      { title: "CRM & Leads", href: "/crm/leads", icon: Users },
      { title: "Clients", href: "/clients", icon: Building2 },
      { title: "Follow-ups", href: "/crm/follow-ups", icon: CalendarClock },
      { title: "Support Tickets", href: "/support", icon: LifeBuoy },
    ],
  },
  {
    group: "PRODUCTS & OPERATIONS",
    items: [
      { title: "Products", href: "/products", icon: Package },
      { title: "Installations & Licenses", href: "/installations", icon: KeyRound },
      { title: "Projects & Tasks", href: "/projects", icon: FolderKanban },
      { title: "Team Management", href: "/team", icon: UserCog },
    ],
  },
  {
    group: "BUSINESS MANAGEMENT",
    items: [
      { title: "Finance Overview", href: "/finance", icon: Wallet },
      { title: "Invoices", href: "/finance/invoices", icon: Receipt },
      { title: "Expenses", href: "/finance/expenses", icon: TrendingDown },
      { title: "Documents", href: "/documents", icon: FileText },
      { title: "Reports & Analytics", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { title: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Audit Logs", href: "/audit-logs", icon: ShieldAlert },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger trigger */}
      <div className="lg:hidden fixed top-3 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-900 text-white shadow-md focus:outline-none"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-slate-950 border-r border-slate-800 text-slate-300 transition-all duration-300 select-none",
          isCollapsed ? "w-18" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          {!isCollapsed ? (
            <Link href="/" className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs tracking-wider">
                  V
                </div>
                <span className="font-heading font-bold text-base tracking-wide text-white">
                  VERTEXIA <span className="text-blue-500 font-normal">OS</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-tight pl-8">
                Business Control Center
              </span>
            </Link>
          ) : (
            <div className="w-7 h-7 mx-auto rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              V
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-sm"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate tracking-wide">{item.title}</span>
                    )}

                    {/* Collapsed tooltip badge indicator */}
                    {isCollapsed && isActive && (
                      <div className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-blue-500 rounded-r" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        {!isCollapsed && (
          <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Karachi HQ (PKR)
              </span>
              <span className="text-[10px] text-slate-400">v1.0.0</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
