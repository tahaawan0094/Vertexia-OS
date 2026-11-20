"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Database,
  Globe,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [setting, setSetting] = useState<any>({
    companyName: "Vertexia",
    tagline: "One Platform. Complete Business Control.",
    website: "https://vertexia.pk",
    email: "contact@vertexia.pk",
    phone: "+92 300 0000000",
    address: "Karachi, Sindh, Pakistan",
    city: "Karachi",
    country: "Pakistan",
    currency: "PKR",
    timezone: "Asia/Karachi",
    dateFormat: "DD/MM/YYYY",
    invoicePrefix: "VTX-INV",
  });
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.setting) setSetting(data.setting);
        setLeadSources(data.leadSources || []);
        setExpenseCategories(data.expenseCategories || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            System & Business Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Company profile, currency, invoice numbering, lead sources, and security parameters.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration saved successfully and updated across the system.</span>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-slate-100">
          <Tabs
            tabs={[
              { id: "company", label: "Company Information" },
              { id: "finance", label: "Finance & Invoicing" },
              { id: "crm", label: "CRM Sources" },
              { id: "security", label: "Security & Database" },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <CardContent className="p-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading settings...</div>
          ) : activeTab === "company" ? (
            <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  required
                  value={setting.companyName}
                  onChange={(e) => setSetting({ ...setting, companyName: e.target.value })}
                />
                <Input
                  label="Tagline"
                  value={setting.tagline}
                  onChange={(e) => setSetting({ ...setting, tagline: e.target.value })}
                />
                <Input
                  label="Website URL"
                  value={setting.website}
                  onChange={(e) => setSetting({ ...setting, website: e.target.value })}
                />
                <Input
                  label="Official Email"
                  type="email"
                  value={setting.email}
                  onChange={(e) => setSetting({ ...setting, email: e.target.value })}
                />
                <Input
                  label="Company Phone"
                  value={setting.phone}
                  onChange={(e) => setSetting({ ...setting, phone: e.target.value })}
                />
                <Input
                  label="City & Country"
                  value={setting.city}
                  onChange={(e) => setSetting({ ...setting, city: e.target.value })}
                />
              </div>

              <Input
                label="Registered Business Address"
                value={setting.address}
                onChange={(e) => setSetting({ ...setting, address: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Operating Timezone"
                  value={setting.timezone}
                  onChange={(e) => setSetting({ ...setting, timezone: e.target.value })}
                >
                  <option value="Asia/Karachi">Asia/Karachi (GMT+5:00 Pakistan)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4:00 UAE)</option>
                  <option value="UTC">UTC (Universal)</option>
                </Select>

                <Select
                  label="Default Currency"
                  value={setting.currency}
                  onChange={(e) => setSetting({ ...setting, currency: e.target.value })}
                >
                  <option value="PKR">Pakistani Rupee (PKR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="SAR">Saudi Riyal (SAR)</option>
                </Select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button type="submit" isLoading={saving}>
                  Save Company Settings
                </Button>
              </div>
            </form>
          ) : activeTab === "finance" ? (
            <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
              <Input
                label="Invoice Numbering Prefix"
                value={setting.invoicePrefix}
                onChange={(e) => setSetting({ ...setting, invoicePrefix: e.target.value })}
                helperText="Example: VTX-INV results in VTX-INV-2026-001"
              />

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-800 font-heading block">
                  Configured Expense Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.map((cat) => (
                    <span key={cat.id} className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button type="submit" isLoading={saving}>
                  Save Financial Configuration
                </Button>
              </div>
            </form>
          ) : activeTab === "crm" ? (
            <div className="space-y-4 max-w-2xl">
              <span className="text-xs font-semibold text-slate-800 font-heading block">
                Active Lead Discovery Sources
              </span>
              <p className="text-xs text-slate-500">
                Sources tracked in CRM and Sales analytics reports.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {leadSources.map((s) => (
                  <div key={s.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <h4 className="font-heading font-semibold text-sm text-slate-900">
                    Database & Relational Storage
                  </h4>
                </div>
                <p className="text-slate-600">
                  Prisma ORM connected with full foreign key constraints, cascade safety rules, and transaction boundaries.
                </p>
                <div className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                  Engine: SQLite / PostgreSQL Relay • Provider: @prisma/client
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-heading font-semibold text-sm text-slate-900">
                    Session Security & Audit Shield
                  </h4>
                </div>
                <p className="text-slate-600">
                  Passwords hashed with bcrypt (salt rounds: 10). Tamper-evident audit logs record all sensitive actions.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
