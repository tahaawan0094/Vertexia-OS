"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { formatPKR, formatDate, formatDateTime } from "@/lib/utils";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("communications");

  // Interaction Logging State
  const [commType, setCommType] = useState("CALL");
  const [commNote, setCommNote] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [loggingComm, setLoggingComm] = useState(false);

  // Conversion Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertBranchName, setConvertBranchName] = useState("Main Branch");
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`);
      if (!res.ok) {
        router.push("/crm/leads");
        return;
      }
      const data = await res.json();
      setLead(data.lead);
      setSources(data.sources || []);
      setEmployees(data.employees || []);
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to fetch lead:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commNote.trim()) return;
    setLoggingComm(true);

    try {
      const res = await fetch(`/api/crm/leads/${id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: commType,
          description: commNote,
          nextFollowUpDate: nextFollowUp || null,
        }),
      });

      if (res.ok) {
        setCommNote("");
        setNextFollowUp("");
        fetchLead();
      }
    } catch (err) {
      console.error("Failed to log communication:", err);
    } finally {
      setLoggingComm(false);
    }
  };

  const handleConvertLead = async () => {
    setConverting(true);
    setConvertError("");

    try {
      const res = await fetch("/api/crm/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: id,
          branchName: convertBranchName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to convert lead");
      }

      setIsConvertModalOpen(false);
      // Redirect directly to client workspace
      router.push(`/clients/${data.clientId}`);
    } catch (err: any) {
      setConvertError(err.message);
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading lead profile...</div>;
  }

  if (!lead) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb back */}
      <div>
        <Link
          href="/crm/leads"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Back to Leads Directory
        </Link>
      </div>

      {/* Lead Profile Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {lead.leadCode}
            </span>
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              {lead.businessName}
            </h1>
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-2">
            <span>Category: <strong className="text-slate-700">{lead.businessCategory || "General"}</strong></span>
            <span>•</span>
            <span>Product Interest: <strong className="text-blue-600">{lead.interestedProduct || "Software"}</strong></span>
            <span>•</span>
            <span>Source: <strong className="text-slate-700">{lead.source?.name || "Direct"}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lead.convertedClientId ? (
            <Link
              href={`/clients/${lead.convertedClientId}`}
              className="px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Converted to Client</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsConvertModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <UserCheck className="w-4 h-4" />
              <span>Convert to Customer</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 span): Lead Overview Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact & Lead Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Primary Contact
                </span>
                <span className="font-semibold text-slate-800 text-sm">
                  {lead.contactPerson || "Not specified"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Phone / WhatsApp
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1 text-blue-600 hover:underline font-mono"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {lead.phone || "No phone"}
                  </a>
                  {lead.whatsapp && (
                    <a
                      href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 font-mono"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {lead.email && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Email
                  </span>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {lead.email}
                  </a>
                </div>
              )}

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Location
                </span>
                <span className="text-slate-700 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {lead.address ? `${lead.address}, ` : ""}{lead.city || "Karachi"}, {lead.country || "Pakistan"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Estimated Opportunity Value
                </span>
                <span className="text-lg font-bold font-heading text-slate-900 block mt-0.5">
                  {formatPKR(lead.estimatedValue)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Assigned Team Member
                </span>
                <span className="text-slate-800 font-semibold block mt-0.5">
                  {lead.assignedTo?.name || "Unassigned"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                Created on {formatDate(lead.createdAt)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (2 spans): Interactive History, Follow-ups, Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5">
            <Tabs
              tabs={[
                { id: "communications", label: "Communications & Notes", count: lead.activities?.length || 0 },
                { id: "followups", label: "Scheduled Follow-ups", count: lead.followups?.length || 0 },
                { id: "deals", label: "Deals / Quotes", count: lead.deals?.length || 0 },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            {/* Tab: Communications */}
            {activeTab === "communications" && (
              <div className="mt-5 space-y-6">
                {/* Log Communication Form */}
                <form
                  onSubmit={handleLogInteraction}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 font-heading">
                      Log Sales Outreach / Discussion
                    </span>
                    <div className="flex items-center gap-1.5 text-xs">
                      {["CALL", "WHATSAPP", "DEMO", "MEETING", "NOTE"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCommType(t)}
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] transition-colors ${
                            commType === t
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder={`Enter key notes from this ${commType.toLowerCase()} with ${lead.businessName}...`}
                    value={commNote}
                    onChange={(e) => setCommNote(e.target.value)}
                    rows={2}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500 text-[11px]">Next Follow-up Date:</span>
                      <input
                        type="date"
                        value={nextFollowUp}
                        onChange={(e) => setNextFollowUp(e.target.value)}
                        className="text-xs py-1 px-2 rounded border border-slate-300 bg-white"
                      />
                    </div>

                    <Button type="submit" size="sm" isLoading={loggingComm}>
                      Save Interaction
                    </Button>
                  </div>
                </form>

                {/* Communication Activity Stream */}
                <div className="space-y-3">
                  {lead.activities?.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No communications recorded yet. Log the first call or meeting above.
                    </div>
                  ) : (
                    lead.activities.map((act: any) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-sm flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {act.event.replace(/_/g, " ")}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              by {act.userName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {act.description}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatDateTime(act.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Follow-ups */}
            {activeTab === "followups" && (
              <div className="mt-5 space-y-3">
                {lead.followups?.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No scheduled follow-ups found for this lead.
                  </div>
                ) : (
                  lead.followups.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-800">
                            {f.type} Follow-up
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              f.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {f.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{f.notes || "No notes"}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div className="font-semibold text-slate-800">
                          {formatDate(f.scheduledAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Deals */}
            {activeTab === "deals" && (
              <div className="mt-5 space-y-3">
                {lead.deals?.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active commercial deals linked to this lead yet.
                  </div>
                ) : (
                  lead.deals.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-800">
                          {d.dealCode} — {d.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Product: {d.product?.name || "Custom"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">
                          {formatPKR(d.amount)}
                        </div>
                        <StatusBadge status={d.stage} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert Lead to Customer Modal (Workflow A) */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Official Customer"
        description="Formalize this prospect into an active Vertexia client. All communication records and deal history will be preserved."
        maxWidth="md"
      >
        {convertError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{convertError}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs space-y-1.5">
            <div className="font-semibold text-blue-900">Customer Record Summary:</div>
            <div className="text-slate-700">Business: <strong>{lead.businessName}</strong></div>
            <div className="text-slate-700">Contact: <strong>{lead.contactPerson || "N/A"}</strong> ({lead.phone})</div>
            <div className="text-slate-700">City: <strong>{lead.city || "Karachi"}</strong></div>
          </div>

          <Input
            label="Initial Branch Name"
            value={convertBranchName}
            onChange={(e) => setConvertBranchName(e.target.value)}
            placeholder="e.g. Main Branch, Clifton Branch"
          />

          <div className="text-[11px] text-slate-500 leading-relaxed">
            * Note: Converting creates a verified Client entity and updates this lead stage to <strong>WON</strong>. In accordance with Vertexia financial safeguards, deals are NOT treated as collected revenue until formal invoices and receipts are issued.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConvertModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConvertLead}
              isLoading={converting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Conversion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
