"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default function SupportHelpdeskPage() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(
    searchParams.get("action") === "create"
  );
  const [formData, setFormData] = useState({
    clientId: searchParams.get("clientId") || "",
    productId: "",
    title: "",
    description: "",
    category: "TECHNICAL",
    priority: "MEDIUM",
    assignedToId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== "ALL") q.append("status", statusFilter);
      if (priorityFilter !== "ALL") q.append("priority", priorityFilter);

      const res = await fetch(`/api/support?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setClients(data.clients || []);
        setProducts(data.products || []);
        setUsers(data.users || []);
        if (data.clients?.length > 0 && !formData.clientId) {
          setFormData((prev) => ({ ...prev, clientId: data.clients[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          clientId: clients[0]?.id || "",
          productId: "",
          title: "",
          description: "",
          category: "TECHNICAL",
          priority: "MEDIUM",
          assignedToId: "",
        });
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete support ticket ${code}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/support/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete ticket");
        return;
      }
      fetchTickets();
    } catch (err: any) {
      alert("Error deleting ticket: " + err.message);
    }
  };

  const openTickets = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const criticalTickets = tickets.filter((t) => t.priority === "CRITICAL" && t.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-blue-600" />
            Customer Support & Maintenance Helpdesk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Resolve customer software bugs, training queries, and printer installation issues.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>New Support Ticket</span>
        </Button>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Open Tickets</span>
            <div className="text-xl font-bold font-heading text-slate-900 mt-1">{openTickets} Active</div>
          </div>
          <Clock className="w-8 h-8 text-blue-500/20" />
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-rose-500">Critical Priority</span>
            <div className="text-xl font-bold font-heading text-rose-600 mt-1">{criticalTickets} Urgent</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500/20" />
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Recorded</span>
            <div className="text-xl font-bold font-heading text-slate-900 mt-1">{tickets.length} Tickets</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_CLIENT">Waiting for Client</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1 px-2 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading support tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Support Tickets"
                description="When customer issues or printer/hardware questions arise, log them here for tracking."
                actionLabel="Create Ticket"
                onAction={() => setIsModalOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Client & Product</th>
                    <th className="py-3 px-4">Issue Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        <Link href={`/support/${t.id}`} className="hover:text-blue-600">
                          {t.ticketCode}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/clients/${t.client.id}`} className="font-semibold text-slate-900 hover:text-blue-600 block">
                          {t.client.businessName}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          {t.product?.name || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block line-clamp-1">
                          {t.title}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 uppercase text-[10px] font-semibold">
                        {t.category}
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.assignedTo?.name || "Unassigned"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(t.id, t.ticketCode)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title={`Delete ${t.ticketCode}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/support/${t.id}`}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Resolve →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Open Support Ticket"
        description="Log an issue reported by a customer for technical resolution."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Select
            label="Client"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientCode} — {c.businessName}
              </option>
            ))}
          </Select>

          <Input
            label="Issue Summary"
            required
            placeholder="e.g. Thermal printer cuts line halfway on sales receipts"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Related Product"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            >
              <option value="">General</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="BUG">Software Bug</option>
              <option value="TECHNICAL">Technical Issue</option>
              <option value="INSTALLATION">Installation / Setup</option>
              <option value="TRAINING">User Training</option>
              <option value="BILLING">Billing / Renewal</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>

            <Select
              label="Assign Technician"
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Problem Description & Error Details"
            placeholder="Workstation OS version, steps causing problem, exact error message..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Open Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
