import React from "react";
import prisma from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DollarSign,
  CreditCard,
  AlertCircle,
  Users,
  UserCheck,
  TrendingUp,
  KeyRound,
  LifeBuoy,
  CheckSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Parallel database queries for real statistics
  const [
    payments,
    invoices,
    expenses,
    clients,
    leads,
    newLeadsThisMonth,
    installations,
    tickets,
    tasks,
    pendingFollowups,
    overdueFollowups,
    products,
    recentActivities,
  ] = await Promise.all([
    // All completed payments
    prisma.payment.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, paymentDate: true },
    }),
    // Invoices
    prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
        client: { select: { businessName: true } },
      },
    }),
    // Expenses
    prisma.expense.findMany({
      select: { amount: true, date: true },
    }),
    // Clients
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        clientCode: true,
        businessName: true,
        status: true,
        createdAt: true,
        city: true,
      },
    }),
    // Total Leads count & pipeline grouping
    prisma.lead.findMany({
      select: { id: true, status: true, estimatedValue: true, source: { select: { name: true } } },
    }),
    // New Leads this month
    prisma.lead.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    // Installations
    prisma.installation.findMany({
      select: {
        id: true,
        installCode: true,
        status: true,
        softwareVersion: true,
        client: { select: { businessName: true } },
        product: { select: { name: true } },
        license: { select: { type: true, expiresAt: true, status: true } },
      },
    }),
    // Support Tickets
    prisma.ticket.findMany({
      where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CLIENT"] } },
      orderBy: { priority: "desc" },
      take: 5,
      include: { client: { select: { businessName: true } }, product: { select: { name: true } } },
    }),
    // Tasks
    prisma.task.findMany({
      where: { status: { notIn: ["DONE", "CANCELLED"] } },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { assignedTo: { select: { name: true } } },
    }),
    // Today's & Pending Follow-ups
    prisma.followup.findMany({
      where: { status: "PENDING" },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: {
        lead: { select: { businessName: true } },
        client: { select: { businessName: true } },
      },
    }),
    // Overdue Follow-ups
    prisma.followup.count({
      where: { status: "PENDING", scheduledAt: { lt: now } },
    }),
    // Products
    prisma.product.findMany({
      select: { id: true, name: true, status: true, currentVersion: true },
    }),
    // Recent Activities
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  // Financial Calculations
  const cashReceived = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalInvoiced = invoices
    .filter((inv) => inv.status !== "CANCELLED")
    .reduce((acc, inv) => acc + inv.totalAmount, 0);
  const outstandingPayments = invoices
    .filter((inv) => inv.status !== "CANCELLED" && inv.status !== "PAID")
    .reduce((acc, inv) => acc + Math.max(0, inv.totalAmount - inv.paidAmount), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Clients & Installations
  const activeClientsCount = await prisma.client.count({ where: { status: "ACTIVE" } });
  const totalClientsCount = await prisma.client.count();
  const activeInstallationsCount = installations.filter((i) => i.status === "ACTIVE").length;

  // Pipeline distribution
  const leadsByStatus: Record<string, number> = {};
  leads.forEach((l) => {
    leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
  });

  // Expiring licenses (within 30 days)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringLicenses = installations.filter(
    (i) => i.license?.expiresAt && new Date(i.license.expiresAt) <= thirtyDaysFromNow
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              Executive Business Overview
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Live Production
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time operating summary for Vertexia Software Company • Karachi, Pakistan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>As of {formatDate(now)}</span>
          </div>
        </div>
      </div>

      {/* 10 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Cash Received"
          value={formatPKR(cashReceived)}
          subtitle="Realized cash in bank/cash"
          icon={DollarSign}
          href="/finance"
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          title="Total Invoiced"
          value={formatPKR(totalInvoiced)}
          subtitle="All finalized invoices"
          icon={CreditCard}
          href="/finance/invoices"
          colorClass="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatPKR(outstandingPayments)}
          subtitle="Uncollected receivables"
          icon={AlertCircle}
          href="/finance/invoices"
          colorClass="text-rose-600 bg-rose-50"
        />
        <StatCard
          title="Active Clients"
          value={activeClientsCount}
          subtitle={`Total Registered: ${totalClientsCount}`}
          icon={UserCheck}
          href="/clients"
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          title="Total Leads"
          value={leads.length}
          subtitle={`+${newLeadsThisMonth} this month`}
          icon={Users}
          href="/crm/leads"
          colorClass="text-cyan-600 bg-cyan-50"
        />
        <StatCard
          title="Active Installations"
          value={activeInstallationsCount}
          subtitle={`Total records: ${installations.length}`}
          icon={KeyRound}
          href="/installations"
          colorClass="text-purple-600 bg-purple-50"
        />
        <StatCard
          title="Total Expenses"
          value={formatPKR(totalExpenses)}
          subtitle="Operating disbursements"
          icon={TrendingUp}
          href="/finance/expenses"
          colorClass="text-amber-600 bg-amber-50"
        />
        <StatCard
          title="Open Support Tickets"
          value={tickets.length}
          subtitle="Requiring resolution"
          icon={LifeBuoy}
          href="/support"
          colorClass="text-rose-600 bg-rose-50"
        />
        <StatCard
          title="Pending Tasks"
          value={tasks.length}
          subtitle="Across active projects"
          icon={CheckSquare}
          href="/projects"
          colorClass="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Overdue Follow-ups"
          value={overdueFollowups}
          subtitle="Needs immediate action"
          icon={Clock}
          href="/crm/follow-ups"
          colorClass={overdueFollowups > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50"}
        />
      </div>

      {/* Main Grid: Pipeline, Actions, Installations & Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Sales Pipeline & Financial Receivables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Pipeline Breakdown */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Sales Pipeline Stages</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  CRM prospects moving through Vertexia sales funnel
                </p>
              </div>
              <Link
                href="/crm/leads"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Kanban View <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "New Leads", key: "NEW", color: "bg-blue-500" },
                  { label: "Contacted", key: "CONTACTED", color: "bg-cyan-500" },
                  { label: "Interested", key: "INTERESTED", color: "bg-indigo-500" },
                  { label: "Demo Scheduled", key: "DEMO_SCHEDULED", color: "bg-purple-500" },
                  { label: "Demo Completed", key: "DEMO_COMPLETED", color: "bg-violet-500" },
                  { label: "Negotiation", key: "NEGOTIATION", color: "bg-amber-500" },
                  { label: "Deals Won", key: "WON", color: "bg-emerald-500" },
                  { label: "Deals Lost", key: "LOST", color: "bg-rose-400" },
                ].map((st) => (
                  <div
                    key={st.key}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
                      <span className="text-[11px] font-semibold text-slate-600 truncate">
                        {st.label}
                      </span>
                    </div>
                    <div className="text-xl font-bold font-heading text-slate-900">
                      {leadsByStatus[st.key] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Product Portfolio */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Product Portfolio</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Commercial and in-development software products
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Manage Products <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-heading font-semibold text-sm text-slate-900">
                          {p.name}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Current Release: <code className="font-mono font-bold text-slate-700">v{p.currentVersion}</code>
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Installations: {installations.filter((i) => i.product.name === p.name).length}</span>
                      <Link href={`/products/${p.id}`} className="text-blue-600 font-medium hover:underline">
                        Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* High Priority Support Tickets */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Open Support Tickets</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client issues requiring technical attention
                </p>
              </div>
              <Link
                href="/support"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Helpdesk <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <EmptyState
                  title="No Open Tickets"
                  description="All customer support tickets have been resolved. Excellent work!"
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-md transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {t.ticketCode}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {t.title}
                          </span>
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Client: {t.client.businessName}</span>
                          <span>•</span>
                          <span>{t.product?.name || "General"}</span>
                        </div>
                      </div>
                      <Link
                        href={`/support/${t.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline shrink-0"
                      >
                        Respond →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span): Upcoming Actions & Recent Activities */}
        <div className="space-y-6">
          {/* Upcoming Actions & Follow-ups */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Action Items Today</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Follow-ups and critical tasks
                </p>
              </div>
              <Link
                href="/crm/follow-ups"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                All Follow-ups
              </Link>
            </CardHeader>
            <CardContent>
              {pendingFollowups.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No pending follow-ups scheduled for today.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingFollowups.map((f) => {
                    const isOverdue = new Date(f.scheduledAt) < now;
                    return (
                      <div
                        key={f.id}
                        className={`p-3 rounded-lg border text-xs transition-colors ${
                          isOverdue
                            ? "border-rose-200 bg-rose-50/40"
                            : "border-slate-200 bg-slate-50/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-800">
                            {f.lead?.businessName || f.client?.businessName || "Contact"}
                          </span>
                          <span
                            className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                              isOverdue ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {f.type}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] line-clamp-1 mb-1.5">
                          {f.notes || "Follow-up discussion scheduled"}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(f.scheduledAt)}
                          </span>
                          {isOverdue && (
                            <span className="text-rose-600 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historical Installation Note */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-heading font-semibold text-xs text-white">
                Historical Installations Reconciler
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              Vertexia has 5 historical installations reported. Per operating rule, all 5 must be formally linked to verified customer and branch records rather than populated as dummy placeholder stats.
            </p>
            <div className="flex items-center justify-between text-[11px] border-t border-slate-700/80 pt-2.5">
              <span className="text-slate-400">Recorded in DB:</span>
              <span className="font-bold text-white font-mono">{installations.length} / 5 reconciled</span>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit trail of operational events
                </p>
              </div>
              <Link
                href="/activity"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View Log
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No activity recorded yet. Activities will automatically log as you use the platform.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="flex gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-slate-800 font-medium leading-snug">
                          {act.description}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(act.createdAt)} by {act.userName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
