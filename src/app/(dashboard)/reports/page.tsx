import React from "react";
import prisma from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Users,
  Building2,
  Package,
  KeyRound,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [
    payments,
    invoices,
    expenses,
    clients,
    leads,
    installations,
    products,
    tickets,
  ] = await Promise.all([
    prisma.payment.findMany({ where: { status: "COMPLETED" } }),
    prisma.invoice.findMany(),
    prisma.expense.findMany({ include: { category: true } }),
    prisma.client.findMany({ include: { installations: true } }),
    prisma.lead.findMany({ include: { source: true } }),
    prisma.installation.findMany({ include: { product: true, license: true } }),
    prisma.product.findMany({ include: { installations: true } }),
    prisma.ticket.findMany(),
  ]);

  const cashReceived = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalInvoiced = invoices
    .filter((i) => i.status !== "CANCELLED")
    .reduce((acc, i) => acc + i.totalAmount, 0);
  const outstanding = invoices
    .filter((i) => i.status !== "CANCELLED" && i.status !== "PAID")
    .reduce((acc, i) => acc + Math.max(0, i.totalAmount - i.paidAmount), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Group leads by source
  const leadsBySource: Record<string, number> = {};
  leads.forEach((l) => {
    const sName = l.source?.name || "Direct / Unknown";
    leadsBySource[sName] = (leadsBySource[sName] || 0) + 1;
  });

  // Group installations by product
  const installationsByProduct: Record<string, number> = {};
  installations.forEach((ins) => {
    installationsByProduct[ins.product.name] = (installationsByProduct[ins.product.name] || 0) + 1;
  });

  // Group clients by city
  const clientsByCity: Record<string, number> = {};
  clients.forEach((c) => {
    clientsByCity[c.city] = (clientsByCity[c.city] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Executive Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciled company reporting derived from production database transactions.
          </p>
        </div>
      </div>

      {/* Financial Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>1. Financial Performance Statement</CardTitle>
          <span className="text-xs text-slate-400 font-medium">PKR Denomination</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Total Invoiced</span>
              <span className="text-xl font-bold font-heading text-slate-900 font-mono mt-1 block">
                {formatPKR(totalInvoiced)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <span className="text-emerald-700 font-semibold block uppercase text-[10px]">Realized Cash</span>
              <span className="text-xl font-bold font-heading text-emerald-800 font-mono mt-1 block">
                {formatPKR(cashReceived)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-200">
              <span className="text-rose-700 font-semibold block uppercase text-[10px]">Unpaid Receivables</span>
              <span className="text-xl font-bold font-heading text-rose-800 font-mono mt-1 block">
                {formatPKR(outstanding)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200">
              <span className="text-amber-700 font-semibold block uppercase text-[10px]">Total Expenses</span>
              <span className="text-xl font-bold font-heading text-amber-800 font-mono mt-1 block">
                {formatPKR(totalExpenses)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Analytics: Sales Outreach & Client Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle>2. Lead Acquisition Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(leadsBySource).map(([source, count]) => {
              const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
              return (
                <div key={source} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{source}</span>
                    <span>{count} leads ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Product Deployments */}
        <Card>
          <CardHeader>
            <CardTitle>3. Product Deployments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {products.map((p) => {
              const count = p.installations.length;
              const pct = installations.length > 0 ? Math.round((count / installations.length) * 100) : 0;
              return (
                <div key={p.id} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{p.name}</span>
                    <span>{count} installs</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
