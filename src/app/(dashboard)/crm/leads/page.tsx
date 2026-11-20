"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  LayoutList,
  Kanban,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPKR, formatDate } from "@/lib/utils";

const PIPELINE_STAGES = [
  { id: "NEW", label: "New Lead", color: "border-blue-500 bg-blue-50/20" },
  { id: "CONTACTED", label: "Contacted", color: "border-cyan-500 bg-cyan-50/20" },
  { id: "INTERESTED", label: "Interested", color: "border-indigo-500 bg-indigo-50/20" },
  { id: "DEMO_SCHEDULED", label: "Demo Scheduled", color: "border-purple-500 bg-purple-50/20" },
  { id: "DEMO_COMPLETED", label: "Demo Completed", color: "border-violet-500 bg-violet-50/20" },
  { id: "NEGOTIATION", label: "Negotiation", color: "border-amber-500 bg-amber-50/20" },
  { id: "WON", label: "Won Deals", color: "border-emerald-500 bg-emerald-50/20" },
  { id: "LOST", label: "Lost Deals", color: "border-rose-400 bg-rose-50/20" },
];

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(
    searchParams.get("action") === "create"
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Lead Form Data
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    address: "",
    city: "Karachi",
    businessCategory: "Pharmacy",
    interestedProduct: "Vertexia Pharmacy POS",
    sourceId: "",
    assignedToId: "",
    status: "NEW",
    priority: "MEDIUM",
    estimatedValue: 65000,
    notes: "",
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (statusFilter !== "ALL") q.append("status", statusFilter);
      if (sourceFilter !== "ALL") q.append("sourceId", sourceFilter);

      const res = await fetch(`/api/crm/leads?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setSources(data.sources || []);
        setEmployees(data.employees || []);
        if (data.sources?.length > 0 && !formData.sourceId) {
          setFormData((prev) => ({ ...prev, sourceId: data.sources[0].id }));
        }
        if (data.employees?.length > 0 && !formData.assignedToId) {
          setFormData((prev) => ({ ...prev, assignedToId: data.employees[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      setIsAddModalOpen(false);
      setFormData({
        businessName: "",
        contactPerson: "",
        phone: "",
        whatsapp: "",
        email: "",
        website: "",
        address: "",
        city: "Karachi",
        businessCategory: "Pharmacy",
        interestedProduct: "Vertexia Pharmacy POS",
        sourceId: sources[0]?.id || "",
        assignedToId: employees[0]?.id || "",
        status: "NEW",
        priority: "MEDIUM",
        estimatedValue: 65000,
        notes: "",
      });
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick stage update for Kanban drag-and-drop or status buttons
  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStage }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStage } : l))
        );
      }
    } catch (err) {
      console.error("Failed to change stage:", err);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = [
      "Lead Code",
      "Business Name",
      "Category",
      "Product Interest",
      "Contact Person",
      "Phone",
      "Email",
      "City",
      "Source",
      "Status",
      "Priority",
      "Estimated Value (PKR)",
      "Created At",
    ];

    const rows = leads.map((l) => [
      l.leadCode,
      `"${l.businessName.replace(/"/g, '""')}"`,
      l.businessCategory || "",
      l.interestedProduct || "",
      `"${(l.contactPerson || "").replace(/"/g, '""')}"`,
      l.phone || "",
      l.email || "",
      l.city || "Karachi",
      l.source?.name || "",
      l.status,
      l.priority,
      l.estimatedValue,
      new Date(l.createdAt).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vertexia_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            CRM & Lead Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture, nurture, and convert software sales prospects into Vertexia clients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={leads.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Stages</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="py-1 px-2 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Sources</option>
              {sources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content: Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Loading sales leads from database...
              </div>
            ) : leads.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Leads Found"
                  description="Start by adding prospective pharmacies, auto garages, or retailers looking for software."
                  actionLabel="Create First Lead"
                  onAction={() => setIsAddModalOpen(true)}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Business & Contact</th>
                      <th className="py-3 px-4">Product Interest</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Est. Value</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Next Follow-up</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          <Link href={`/crm/leads/${lead.id}`} className="hover:text-blue-600">
                            {lead.leadCode}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/crm/leads/${lead.id}`} className="font-semibold text-slate-900 hover:text-blue-600 block">
                            {lead.businessName}
                          </Link>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{lead.contactPerson || "No contact name"}</span>
                            {lead.phone && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{lead.phone}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">
                            {lead.interestedProduct || "Software Inquiry"}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {lead.businessCategory || "Retail"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={lead.priority} />
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {formatPKR(lead.estimatedValue)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {lead.source?.name || "Direct"}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatDate(lead.nextFollowUpAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/crm/leads/${lead.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content: Kanban Pipeline View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto pb-6">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.id);
            const totalStageValue = stageLeads.reduce(
              (acc, curr) => acc + (curr.estimatedValue || 0),
              0
            );

            return (
              <div
                key={stage.id}
                className="bg-slate-100/70 rounded-xl border border-slate-200/90 flex flex-col min-w-[260px]"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b border-slate-200 border-t-4 rounded-t-xl bg-white ${stage.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-slate-800">
                      {stage.label}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">
                    {formatPKR(totalStageValue)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 flex-1 min-h-[350px]">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            {lead.leadCode}
                          </span>
                          <PriorityBadge priority={lead.priority} />
                        </div>

                        <Link
                          href={`/crm/leads/${lead.id}`}
                          className="font-heading font-semibold text-xs text-slate-900 group-hover:text-blue-600 block line-clamp-1"
                        >
                          {lead.businessName}
                        </Link>

                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {lead.interestedProduct || "POS Solution"}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {formatPKR(lead.estimatedValue)}
                          </span>
                          <Link
                            href={`/crm/leads/${lead.id}`}
                            className="text-[11px] text-blue-600 font-semibold group-hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Sales Lead"
        description="Register a prospective business customer into Vertexia CRM pipeline."
        maxWidth="2xl"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              required
              placeholder="e.g. Al-Madina Pharmacy"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />

            <Input
              label="Contact Person"
              placeholder="Owner / Manager name"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />

            <Input
              label="Phone Number"
              required
              placeholder="+92 300 0000000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="WhatsApp Number"
              placeholder="+92 300 0000000"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="business@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="City"
              placeholder="Karachi"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />

            <Select
              label="Business Category"
              value={formData.businessCategory}
              onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
            >
              <option value="Pharmacy">Pharmacy / Chemist</option>
              <option value="Automotive Garage">Automotive Garage & Workshop</option>
              <option value="Restaurant">Restaurant / Cafe</option>
              <option value="Retail Mini Mart">Retail Mini Mart / Supermarket</option>
              <option value="Other">Other Business</option>
            </Select>

            <Select
              label="Interested Product"
              value={formData.interestedProduct}
              onChange={(e) => setFormData({ ...formData, interestedProduct: e.target.value })}
            >
              <option value="Vertexia Pharmacy POS">Vertexia Pharmacy POS</option>
              <option value="Vertexia Garage CRM">Vertexia Garage CRM</option>
              <option value="Vertexia Restaurant POS">Vertexia Restaurant POS</option>
              <option value="Vertexia Mini Mart POS">Vertexia Mini Mart POS</option>
            </Select>

            <Select
              label="Lead Source"
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
            >
              {sources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </Select>

            <Select
              label="Assigned Member"
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.jobTitle})
                </option>
              ))}
            </Select>

            <Select
              label="Initial Stage"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>

            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>

            <Input
              label="Estimated Deal Value (PKR)"
              type="number"
              value={formData.estimatedValue}
              onChange={(e) =>
                setFormData({ ...formData, estimatedValue: Number(e.target.value) })
              }
            />

            <Input
              label="Business Address"
              placeholder="Shop / Area address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <Textarea
            label="Initial Contact Notes"
            placeholder="Details about client needs, branch count, current system in place..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Lead
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
