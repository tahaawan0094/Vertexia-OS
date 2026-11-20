"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ShieldCheck,
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
      { title: "User & Role Management", href: "/admin/users", icon: ShieldCheck },
      { title: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Audit Logs", href: "/audit-logs", icon: ShieldAlert },
    ],
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export function Sidebar({
  isCollapsed: controlledCollapsed,
  setIsCollapsed: setControlledCollapsed,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setIsCollapsed = setControlledCollapsed || setInternalCollapsed;

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
          "fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-slate-950 border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-slate-800/80 transition-all duration-300",
            isCollapsed ? "justify-between px-3" : "justify-between px-5"
          )}
        >
          {!isCollapsed ? (
            <>
              <Link href="/" className="flex items-center gap-3 min-w-0">
                <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Vertexia OS Logo"
                    width={32}
                    height={32}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-heading font-black text-sm tracking-wide text-white leading-none truncate">
                    VERTEXIA <span className="text-blue-500 font-semibold">OS</span>
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-tight mt-1 truncate">
                    Business Control
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="relative w-8 h-8 shrink-0 flex items-center justify-center"
                title="Vertexia OS"
              >
                <Image
                  src="/logo.png"
                  alt="Vertexia OS Logo"
                  width={32}
                  height={32}
                  className="object-contain w-full h-full"
                  priority
                />
              </Link>
              <button
                onClick={() => setIsCollapsed(false)}
                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation list: hidden scrollbar */}
        <div className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-3 px-2 space-y-4">
          {navigationGroups.map((group, gIdx) => (
            <div key={group.group} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                  {group.group}
                </div>
              ) : (
                gIdx > 0 && <div className="h-px bg-slate-800/80 my-2 mx-2" />
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
                      "relative flex items-center rounded-xl transition-all duration-200 group",
                      isCollapsed
                        ? "w-11 h-11 mx-auto justify-center"
                        : "gap-3 px-3 py-2 text-xs font-medium",
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/90"
                    )}
                  >
                    <Icon
                      className={cn(
                        "shrink-0 transition-transform group-hover:scale-110",
                        isCollapsed ? "w-5 h-5" : "w-4 h-4",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />

                    {!isCollapsed && (
                      <span className="truncate tracking-wide">{item.title}</span>
                    )}

                    {/* Collapsed mode floating tooltip */}
                    {isCollapsed && (
                      <div className="fixed left-20 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800 tracking-wide">
                        {item.title}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Karachi HQ (PKR)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"
                title="Karachi HQ • Connected"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
