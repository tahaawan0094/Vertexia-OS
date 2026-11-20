"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  KeyRound,
  Receipt,
  LifeBuoy,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "PUT" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Central Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System alerts for scheduled follow-ups, payment milestones, expiring licenses, and customer tickets.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Checking for alerts...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={CheckCircle2}
                title="All Caught Up!"
                description="There are no urgent operational notifications or overdue alerts at this time."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    n.isRead ? "bg-white" : "bg-blue-50/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-xs text-slate-900">
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  {n.link && (
                    <Link
                      href={n.link}
                      className="text-xs font-semibold text-blue-600 hover:underline shrink-0"
                    >
                      View Details →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
