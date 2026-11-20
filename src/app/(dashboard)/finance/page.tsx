import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { formatPKR, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Wallet,
  Receipt,
  TrendingDown,
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function FinanceDashboardPage() {
  const [payments, invoices, expenses, expenseCategories] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { paymentDate: "desc" },
      include: { client: { select: { businessName: true, clientCode: true } } },
    }),
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: { client: { select: { businessName: true } } },
    }),
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: { category: true },
    }),
    prisma.expenseCategory.findMany({
      include: { expenses: { select: { amount: true } } },
    }),
  ]);

  const cashReceived = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((acc, p) => acc + p.amount, 0);

  const totalInvoiced = invoices
    .filter((i) => i.status !== "CANCELLED")
    .reduce((acc, i) => acc + i.totalAmount, 0);

  const outstanding = invoices
    .filter((i) => i.status !== "CANCELLED" && i.status !== "PAID")
    .reduce((acc, i) => acc + Math.max(0, i.totalAmount - i.paidAmount), 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netCashFlow = cashReceived - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            Finance & Cash Flow Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Realized cash collections, outstanding client receivables, and operational expenses in PKR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/finance/invoices?action=create">
            <Button size="sm">
              <Receipt className="w-3.5 h-3.5 mr-1" />
              <span>Create Invoice</span>
            </Button>
          </Link>
          <Link href="/finance/expenses">
            <Button size="sm" variant="outline">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              <span>Log Expense</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Cash Received"
          value={formatPKR(cashReceived)}
          subtitle="Realized cash in bank/cash"
          icon={DollarSign}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          title="Total Invoiced"
          value={formatPKR(totalInvoiced)}
          subtitle="All finalized billings"
          icon={CreditCard}
          href="/finance/invoices"
          colorClass="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatPKR(outstanding)}
          subtitle="Uncollected receivables"
          icon={AlertCircle}
          href="/finance/invoices"
          colorClass="text-rose-600 bg-rose-50"
        />
        <StatCard
          title="Total Expenses"
          value={formatPKR(totalExpenses)}
          subtitle="Operating disbursements"
          icon={TrendingDown}
          href="/finance/expenses"
          colorClass="text-amber-600 bg-amber-50"
        />
        <StatCard
          title="Net Cash Position"
          value={formatPKR(netCashFlow)}
          subtitle="Cash received minus costs"
          icon={TrendingUp}
          colorClass={netCashFlow >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}
        />
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Payments & Unpaid Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Payments Received */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cash Collection Receipts</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Realized bank and digital cash transfers.</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">PKR Currency</span>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No Cash Payments Recorded"
                    description="Payments recorded against invoices will appear here in the verified audit ledger."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Payment Code</th>
                        <th className="py-2.5 px-4">Client</th>
                        <th className="py-2.5 px-4">Method</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4 text-right">Amount Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{p.paymentCode}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{p.client.businessName}</td>
                          <td className="py-2.5 px-4 text-slate-600">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold">
                              {p.paymentMethod.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-700 font-mono">
                            {formatPKR(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outstanding Receivables */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Outstanding Invoices</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Invoices with remaining uncollected balances.</p>
              </div>
              <Link href="/finance/invoices" className="text-xs font-semibold text-blue-600 hover:underline">
                All Invoices →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No overdue or outstanding invoices. All billings are clear!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Invoice #</th>
                        <th className="py-2.5 px-4">Client</th>
                        <th className="py-2.5 px-4">Due Date</th>
                        <th className="py-2.5 px-4">Total</th>
                        <th className="py-2.5 px-4 text-right">Balance Due</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices
                        .filter((i) => i.status !== "PAID" && i.status !== "CANCELLED")
                        .map((inv) => {
                          const bal = Math.max(0, inv.totalAmount - inv.paidAmount);
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{inv.invoiceNumber}</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.client.businessName}</td>
                              <td className="py-2.5 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                              <td className="py-2.5 px-4 text-slate-700">{formatPKR(inv.totalAmount)}</td>
                              <td className="py-2.5 px-4 text-right font-bold text-rose-600">{formatPKR(bal)}</td>
                              <td className="py-2.5 px-4 text-right">
                                <Link
                                  href={`/finance/invoices/${inv.id}`}
                                  className="text-blue-600 font-semibold hover:underline"
                                >
                                  Collect →
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span): Expenses Breakdown & Policy */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Expense Distribution</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Operating costs by category.</p>
              </div>
              <Link href="/finance/expenses" className="text-xs font-semibold text-blue-600 hover:underline">
                Manage
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {expenseCategories.map((cat) => {
                const totalCat = cat.expenses.reduce((sum, e) => sum + e.amount, 0);
                return (
                  <div key={cat.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{cat.name}</span>
                    <span className="font-bold text-slate-900 font-mono">{formatPKR(totalCat)}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Financial Rules Notice */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-heading font-semibold text-xs text-white">
                Vertexia Financial Controls
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              1. Deal pipeline estimates are separate from invoiced revenue.<br />
              2. Cash is only recognized upon verified payment receipt.<br />
              3. Lifetime software purchases are excluded from Monthly Recurring Revenue (MRR).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
