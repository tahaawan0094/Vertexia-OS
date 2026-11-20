"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  KeyRound,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default function InstallationsPage() {
  const [installations, setInstallations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    branchId: "",
    productId: "",
    softwareVersion: "1.0.0",
    licenseType: "LIFETIME",
    technicianId: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (productFilter !== "ALL") q.append("productId", productFilter);
      if (statusFilter !== "ALL") q.append("status", statusFilter);

      const res = await fetch(`/api/installations?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInstallations(data.installations || []);
        setProducts(data.products || []);
        setClients(data.clients || []);
        setEmployees(data.employees || []);
        if (data.clients?.length > 0 && !formData.clientId) {
          setFormData((prev) => ({
            ...prev,
            clientId: data.clients[0].id,
            branchId: data.clients[0].branches?.[0]?.id || "",
          }));
        }
        if (data.products?.length > 0 && !formData.productId) {
          setFormData((prev) => ({
            ...prev,
            productId: data.products[0].id,
            softwareVersion: data.products[0].currentVersion || "1.0.0",
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load installations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, [productFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInstallations();
  };

  const handleCreateInstallation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register installation");

      setIsModalOpen(false);
      fetchInstallations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === formData.clientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-blue-600" />
            Software Installations & Licenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of software deployed across client branches with verifiable license credentials.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>Register Installation</span>
        </Button>
      </div>

      {/* Historical Audit Banner */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Operating Governance:</strong> Vertexia has 5 historical installations reported. All 5 are tracked against verified customer branches and authentic license keys rather than vanity totals.
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, client, license key..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="py-1 px-2 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading installations...</div>
          ) : installations.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Installations Recorded"
                description="Register deployed software installations for verified customers."
                actionLabel="Add Installation"
                onAction={() => setIsModalOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Install Code</th>
                    <th className="py-3 px-4">Client & Branch</th>
                    <th className="py-3 px-4">Product Software</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">License Key</th>
                    <th className="py-3 px-4">License Model</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {installations.map((ins) => (
                    <tr key={ins.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        <Link href={`/installations/${ins.id}`} className="hover:text-blue-600">
                          {ins.installCode}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/clients/${ins.client.id}`} className="font-semibold text-slate-900 hover:text-blue-600 block">
                          {ins.client.businessName}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          {ins.branch?.name || "Main Branch"} • {ins.client.city}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {ins.product.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        v{ins.softwareVersion}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-purple-700 font-semibold">
                        {ins.license?.licenseKey || "No License"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {ins.license?.type || "Standard"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {ins.license?.expiresAt ? formatDate(ins.license.expiresAt) : "Perpetual (Never)"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ins.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/installations/${ins.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View →
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

      {/* Add Installation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Software Installation"
        description="Deploy a software license to a client's physical branch."
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateInstallation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Client"
              value={formData.clientId}
              onChange={(e) => {
                const cId = e.target.value;
                const cl = clients.find((c) => c.id === cId);
                setFormData({
                  ...formData,
                  clientId: cId,
                  branchId: cl?.branches?.[0]?.id || "",
                });
              }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientCode} — {c.businessName}
                </option>
              ))}
            </Select>

            <Select
              label="Branch / Location"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            >
              {selectedClient?.branches?.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </Select>

            <Select
              label="Product Software"
              value={formData.productId}
              onChange={(e) => {
                const pId = e.target.value;
                const p = products.find((pr) => pr.id === pId);
                setFormData({
                  ...formData,
                  productId: pId,
                  softwareVersion: p?.currentVersion || "1.0.0",
                });
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Input
              label="Deployed Software Version"
              value={formData.softwareVersion}
              onChange={(e) => setFormData({ ...formData, softwareVersion: e.target.value })}
            />

            <Select
              label="License Model"
              value={formData.licenseType}
              onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
            >
              <option value="LIFETIME">Lifetime Perpetual</option>
              <option value="MONTHLY">Monthly SaaS</option>
              <option value="YEARLY">Yearly Subscription</option>
              <option value="TRIAL">14-Day Trial</option>
            </Select>

            <Select
              label="Assigned Technician"
              value={formData.technicianId}
              onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.jobTitle})
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Installation Notes"
            placeholder="Workstation OS version, thermal receipt printer model, database backup path..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Generate License & Deploy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
