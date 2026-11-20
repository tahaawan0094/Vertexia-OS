import React from "react";
import prisma from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldAlert, Terminal } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-slate-800" />
            Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, tamper-evident security record of financial modifications, logins, and entity changes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Audit Trail</CardTitle>
          <span className="text-xs text-slate-400 font-medium">
            Showing latest {auditLogs.length} audit entries
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No Audit Logs"
                description="Security audit records will appear here as authentication and critical record modifications occur."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Details / Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-sans font-medium">
                        {log.user?.name || "System"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-blue-600 font-semibold font-sans">
                        {log.entity} {log.entityId ? `#${log.entityId.slice(-6)}` : ""}
                      </td>
                      <td className="py-3 px-4 max-w-md truncate text-slate-600 font-sans">
                        {log.newValues || log.oldValues ? (
                          <pre className="text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100 overflow-x-auto">
                            {log.newValues || log.oldValues}
                          </pre>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
