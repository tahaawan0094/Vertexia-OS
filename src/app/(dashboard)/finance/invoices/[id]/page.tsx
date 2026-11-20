"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Printer,
  CreditCard,
  Ban,
  Trash2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatPKR } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-invoice";

const formatInvoiceDate = (date: string | Date) => {
  const d = new Date(date);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

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

  const handlePrint = () => {
    window.print();
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
          invoiceId: invoice.id,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceNumber: payRef,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");

      setPayModalOpen(false);
      setPayRef("");
      setPayNotes("");
      fetchInvoice();
    } catch (err: any) {
      setPayError(err.message);
    } finally {
      setRecordingPay(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!window.confirm("Are you sure you want to cancel this invoice?")) return;

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
    if (
      !window.confirm(
        `Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`
      )
    ) {
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
  const invoiceNumStr = invoice.invoiceNumber.startsWith("INV-")
    ? `INVOICE NO.${invoice.invoiceNumber.replace(/^INV-0*/i, "")}`
    : `INVOICE NO.${invoice.invoiceNumber}`;

  return (
    <div className="space-y-6">
      {/* Navigation & Controls Banner (Hidden in Print) */}
      <div className="no-print space-y-4">
        <div>
          <Link
            href="/finance/invoices"
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoices</span>
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
              {invoice.invoiceNumber}
            </span>
            <h1 className="text-xl font-bold font-heading text-slate-900 tracking-tight">
              {invoice.client.businessName}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print Invoice</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Download PDF</span>
            </Button>

            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
              <Button size="sm" onClick={() => setPayModalOpen(true)}>
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                <span>Record Payment</span>
              </Button>
            )}

            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelInvoice}
                className="text-rose-600 hover:bg-rose-50 hover:border-rose-200"
              >
                <Ban className="w-3.5 h-3.5 mr-1" />
                <span>Cancel</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteInvoice}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Document Visual Display — Exact match to the user-provided design */}
      <div className="max-w-[760px] mx-auto bg-white border-[1.5px] border-black rounded-[14px] p-8 sm:p-14 text-black shadow-lg print:shadow-none print:border-black print:p-8 print:max-w-none print:m-0">
        {/* Header: INVOICE and ArrowDownLeft Icon */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-black leading-none">
              INVOICE
            </h1>
            <p className="text-xs sm:text-sm font-bold tracking-wider text-black mt-3 uppercase">
              {invoiceNumStr}
            </p>
          </div>

          {/* Top-Right Arrow Mark */}
          <div className="pt-1">
            <svg
              className="w-8 h-8 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="17" y1="7" x2="7" y2="17"></line>
              <polyline points="17 17 7 17 7 7"></polyline>
            </svg>
          </div>
        </div>

        {/* Top Divider */}
        <div className="border-b-[1.5px] border-black my-5" />

        {/* ISSUED TO & Issued Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-black">
          <div className="space-y-1">
            <span className="font-bold text-xs uppercase tracking-wide text-black block mb-2">
              ISSUED TO :
            </span>
            {invoice.client.contactPerson && (
              <p className="font-normal text-black">{invoice.client.contactPerson}</p>
            )}
            <p className="font-normal text-black">{invoice.client.businessName}</p>
            {invoice.client.phone && (
              <p className="font-normal text-black">{invoice.client.phone}</p>
            )}
            {invoice.client.email && (
              <p className="font-normal text-black">{invoice.client.email}</p>
            )}
          </div>

          <div className="flex sm:justify-end items-start gap-3">
            <span className="font-medium text-black">Issued Date</span>
            <span className="text-black">:</span>
            <span className="font-medium text-black">{formatInvoiceDate(invoice.issueDate)}</span>
          </div>
        </div>

        {/* Main Table: DESCRIPTION & PRICE */}
        <div className="mt-8">
          <div className="flex justify-between items-center pb-2.5 border-b-[1.5px] border-black text-xs font-bold uppercase tracking-wider text-black">
            <span>DESCRIPTION</span>
            <span>PRICE</span>
          </div>

          {/* Optional itemized rows if present */}
          {invoice.items && invoice.items.length > 0 && (
            <div className="divide-y divide-slate-100 border-b border-slate-200">
              {invoice.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-3 text-xs sm:text-sm text-black"
                >
                  <span className="font-normal">
                    {item.description}
                    {item.quantity > 1 && (
                      <span className="text-xs text-slate-500"> ({item.quantity}x)</span>
                    )}
                  </span>
                  <span className="font-medium">
                    PKR {Number(item.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Core breakdown matching invoice template: Total Amount, Amount Paid, Remaining Balance */}
          <div className="space-y-4 py-4 text-xs sm:text-sm text-black">
            <div className="flex justify-between items-center">
              <span className="font-normal">Total Amount</span>
              <span className="font-medium">
                PKR {Number(invoice.totalAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-normal">Amount Paid</span>
              <span className="font-medium">
                PKR{" "}
                {invoice.paidAmount > 0
                  ? Number(invoice.paidAmount).toLocaleString()
                  : "00,000"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-normal">Remaining Balance</span>
              <span className="font-medium">
                PKR{" "}
                {balanceDue > 0
                  ? Number(balanceDue).toLocaleString()
                  : "00,000"}
              </span>
            </div>
          </div>

          {/* Divider Line before Total */}
          <div className="border-b-[1.5px] border-black my-6 sm:my-8" />

          {/* Right-aligned Total with underline */}
          <div className="flex justify-end">
            <div className="w-56 sm:w-72">
              <div className="flex justify-between items-center font-bold text-xs sm:text-sm text-black pb-2 border-b-[1.5px] border-black">
                <span>Total</span>
                <span>PKR {Number(invoice.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: TERMS & CONDITIONS + THANK YOU FOR CHOOSING VERTEXIA */}
        <div className="mt-14 sm:mt-20 space-y-8">
          <div className="space-y-1 max-w-md">
            <span className="font-bold text-xs uppercase tracking-wide text-black block">
              TERMS & CONDITIONS:
            </span>
            <p className="text-[11px] sm:text-xs text-black font-normal leading-relaxed">
              For our Terms, Conditions, and Service Policies, please visit our official Terms of Services page.
            </p>
            <a
              href="https://www.vertexiaagency.com/terms-of-services"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] sm:text-xs text-black underline font-medium block hover:opacity-80"
            >
              www.vertexiaagency.com/terms-of-services
            </a>
          </div>

          <div className="flex justify-end">
            <span className="font-bold text-xs sm:text-sm tracking-wider uppercase text-black">
              THANK YOU FOR CHOOSING VERTEXIA
            </span>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
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
