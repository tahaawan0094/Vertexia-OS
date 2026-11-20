"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { GlobalSearchModal } from "./global-search-modal";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Humanize pathname for breadcrumb
  const segments = pathname.split("/").filter(Boolean);

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between">
        {/* Left: Breadcrumbs / Workspace Identity */}
        <div className="flex items-center gap-3 pl-12 lg:pl-0">
          <div className="flex items-center text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              Vertexia HQ
            </span>
            {segments.length > 0 && <span className="mx-2 text-slate-300">/</span>}
            {segments.map((seg, idx) => {
              const isLast = idx === segments.length - 1;
              const formatted = seg.replace(/-/g, " ");
              return (
                <React.Fragment key={seg}>
                  <span
                    className={
                      isLast
                        ? "text-blue-600 font-semibold capitalize"
                        : "text-slate-500 capitalize"
                    }
                  >
                    {formatted}
                  </span>
                  {!isLast && <span className="mx-2 text-slate-300">/</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search Vertexia OS...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Quick Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setQuickCreateOpen(!quickCreateOpen);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {quickCreateOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in"
                onClick={() => setQuickCreateOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Actions
                </div>
                <button
                  onClick={() => router.push("/crm/leads?action=create")}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  New Lead
                </button>
                <button
                  onClick={() => router.push("/clients?action=create")}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  New Client
                </button>
                <button
                  onClick={() => router.push("/finance/invoices?action=create")}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  New Invoice
                </button>
                <button
                  onClick={() => router.push("/installations?action=create")}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  New Installation
                </button>
                <button
                  onClick={() => router.push("/support?action=create")}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  New Support Ticket
                </button>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setQuickCreateOpen(false);
                setUserMenuOpen(false);
              }}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 font-heading">
                    Notifications
                  </span>
                  <button
                    onClick={() => router.push("/notifications")}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="p-4 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  All caught up! No critical pending notifications.
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setQuickCreateOpen(false);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0) : "T"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || "Taha Awan"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {user?.role || "Founder"}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in"
                onClick={() => setUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-semibold text-slate-800">{user?.name || "Taha Awan"}</div>
                  <div className="text-[11px] text-slate-500">{user?.email || "taha@vertexia.pk"}</div>
                </div>

                <button
                  onClick={() => router.push("/admin/users")}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Security & Password
                </button>

                <button
                  onClick={() => router.push("/settings")}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
