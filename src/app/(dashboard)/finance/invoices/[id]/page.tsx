"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Download,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Ban,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatPKR, formatDate } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-invoice";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Record Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [recordingPay, setRecordingPay] = useState(false);
  const [payError, setPayError] = useState("");

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/finance/invoices/${id}`);
      if (!res.ok) {
        router.push("/finance/invoices");
        return;
      }
      const data = await res.json();
      setInvoice(data.invoice);
      const remaining = Math.max(0, data.invoice.totalAmount - data.invoice.paidAmount);
      setPayAmount(remaining);
    } catch (err) {
      console.error("Failed to load invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const handleDownloadPDF = () => {
    if (!invoice) return;
    const doc = generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      currency: invoice.currency,
      client: {
        businessName: invoice.client.businessName,
        contactPerson: invoice.client.contactPerson,
        phone: invoice.client.phone,
        email: invoice.client.email,
        address: invoice.client.address,
        city: invoice.client.city,
      },
      items: invoice.items.map((i: any) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount,
      })),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      notes: invoice.notes,
      paymentTerms: invoice.paymentTerms,
    });

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    setRecordingPay(true);

    try {
      const res = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: invoice.clientId,
          invoiceId: invoice.id,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceNo: payRef,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");

      setPayModalOpen(false);
      fetchInvoice();
    } catch (err: any) {
      setPayError(err.message);
    } finally {
      setRecordingPay(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!confirm("Are you sure you want to cancel this invoice? This will be recorded in audit logs.")) return;
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) fetchInvoice();
    } catch (err) {
      console.error("Failed to cancel invoice:", err);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    if (!window.confirm(`Are you sure you want to permanently delete invoice ${invoice.invoiceNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete invoice");
        return;
      }
      router.push("/finance/invoices");
    } catch (err: any) {
      alert("Error deleting invoice: " + err.message);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading invoice document...</div>;
  }

  if (!invoice) return null;

  const balanceDue = Math.max(0, invoice.totalAmount - invoice.paidAmount);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/finance/invoices"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Back to Invoices
        </Link>
      </div>

      {/* Action Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {invoice.invoiceNumber}
            </span>
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              {invoice.client.businessName}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-2">
            <span>Issued: {formatDate(invoice.issueDate)}</span>
            <span>•</span>
            <span>Due Date: {formatDate(invoice.dueDate)}</span>
            <span>•</span>
            <span>Client Code: <strong className="font-mono text-slate-700">{invoice.client.clientCode}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteInvoice}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Delete</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Download Official PDF</span>
          </Button>

          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Button size="sm" onClick={() => setPayModalOpen(true)}>
              <CreditCard className="w-3.5 h-3.5 mr-1" />
              <span>Record Payment</span>
            </Button>
          )}

          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Button variant="outline" size="sm" onClick={handleCancelInvoice} className="text-rose-600 hover:bg-rose-50">
              <Ban className="w-3.5 h-3.5 mr-1" />
              <span>Cancel</span>
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Document Visual Display */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-lg p-8 space-y-6">
        {/* Brand Document Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                V
              </div>
              <span className="font-heading font-bold text-lg text-slate-900">
                VERTEXIA <span className="text-blue-600">OS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Vertexia Software Company • Karachi, Pakistan</p>
            <p className="text-xs text-slate-400">contact@vertexia.pk • https://vertexia.pk</p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold font-heading text-slate-900 block">INVOICE</span>
            <span className="text-xs font-mono font-bold text-slate-500">{invoice.invoiceNumber}</span>
          </div>
        </div>

        {/* Bill To & Meta */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Billed To</span>
            <strong className="text-sm text-slate-900 block">{invoice.client.businessName}</strong>
            <span className="text-slate-600 block">{invoice.client.contactPerson}</span>
            <span className="text-slate-500 block">{invoice.client.address}, {invoice.client.city}</span>
            <span className="text-slate-500 font-mono block">{invoice.client.phone}</span>
          </div>

          <div className="text-right space-y-1">
            <div>
              <span className="text-slate-400">Issue Date: </span>
              <strong className="text-slate-800">{formatDate(invoice.issueDate)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Due Date: </span>
              <strong className="text-slate-800">{formatDate(invoice.dueDate)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Status: </span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="pt-1">
              <span className="text-slate-400">Balance Due: </span>
              <strong className="text-sm font-bold text-rose-600 font-mono">
                {formatPKR(balanceDue)}
              </strong>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2.5 px-3 text-slate-800 font-medium">{item.description}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{formatPKR(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{formatPKR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end text-xs">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatPKR(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount:</span>
                <span className="font-mono text-emerald-700">- {formatPKR(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / GST:</span>
                <span className="font-mono">{formatPKR(invoice.tax)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>Total Amount:</span>
              <span className="font-mono">{formatPKR(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs text-emerald-700">
              <span>Amount Paid:</span>
              <span className="font-mono">{formatPKR(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs text-rose-600 pt-1 border-t border-slate-100">
              <span>Balance Due:</span>
              <span className="font-mono">{formatPKR(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms & Notes */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1">
          <div>
            <strong className="text-slate-800">Payment Terms: </strong>
            <span>{invoice.paymentTerms || "Due on receipt"}</span>
          </div>
          {invoice.notes && (
            <div>
              <strong className="text-slate-800">Bank Details / Notes: </strong>
              <span>{invoice.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal (Workflow C) */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Payment Receipt"
        description={`Allocate cash received against ${invoice.invoiceNumber}.`}
        maxWidth="md"
      >
        {payError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{payError}</span>
          </div>
        )}

        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label="Payment Amount (PKR)"
            type="number"
            required
            max={balanceDue}
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            helperText={`Max balance due: ${formatPKR(balanceDue)}`}
          />

          <Select
            label="Payment Method"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
          >
            <option value="BANK_TRANSFER">Bank Transfer (Meezan / Alfalah / HBL)</option>
            <option value="JAZZCASH">JazzCash</option>
            <option value="EASYPAISA">Easypaisa</option>
            <option value="CASH">Cash in Hand</option>
            <option value="ONLINE">Online Gateway / Card</option>
          </Select>

          <Input
            label="Transaction / Reference #"
            placeholder="e.g. TRX-98214488 or Cheque #"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />

          <Textarea
            label="Receipt Notes"
            placeholder="Deposited to company account, verified by finance..."
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={recordingPay}>
              Record & Allocate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
