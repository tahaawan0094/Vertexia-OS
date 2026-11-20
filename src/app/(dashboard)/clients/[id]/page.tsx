"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  KeyRound,
  Receipt,
  LifeBuoy,
  GitBranch,
  FileText,
  Activity,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  DollarSign,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatPKR, formatDate, formatDateTime } from "@/lib/utils";

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Add Branch Modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [addingBranch, setAddingBranch] = useState(false);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) {
        router.push("/clients");
        return;
      }
      const data = await res.json();
      setClient(data.client);
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load client profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    setAddingBranch(true);

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: branchName,
          address: branchAddress,
          phone: branchPhone,
          city: client?.city || "Karachi",
        }),
      });

      if (res.ok) {
        setIsBranchModalOpen(false);
        setBranchName("");
        setBranchAddress("");
        setBranchPhone("");
        fetchClient();
      }
    } catch (err) {
      console.error("Failed to add branch:", err);
    } finally {
      setAddingBranch(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${client.businessName}" and all associated installations, invoices, and tickets? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete client");
        return;
      }
      router.push("/clients");
    } catch (err: any) {
      alert("Error deleting client: " + err.message);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading client workspace...</div>;
  }

  if (!client) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/clients"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Back to Clients Directory
        </Link>
      </div>

      {/* Client Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {client.clientCode}
            </span>
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              {client.businessName}
            </h1>
            <StatusBadge status={client.status} />
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-2">
            <span>Contact: <strong className="text-slate-800">{client.contactPerson}</strong></span>
            <span>•</span>
            <span className="font-mono text-slate-700">{client.phone}</span>
            <span>•</span>
            <span>{client.city}, {client.country}</span>
            <span>•</span>
            <span>Enrolled {formatDate(client.registrationDate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Financial Snapshot Badges */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Invoiced</span>
              <span className="font-bold text-xs text-slate-900 font-mono">{formatPKR(client.totalInvoiced)}</span>
            </div>
            <div className="w-[1px] h-6 bg-slate-200" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Cash Received</span>
              <span className="font-bold text-xs text-emerald-700 font-mono">{formatPKR(client.totalPaid)}</span>
            </div>
            <div className="w-[1px] h-6 bg-slate-200" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-rose-500 block">Balance Due</span>
              <span className="font-bold text-xs text-rose-600 font-mono">{formatPKR(client.balanceDue)}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeleteClient}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete Client
          </Button>
        </div>
      </div>

      {/* 8-Tab Workspace Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <Tabs
          tabs={[
            { id: "overview", label: "1. Overview" },
            { id: "products", label: "2. Products", count: client.installations?.length || 0 },
            { id: "branches", label: "3. Branches", count: client.branches?.length || 0 },
            { id: "installations", label: "4. Installations", count: client.installations?.length || 0 },
            { id: "finance", label: "5. Finance & Invoices", count: client.invoices?.length || 0 },
            { id: "support", label: "6. Support Tickets", count: client.tickets?.length || 0 },
            { id: "activity", label: "7. Activity History", count: client.activities?.length || 0 },
            { id: "documents", label: "8. Documents" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-heading font-semibold text-sm text-slate-900">
                  Business Identity & Locations
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Category</span>
                    <strong className="text-slate-800">{client.businessCategory || "General"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary City</span>
                    <strong className="text-slate-800">{client.city}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Address</span>
                    <span className="text-slate-800">{client.address || "No address entered"}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-heading font-semibold text-sm text-slate-900">
                  Communications & Direct Channels
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <div>Phone: <strong className="font-mono">{client.phone}</strong></div>
                  <div>WhatsApp: <strong className="font-mono">{client.whatsapp || client.phone}</strong></div>
                  <div>Email: <strong className="text-blue-600">{client.email || "No email"}</strong></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-heading font-semibold text-sm text-slate-900">
                  Active Software Engagements
                </h4>
                {client.installations?.length === 0 ? (
                  <p className="text-slate-500">
                    No active software installations registered for this client yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {client.installations.map((ins: any) => (
                      <div key={ins.id} className="p-2.5 rounded bg-white border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">{ins.product.name}</strong>
                          <div className="text-[11px] text-slate-500 font-mono">v{ins.softwareVersion} • {ins.installCode}</div>
                        </div>
                        <StatusBadge status={ins.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {client.notes && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="font-heading font-semibold text-xs text-slate-900 mb-1">
                    Internal Client Notes
                  </h4>
                  <p className="text-slate-600 leading-relaxed">{client.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Products */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-sm text-slate-900">
              Purchased Software Solutions
            </h4>
            {client.installations?.length === 0 ? (
              <p className="text-xs text-slate-400">No software purchased or installed yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.installations.map((ins: any) => (
                  <div key={ins.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-heading font-bold text-sm text-slate-900">{ins.product.name}</h5>
                      <StatusBadge status={ins.status} />
                    </div>
                    <p className="text-xs text-slate-600">{ins.product.tagline}</p>
                    <div className="pt-2 border-t border-slate-200 text-xs flex justify-between items-center text-slate-500">
                      <span>License: {ins.license?.type || "Standard"}</span>
                      <Link href={`/installations/${ins.id}`} className="text-blue-600 font-semibold hover:underline">
                        Installation Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Branches */}
        {activeTab === "branches" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-semibold text-sm text-slate-900">
                  Customer Branches & Outlets
                </h4>
                <p className="text-xs text-slate-500">Manage multiple business locations for this customer.</p>
              </div>
              <Button size="sm" onClick={() => setIsBranchModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Branch</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {client.branches?.map((br: any) => (
                <div key={br.id} className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-semibold text-sm text-slate-900">{br.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {br.code || "Branch"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Address: {br.address || "Main Address"}</div>
                    <div>City: {br.city}</div>
                    {br.phone && <div className="font-mono">Phone: {br.phone}</div>}
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-purple-700 font-medium">
                    Installations: {br.installations?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Installations */}
        {activeTab === "installations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-semibold text-sm text-slate-900">
                  Software Installations & Licenses
                </h4>
                <p className="text-xs text-slate-500">Physical and remote deployment records.</p>
              </div>
              <Link
                href={`/installations?clientId=${client.id}`}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Go to Installation Center <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {client.installations?.length === 0 ? (
              <p className="text-xs text-slate-400">No installations deployed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Install Code</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3">Version</th>
                      <th className="py-2.5 px-3">License Key</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {client.installations.map((ins: any) => (
                      <tr key={ins.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{ins.installCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{ins.product.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ins.branch?.name || "Main"}</td>
                        <td className="py-2.5 px-3 font-mono">{ins.softwareVersion}</td>
                        <td className="py-2.5 px-3 font-mono text-purple-700">{ins.license?.licenseKey || "—"}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={ins.status} /></td>
                        <td className="py-2.5 px-3 text-right">
                          <Link href={`/installations/${ins.id}`} className="text-blue-600 font-semibold hover:underline">
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Finance & Invoices */}
        {activeTab === "finance" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-semibold text-sm text-slate-900">
                  Billing & Invoices
                </h4>
                <p className="text-xs text-slate-500">Commercial transactions and payment records.</p>
              </div>
              <Link
                href={`/finance/invoices?clientId=${client.id}&action=create`}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                + New Invoice
              </Link>
            </div>

            {client.invoices?.length === 0 ? (
              <p className="text-xs text-slate-400">No invoices issued for this client yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3">Issue Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Paid Amount</th>
                      <th className="py-2.5 px-3">Balance</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {client.invoices.map((inv: any) => {
                      const balance = Math.max(0, inv.totalAmount - inv.paidAmount);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatPKR(inv.totalAmount)}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">{formatPKR(inv.paidAmount)}</td>
                          <td className="py-2.5 px-3 font-bold text-rose-600">{formatPKR(balance)}</td>
                          <td className="py-2.5 px-3"><StatusBadge status={inv.status} /></td>
                          <td className="py-2.5 px-3 text-right">
                            <Link href={`/finance/invoices/${inv.id}`} className="text-blue-600 font-semibold hover:underline">
                              Invoice →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Support Tickets */}
        {activeTab === "support" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-semibold text-sm text-slate-900">
                  Customer Support Tickets
                </h4>
                <p className="text-xs text-slate-500">Reported issues and technician assignments.</p>
              </div>
              <Link
                href={`/support?clientId=${client.id}&action=create`}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                + Create Ticket
              </Link>
            </div>

            {client.tickets?.length === 0 ? (
              <p className="text-xs text-slate-400">No support tickets recorded for this client.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {client.tickets.map((t: any) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">{t.ticketCode}</span>
                        <span className="font-semibold text-slate-900">{t.title}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.product?.name || "General"} • Assigned: {t.assignedTo?.name || "Support Team"}
                      </div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Activity History */}
        {activeTab === "activity" && (
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm text-slate-900 mb-2">
              Client Activity Stream
            </h4>
            {client.activities?.length === 0 ? (
              <p className="text-xs text-slate-400">No client activities logged yet.</p>
            ) : (
              client.activities.map((act: any) => (
                <div key={act.id} className="p-3 rounded-lg border border-slate-200/80 bg-white flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase mr-2">
                      {act.event.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-800">{act.description}</span>
                    <div className="text-[10px] text-slate-400 mt-1">Logged by {act.userName}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDateTime(act.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 8: Documents */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-sm text-slate-900">
              Customer Files & Agreements
            </h4>
            <p className="text-xs text-slate-500">
              Contract agreements, signed proposals, hardware delivery receipts, and software license certificates.
            </p>
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Document Vault Ready</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload signed SLA agreements and hardware delivery receipts to link them directly to {client.businessName}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title="Add Customer Branch"
        description={`Register an outlet or sub-location for ${client.businessName}.`}
        maxWidth="md"
      >
        <form onSubmit={handleAddBranch} className="space-y-4">
          <Input
            label="Branch Name"
            required
            placeholder="e.g. DHA Phase 6 Outlet, Saddar Branch"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />

          <Input
            label="Branch Address"
            placeholder="Physical outlet address"
            value={branchAddress}
            onChange={(e) => setBranchAddress(e.target.value)}
          />

          <Input
            label="Branch Phone"
            placeholder="+92 300 0000000"
            value={branchPhone}
            onChange={(e) => setBranchPhone(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsBranchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addingBranch}>
              Save Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
