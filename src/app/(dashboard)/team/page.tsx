"use client";

import React, { useState, useEffect } from "react";
import {
  UserCog,
  ShieldCheck,
  Building,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Lock,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";

export default function TeamManagementPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Form states
  const [form, setForm] = useState({
    name: "",
    jobTitle: "",
    departmentId: "",
    email: "",
    phone: "",
    status: "ACTIVE",
    notes: "",
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTeamData = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setRoles(data.roles || []);
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Failed to fetch team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleOpenAdd = () => {
    setForm({
      name: "",
      jobTitle: "",
      departmentId: departments[0]?.id || "",
      email: "",
      phone: "",
      status: "ACTIVE",
      notes: "",
    });
    setFormError("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setSelectedEmployee(emp);
    setForm({
      name: emp.name,
      jobTitle: emp.jobTitle,
      departmentId: emp.departmentId || "",
      email: emp.email,
      phone: emp.phone || "",
      status: emp.status || "ACTIVE",
      notes: emp.notes || "",
    });
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add team member");

      setIsAddModalOpen(false);
      fetchTeamData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/team/${selectedEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update team member");

      setIsEditModalOpen(false);
      fetchTeamData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (emp: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete team member "${emp.name}" (${emp.jobTitle})? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/team/${emp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete team member");
        return;
      }
      fetchTeamData();
    } catch (err: any) {
      alert("Error deleting team member: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            Team Directory & Role Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vertexia core team members, organizational departments, and server-side RBAC permissions.
          </p>
        </div>

        {activeTab === "members" && (
          <Button size="sm" onClick={handleOpenAdd}>
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            <span>Add Team Member</span>
          </Button>
        )}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <Tabs
            tabs={[
              { id: "members", label: "Team Members", count: employees.length },
              { id: "roles", label: "Role Permission Matrix", count: roles.length },
              { id: "departments", label: "Departments", count: departments.length },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <CardContent className="p-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading team directory...</div>
          ) : activeTab === "members" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp) => {
                const isReserved = emp.status === "RESERVED";
                return (
                  <div
                    key={emp.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isReserved
                        ? "border-dashed border-slate-300 bg-slate-50/70"
                        : "border-slate-200 bg-white shadow-sm hover:border-blue-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isReserved
                                ? "bg-slate-200 text-slate-500"
                                : "bg-blue-600 text-white shadow-sm"
                            }`}
                          >
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-heading font-bold text-sm text-slate-900">
                              {emp.name}
                            </h4>
                            <span className="text-xs text-blue-600 font-semibold">
                              {emp.jobTitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isReserved
                                ? "bg-amber-100 text-amber-800"
                                : emp.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {emp.status}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Team Member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {emp.email !== "taha@vertexia.pk" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Team Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Employee Code:</span>
                          <span className="font-mono font-bold text-slate-800">{emp.employeeCode}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Department:</span>
                          <span className="font-medium text-slate-700">{emp.department?.name || "General"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-mono text-slate-700">{emp.email}</span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Direct Phone:</span>
                            <span className="font-mono text-slate-700">{emp.phone}</span>
                          </div>
                        )}
                      </div>

                      {emp.notes && (
                        <div className="mt-3 p-2 rounded bg-slate-50 text-[11px] text-slate-500 border border-slate-100">
                          {emp.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "roles" ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900">
                <strong>Backend Security Rule:</strong> Permissions are strictly verified server-side on Route Handlers and mutations. Hiding a button is not treated as security.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-600" />
                        <h4 className="font-heading font-bold text-sm text-slate-900">{role.name}</h4>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {role.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{role.description}</p>
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      Assigned Permissions: <strong className="text-slate-800">{role.permissions?.length || 0} granular privileges</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-slate-900">{dept.name}</h4>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {dept.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{dept.description}</p>
                  <div className="pt-2 text-xs text-blue-600 font-semibold">
                    {dept._count?.employees || 0} Active Member(s)
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Add Team Member */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
        description="Add a new employee or team member to Vertexia directory."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Bilal Ahmed"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            label="Job Title"
            required
            placeholder="e.g. Senior Frontend Developer"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">No Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Operational Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="LEAVE">LEAVE</option>
              <option value="TERMINATED">TERMINATED</option>
              <option value="RESERVED">RESERVED (Placeholder)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g. bilal@vertexia.pk"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              label="Phone Number (Optional)"
              placeholder="+92 300 1234567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <Textarea
            label="Role Notes / Responsibilities (Optional)"
            placeholder="Key operational responsibilities or background..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Team Member */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Team Member Profile"
        description="Update employee contact info, job title, department, or status."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateEmployee} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            label="Job Title"
            required
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">No Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Operational Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="LEAVE">LEAVE</option>
              <option value="TERMINATED">TERMINATED</option>
              <option value="RESERVED">RESERVED (Placeholder)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              label="Phone Number (Optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <Textarea
            label="Role Notes / Responsibilities (Optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
