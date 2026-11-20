"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  Trash2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPKR, formatDate } from "@/lib/utils";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(
    searchParams.get("action") === "create"
  );

  // New Invoice Form
  const [clientId, setClientId] = useState(searchParams.get("clientId") || "");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Due on receipt (Within 14 days)");
  const [items, setItems] = useState<LineItem[]>([
    { description: "Vertexia Pharmacy POS — Lifetime Perpetual License", quantity: 1, unitPrice: 65000 },
  ]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (statusFilter !== "ALL") q.append("status", statusFilter);

      const res = await fetch(`/api/finance/invoices?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setClients(data.clients || []);
        if (data.clients?.length > 0 && !clientId) {
          setClientId(data.clients[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    return Math.max(0, sub - (Number(discount) || 0) + (Number(tax) || 0));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          dueDate: dueDate || null,
          items,
          discount: Number(discount) || 0,
          tax: Number(tax) || 0,
          notes,
          paymentTerms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");

      setIsModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (id: string, num: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete invoice ${num}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete invoice");
        return;
      }
      fetchInvoices();
    } catch (err: any) {
      alert("Error deleting invoice: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Invoices & Client Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate formal commercial invoices, issue receipts, and track payment status.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>New Invoice</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
            placeholder="Search by invoice # or client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1 px-2 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Invoices Issued Yet"
                description="Create a verified commercial invoice for client onboarding or license renewal."
                actionLabel="Create Invoice"
                onAction={() => setIsModalOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Paid Amount</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {invoices.map((inv) => {
                    const balance = Math.max(0, inv.totalAmount - inv.paidAmount);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          <Link href={`/finance/invoices/${inv.id}`} className="hover:text-blue-600">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/clients/${inv.client.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                            {inv.client.businessName}
                          </Link>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {inv.client.clientCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(inv.issueDate)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          {formatPKR(inv.totalAmount)}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700 font-mono">
                          {formatPKR(inv.paidAmount)}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600 font-mono">
                          {formatPKR(balance)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              title={`Delete ${inv.invoiceNumber}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              href={`/finance/invoices/${inv.id}`}
                              className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                              Manage →
                            </Link>
                          </div>
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

      {/* New Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Commercial Invoice"
        description="Issue a new billing invoice with structured itemization and payment terms."
        maxWidth="2xl"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientCode} — {c.businessName}
                </option>
              ))}
            </Select>

            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Line items editor */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 font-heading">
                Line Items
              </span>
              <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="w-3 h-3 mr-1" /> Add Line
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Product or service description"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-right font-mono focus:outline-none focus:border-blue-500"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal, discount, tax calculations */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <Input
              label="Discount (PKR)"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
            <Input
              label="Tax / GST (PKR)"
              type="number"
              min="0"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
            />
            <div className="col-span-2 sm:col-span-1 p-2 rounded-lg bg-slate-50 border border-slate-200 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {formatPKR(calculateTotal())}
              </span>
            </div>
          </div>

          <Input
            label="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />

          <Textarea
            label="Notes to Client"
            placeholder="Official bank account info, JazzCash/Easypaisa merchant details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
