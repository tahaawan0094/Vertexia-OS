"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserPlus,
  Users,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Lock,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  User,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

export default function UserRoleManagementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);

  // Filtering
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);

  // Selected User for Edit / Reset
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Forms
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    employeeId: "",
    isActive: true,
  });

  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    employeeId: "",
    isActive: true,
  });

  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Role Form
  const [roleForm, setRoleForm] = useState({
    name: "",
    code: "",
    description: "",
    permissionIds: [] as string[],
  });

  // Verify Admin Session on mount
  useEffect(() => {
    async function checkAuthAndLoad() {
      setLoading(true);
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        const meData = await meRes.json();
        setCurrentUser(meData.user);

        const rCode = (meData.user?.roleCode || "").toUpperCase();
        const rName = (meData.user?.role || "").toUpperCase();
        if (rCode !== "ADMIN" && rCode !== "FOUNDER" && rName !== "ADMIN" && rName !== "FOUNDER") {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        await Promise.all([fetchUsers(), fetchRoles()]);
      } catch (err) {
        console.error("Auth check failed:", err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoad();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setRoles(data.roles || []);
        setEmployees(data.employees || []);
        if (data.roles?.length > 0 && !userForm.roleId) {
          setUserForm((prev) => ({ ...prev, roleId: data.roles[0].id }));
        }
      } else if (res.status === 403) {
        setAccessDenied(true);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setAllPermissions(data.allPermissions || []);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  };

  // Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setIsAddUserModalOpen(false);
      setUserForm({
        name: "",
        email: "",
        password: "",
        roleId: roles[0]?.id || "",
        employeeId: "",
        isActive: true,
      });
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditUser = (u: any) => {
    setSelectedUser(u);
    setEditUserForm({
      name: u.name,
      email: u.email,
      password: "",
      roleId: u.role?.id || "",
      employeeId: u.employee?.id || "",
      isActive: u.isActive,
    });
    setFormError("");
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editUserForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      setIsEditUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (u: any) => {
    const action = u.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} account "${u.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || `Failed to ${action} user`);
        return;
      }
      fetchUsers();
    } catch (err: any) {
      alert(`Error updating user status: ${err.message}`);
    }
  };

  const handleOpenResetPassword = (u: any) => {
    setSelectedUser(u);
    setNewPassword("");
    setFormError("");
    setFormSuccess("");
    setIsResetPwdModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setFormSuccess(`Password successfully reset for ${selectedUser.email}. All existing sessions were invalidated.`);
      setTimeout(() => {
        setIsResetPwdModalOpen(false);
        setFormSuccess("");
      }, 1500);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account "${u.name}" (${u.email})? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete user");
        return;
      }
      fetchUsers();
    } catch (err: any) {
      alert("Error deleting user: " + err.message);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create role");

      setIsAddRoleModalOpen(false);
      setRoleForm({ name: "", code: "", description: "", permissionIds: [] });
      fetchRoles();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.name.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "ALL" || u.role?.id === roleFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  const activeUsersCount = users.filter((u) => u.isActive).length;
  const deactivatedUsersCount = users.filter((u) => !u.isActive).length;

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Verifying administrative security & permissions...</div>;
  }

  // Server-side / Client Access Control Protection
  if (accessDenied) {
    return (
      <div className="py-16 max-w-lg mx-auto">
        <Card className="border-rose-200 bg-rose-50/30 text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">
            Administrator Access Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This module contains confidential user credentials, role definitions, and access control policies. Only designated Vertexia Administrators or Founders have permission to view or manage user accounts.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={() => window.location.href = "/"}>
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            User & Role Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise RBAC security: manage user accounts, assign roles, enforce server-side permissions, and monitor access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const me = users.find((u) => u.id === currentUser.id) || currentUser;
                handleOpenEditUser(me);
              }}
            >
              <KeyRound className="w-3.5 h-3.5 mr-1 text-slate-600" />
              <span>Change My Username / Pass</span>
            </Button>
          )}

          {activeTab === "users" ? (
            <Button size="sm" onClick={() => { setFormError(""); setIsAddUserModalOpen(true); }}>
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              <span>Create User Account</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => { setFormError(""); setIsAddRoleModalOpen(true); }}>
              <Shield className="w-3.5 h-3.5 mr-1" />
              <span>Create Custom Role</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Users</span>
          <div className="text-2xl font-bold font-heading text-slate-900 mt-1">{users.length}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Configured system logins</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Active Accounts</span>
          <div className="text-2xl font-bold font-heading text-emerald-700 mt-1">{activeUsersCount}</div>
          <span className="text-[10px] text-emerald-600/80 mt-1 block">Full login authorization</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Deactivated Accounts</span>
          <div className="text-2xl font-bold font-heading text-rose-700 mt-1">{deactivatedUsersCount}</div>
          <span className="text-[10px] text-rose-600/80 mt-1 block">Login access revoked</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Defined Roles</span>
          <div className="text-2xl font-bold font-heading text-blue-700 mt-1">{roles.length}</div>
          <span className="text-[10px] text-blue-600/80 mt-1 block">System & custom RBAC</span>
        </Card>
      </div>

      {/* Main Tabbed Container */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Tabs
            tabs={[
              { id: "users", label: "User Accounts", count: users.length },
              { id: "roles", label: "Roles & Permissions", count: roles.length },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "users" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium"
              >
                <option value="ALL">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Deactivated Only</option>
              </select>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Linked Employee</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No user accounts match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                              {u.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <span>{u.name}</span>
                              {u.id === currentUser?.id && (
                                <span className="ml-1.5 px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[9px] font-bold">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {u.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              u.role?.code === "FOUNDER" || u.role?.code === "ADMIN"
                                ? "bg-purple-100 text-purple-700"
                                : u.role?.code === "DEVELOPER"
                                ? "bg-blue-100 text-blue-700"
                                : u.role?.code === "SALES"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {u.role?.name || "No Role"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {u.employee ? (
                            <span>{u.employee.name} ({u.employee.jobTitle})</span>
                          ) : (
                            <span className="text-slate-400 italic">Direct User</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                              title="Edit User & Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenResetPassword(u)}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`p-1.5 rounded transition-colors ${
                                u.isActive
                                  ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                  : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={u.isActive ? "Deactivate Account" : "Activate Account"}
                            >
                              {u.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>

                            {u.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((r) => (
                  <Card key={r.id} className="p-4 border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {r.code}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">
                          {r._count?.users || 0} User(s)
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-sm text-slate-900 mt-2">
                        {r.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {r.description || "System operational role."}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Permissions: <strong className="text-slate-800">{r.permissions?.length || "All"}</strong></span>
                      {r.isSystem && (
                        <span className="text-[10px] uppercase font-bold text-slate-400">System Role</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create User */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Create User Account"
        description="Provision a new authenticated login for a Vertexia team member."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Asad Siddiqui"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. asad@vertexia.pk"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />

          <Input
            label="Initial Password"
            type="password"
            required
            placeholder="Minimum 8 characters"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
          />

          <Select
            label="Assign Role"
            value={userForm.roleId}
            onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code})
              </option>
            ))}
          </Select>

          <Select
            label="Link to Employee (Optional)"
            value={userForm.employeeId}
            onChange={(e) => setUserForm({ ...userForm, employeeId: e.target.value })}
          >
            <option value="">No Linked Employee Record</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.jobTitle}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={userForm.isActive}
              onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
              Account Active immediately upon creation
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        title="Edit User Account"
        description="Update user credentials, role assignments, or active status."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={editUserForm.name}
            onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
          />

          <Input
            label="Email Address (Login Username)"
            type="email"
            required
            value={editUserForm.email}
            onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
          />

          <Input
            label="Change Password (Optional)"
            type="password"
            placeholder="Leave blank to keep existing password"
            value={editUserForm.password}
            onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
            helperText="Enter a new password (min. 8 characters) to update credentials."
          />

          <Select
            label="Assigned Role"
            value={editUserForm.roleId}
            onChange={(e) => setEditUserForm({ ...editUserForm, roleId: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code})
              </option>
            ))}
          </Select>

          <Select
            label="Linked Employee"
            value={editUserForm.employeeId}
            onChange={(e) => setEditUserForm({ ...editUserForm, employeeId: e.target.value })}
          >
            <option value="">No Linked Employee Record</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.jobTitle}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="editIsActiveCheck"
              checked={editUserForm.isActive}
              onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="editIsActiveCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
              Account Active (Uncheck to revoke access)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal
        isOpen={isResetPwdModalOpen}
        onClose={() => setIsResetPwdModalOpen(false)}
        title="Admin Password Reset"
        description={`Set a new secure password for ${selectedUser?.name} (${selectedUser?.email}).`}
        maxWidth="sm"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <p className="text-[11px] text-slate-500 leading-normal">
            For security, resetting a user password will instantly terminate all their active sessions across all devices.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsResetPwdModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Role */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title="Create Custom Role"
        description="Define a new role with specific permissions."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateRole} className="space-y-4">
          <Input
            label="Role Name"
            required
            placeholder="e.g. Senior Support Lead"
            value={roleForm.name}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
          />

          <Input
            label="Role Code (Unique Identifier)"
            required
            placeholder="e.g. SUPPORT_LEAD"
            value={roleForm.code}
            onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
          />

          <Textarea
            label="Description"
            placeholder="Summary of responsibilities and permissions..."
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
