"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Phone,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [counts, setCounts] = useState({ today: 0, overdue: 0, upcoming: 0, completed: 0 });
  const [filter, setFilter] = useState("TODAY");
  const [loading, setLoading] = useState(true);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/followups?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setFollowups(data.followups || []);
        setCounts(data.counts || { today: 0, overdue: 0, upcoming: 0, completed: 0 });
      }
    } catch (err) {
      console.error("Failed to load follow-ups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [filter]);

  const handleMarkCompleted = async (id: string) => {
    try {
      const res = await fetch("/api/crm/followups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "COMPLETED" }),
      });
      if (res.ok) {
        fetchFollowups();
      }
    } catch (err) {
      console.error("Failed to mark completed:", err);
    }
  };

  const handleDeleteFollowup = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this scheduled follow-up?")) {
      return;
    }

    try {
      const res = await fetch(`/api/crm/followups?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete follow-up");
        return;
      }
      fetchFollowups();
    } catch (err: any) {
      alert("Error deleting follow-up: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Lead & Client Follow-up Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Never lose track of a prospect or client check-in. All sales and renewal touches in one place.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <Tabs
            tabs={[
              { id: "TODAY", label: "Today's Follow-ups", count: counts.today },
              { id: "OVERDUE", label: "Overdue Items", count: counts.overdue },
              { id: "UPCOMING", label: "Upcoming", count: counts.upcoming },
              { id: "COMPLETED", label: "Completed", count: counts.completed },
              { id: "ALL", label: "All Follow-ups" },
            ]}
            activeTab={filter}
            onChange={setFilter}
          />
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading follow-ups...</div>
          ) : followups.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Follow-ups in this View"
                description="Scheduled calls, WhatsApp follow-ups, and demo reminders will appear here."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {followups.map((f) => {
                const target = f.lead || f.client;
                const isOverdue = new Date(f.scheduledAt) < new Date() && f.status === "PENDING";
                const isLead = !!f.lead;

                return (
                  <div
                    key={f.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors ${
                      isOverdue ? "bg-rose-50/20" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isOverdue
                              ? "bg-rose-100 text-rose-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {f.type}
                        </span>

                        <span className="font-heading font-semibold text-sm text-slate-900">
                          {target?.businessName || "Unknown Target"}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          ({target?.leadCode || target?.clientCode})
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {f.notes || "Follow-up conversation scheduled"}
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Scheduled: {formatDate(f.scheduledAt)}
                        </span>
                        {target?.phone && (
                          <span className="flex items-center gap-1 font-mono text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {target.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {f.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkCompleted(f.id)}
                          className="text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Mark Done
                        </Button>
                      )}

                      <Link
                        href={isLead ? `/crm/leads/${target.id}` : `/clients/${target.id}`}
                        className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1"
                      >
                        <span>Open {isLead ? "Lead" : "Client"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteFollowup(f.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                        title="Delete follow-up"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
