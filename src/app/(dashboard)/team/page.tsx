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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

export default function TeamManagementPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data.employees || []);
        setRoles(data.roles || []);
        setDepartments(data.departments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
          <UserCog className="w-6 h-6 text-blue-600" />
          Team Directory & Role Permissions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Vertexia core team members, organizational departments, and server-side RBAC permissions.
        </p>
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
                    className={`p-4 rounded-xl border transition-all ${
                      isReserved
                        ? "border-dashed border-slate-300 bg-slate-50/70"
                        : "border-slate-200 bg-white shadow-sm hover:border-blue-300"
                    }`}
                  >
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

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isReserved
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {emp.status}
                      </span>
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
                    {dept._count.employees} Active Member(s)
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
