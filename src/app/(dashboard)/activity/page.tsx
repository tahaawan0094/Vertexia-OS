import React from "react";
import prisma from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity as ActivityIcon, Filter, Clock, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivityCenterPage() {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Activity Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time business activity stream across all Vertexia OS operations.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-blue-600" />
            <CardTitle>Company Event Timeline</CardTitle>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing latest {activities.length} recorded events
          </span>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <EmptyState
              title="No Activity Yet"
              description="Actions performed by team members (lead updates, invoice creation, installations) will appear here in chronological order."
            />
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
              {activities.map((act) => (
                <div key={act.id} className="relative group">
                  <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wide">
                          {act.module}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {act.event.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(act.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {act.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Action by: <strong className="text-slate-700">{act.userName}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
