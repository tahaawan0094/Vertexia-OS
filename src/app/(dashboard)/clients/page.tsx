"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  Receipt,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPKR, formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessCategory: "Pharmacy",
    contactPerson: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "Karachi",
    country: "Pakistan",
    branchName: "Main Branch",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (statusFilter !== "ALL") q.append("status", statusFilter);

      const res = await fetch(`/api/clients?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create client");

      setIsAddModalOpen(false);
      setFormData({
        businessName: "",
        businessCategory: "Pharmacy",
        contactPerson: "",
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
        city: "Karachi",
        country: "Pakistan",
        branchName: "Main Branch",
        notes: "",
      });
      fetchClients();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete client "${name}" and all associated installations, invoices, and tickets? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete client");
        return;
      }
      fetchClients();
    } catch (err: any) {
      alert("Error deleting client: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Client & Customer Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified business clients operating Vertexia software solutions.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Client</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, code, phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Clients</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading client directory...</div>
          ) : clients.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Clients Enrolled Yet"
                description="Convert won leads from CRM into formal customers, or create a direct client record."
                actionLabel="Create Client"
                onAction={() => setIsAddModalOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client Code</th>
                    <th className="py-3 px-4">Business Name</th>
                    <th className="py-3 px-4">Owner / Contact</th>
                    <th className="py-3 px-4">Category & City</th>
                    <th className="py-3 px-4">Installations</th>
                    <th className="py-3 px-4">Invoiced Total</th>
                    <th className="py-3 px-4">Cash Received</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        <Link href={`/clients/${client.id}`} className="hover:text-blue-600">
                          {client.clientCode}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/clients/${client.id}`} className="font-semibold text-slate-900 hover:text-blue-600 block">
                          {client.businessName}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          {client.branches?.length || 1} Branch(es)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div>{client.contactPerson}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{client.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{client.businessCategory || "Business"}</span>
                        <span className="block text-[10px] text-slate-400">{client.city}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-purple-700">
                        {client.installationCount} Active
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {formatPKR(client.totalInvoiced)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        {formatPKR(client.totalPaid)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-rose-600">
                        {formatPKR(client.balance)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(client.id, client.businessName)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title={`Delete ${client.businessName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/clients/${client.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Workspace →
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

      {/* Add Direct Client Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Client"
        description="Create an official customer profile for business engagements."
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateClient} className="space-y-4">
          <Input
            label="Business Name"
            required
            placeholder="e.g. Clifton Auto Care / Care Pharmacy"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person / Owner"
              required
              placeholder="Name of owner"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />

            <Select
              label="Business Category"
              value={formData.businessCategory}
              onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
            >
              <option value="Pharmacy">Pharmacy</option>
              <option value="Automotive Garage">Automotive Garage</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Retail Mini Mart">Retail Mini Mart</option>
              <option value="Other">Other Business</option>
            </Select>

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
              label="City"
              placeholder="Karachi"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />

            <Input
              label="Primary Branch Name"
              placeholder="Main Branch"
              value={formData.branchName}
              onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            placeholder="Physical business location in Karachi"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Textarea
            label="Internal Notes"
            placeholder="Account manager notes, payment terms agreed, etc."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Client
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
