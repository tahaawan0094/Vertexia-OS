"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  AlertCircle,
  CreditCard,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPKR, formatDate } from "@/lib/utils";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    amount: 5000,
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "BANK_TRANSFER",
    vendor: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setCategories(data.categories || []);
        if (data.categories?.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record expense");

      setIsModalOpen(false);
      setFormData({
        title: "",
        categoryId: categories[0]?.id || "",
        amount: 5000,
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: "BANK_TRANSFER",
        vendor: "",
        description: "",
      });
      fetchExpenses();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete expense "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/expenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete expense");
        return;
      }
      fetchExpenses();
    } catch (err: any) {
      alert("Error deleting expense: " + err.message);
    }
  };

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-amber-600" />
            Company Expense Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track hosting servers, software subscriptions, hardware purchases, and office costs.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>Record Expense</span>
        </Button>
      </div>

      {/* Overview Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Disbursements</span>
          <div className="text-xl font-bold font-heading text-slate-900 mt-1 font-mono">
            {formatPKR(totalExpenseAmount)}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Entries</span>
          <div className="text-xl font-bold font-heading text-slate-900 mt-1">
            {expenses.length} Records
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400">Active Categories</span>
          <div className="text-xl font-bold font-heading text-slate-900 mt-1">
            {categories.length} Categories
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading expense ledger...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Expenses Recorded"
                description="Keep track of cloud server hosting, domain renewals, hardware devices, and vendor costs."
                actionLabel="Log Expense"
                onAction={() => setIsModalOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Expense Code</th>
                    <th className="py-3 px-4">Title / Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount (PKR)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{e.expenseCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {e.title}
                        {e.description && <span className="block text-[11px] text-slate-500 font-normal">{e.description}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {e.category?.name || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{e.vendor || "—"}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {e.paymentMethod.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(e.date)}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700 font-mono">
                        {formatPKR(e.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(e.id, e.title)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title={`Delete ${e.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Operating Expense"
        description="Log an operational disbursement for Vertexia business operations."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Input
            label="Expense Title"
            required
            placeholder="e.g. Hetzner Cloud Server / Namecheap Domain"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Input
              label="Amount (PKR)"
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Credit/Debit Card</option>
              <option value="CASH">Cash</option>
              <option value="JAZZCASH">JazzCash</option>
            </Select>

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <Input
            label="Vendor / Payee"
            placeholder="e.g. AWS, Hetzner, PTCL, Landlord"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          />

          <Textarea
            label="Description / Purpose"
            placeholder="Monthly server invoice, receipt reference..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
