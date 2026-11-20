"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  Building2,
  Package,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LifeBuoy,
  RefreshCw,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function InstallationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [installation, setInstallation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Renewal Modal
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewDays, setRenewDays] = useState(365);
  const [renewing, setRenewing] = useState(false);

  // Version Upgrade
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const fetchInstallation = async () => {
    try {
      const res = await fetch(`/api/installations/${id}`);
      if (!res.ok) {
        router.push("/installations");
        return;
      }
      const data = await res.json();
      setInstallation(data.installation);
      setNewVersion(data.installation.softwareVersion);
    } catch (err) {
      console.error("Failed to load installation details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInstallation();
  }, [id]);

  const handleRenewLicense = async () => {
    setRenewing(true);
    try {
      const res = await fetch(`/api/installations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renewDays }),
      });
      if (res.ok) {
        setRenewModalOpen(false);
        fetchInstallation();
      }
    } catch (err) {
      console.error("Failed to renew license:", err);
    } finally {
      setRenewing(false);
    }
  };

  const handleUpgradeVersion = async () => {
    setUpgrading(true);
    try {
      const res = await fetch(`/api/installations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ softwareVersion: newVersion }),
      });
      if (res.ok) {
        setUpgradeModalOpen(false);
        fetchInstallation();
      }
    } catch (err) {
      console.error("Failed to upgrade version:", err);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading installation records...</div>;
  }

  if (!installation) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/installations"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Back to Installations Directory
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {installation.installCode}
            </span>
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              {installation.client.businessName}
            </h1>
            <StatusBadge status={installation.status} />
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-2">
            <span>Product: <strong className="text-blue-600">{installation.product.name}</strong></span>
            <span>•</span>
            <span>Branch: <strong className="text-slate-800">{installation.branch?.name || "Main Branch"}</strong></span>
            <span>•</span>
            <span>Deployed on {formatDate(installation.installationDate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {installation.license?.type !== "LIFETIME" && (
            <Button size="sm" variant="outline" onClick={() => setRenewModalOpen(true)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Renew License</span>
            </Button>
          )}

          <Button size="sm" onClick={() => setUpgradeModalOpen(true)}>
            <span>Upgrade Version</span>
          </Button>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (1 span): License Certificate Details */}
        <div className="space-y-6">
          <Card className="border-purple-200 bg-purple-50/20">
            <CardHeader>
              <CardTitle className="text-purple-950 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-600" />
                License Certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Encrypted License Key
                </span>
                <code className="text-xs font-mono font-bold text-purple-900 bg-white p-2 rounded-md border border-purple-200 block mt-1 select-all">
                  {installation.license?.licenseKey || "No License"}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Type</span>
                  <strong className="text-slate-800">{installation.license?.type}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Status</span>
                  <StatusBadge status={installation.license?.status || "ACTIVE"} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Activated</span>
                  <span className="text-slate-700">{formatDate(installation.license?.activatedAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Expires</span>
                  <strong className="text-slate-900">
                    {installation.license?.expiresAt ? formatDate(installation.license.expiresAt) : "Perpetual"}
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-100 text-[11px] text-slate-500 leading-relaxed">
                * Note: Vertexia OS license records are administrative source-of-truth records for customer auditing.
              </div>
            </CardContent>
          </Card>

          {/* Client & Branch Card */}
          <Card>
            <CardHeader>
              <CardTitle>Client Entity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Business Name</span>
                <Link href={`/clients/${installation.client.id}`} className="font-bold text-blue-600 hover:underline">
                  {installation.client.businessName} →
                </Link>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">City</span>
                <span className="text-slate-800">{installation.client.city}</span>
              </div>
              {installation.technician && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assigned Technician</span>
                  <span className="text-slate-800 font-semibold">{installation.technician.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (2 spans): Event Timeline & Support */}
        <div className="md:col-span-2 space-y-6">
          {/* Deployed Version Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Installed Software Engine</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Software release running at client terminal.</p>
              </div>
              <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded">
                v{installation.softwareVersion}
              </span>
            </CardHeader>
            <CardContent>
              {installation.notes && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <strong>Technician Notes:</strong> {installation.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* License & Installation Events History */}
          <Card>
            <CardHeader>
              <CardTitle>Deployment & Renewal Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {installation.events?.length === 0 ? (
                <p className="text-xs text-slate-400">No events recorded.</p>
              ) : (
                <div className="space-y-3">
                  {installation.events.map((ev: any) => (
                    <div key={ev.id} className="p-3 rounded-lg border border-slate-200/80 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 mr-2 uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100">
                          {ev.eventType}
                        </span>
                        <span className="text-slate-700">{ev.description}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDateTime(ev.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Renew Modal */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Renew Software Subscription"
        description={`Extend the software license validity for ${installation.client.businessName}.`}
      >
        <div className="space-y-4">
          <Select
            label="Renewal Period"
            value={renewDays}
            onChange={(e) => setRenewDays(Number(e.target.value))}
          >
            <option value={30}>1 Month (30 Days)</option>
            <option value={90}>3 Months (90 Days)</option>
            <option value={180}>6 Months (180 Days)</option>
            <option value={365}>1 Year (365 Days)</option>
          </Select>

          <div className="text-[11px] text-slate-500">
            * An invoice can be generated from the Finance module to record the client renewal payment.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenewLicense} isLoading={renewing}>
              Confirm Extension
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upgrade Version Modal */}
      <Modal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Update Software Version"
        description="Record a patch or major version deployment at this client terminal."
      >
        <div className="space-y-4">
          <Input
            label="Software Version"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            placeholder="e.g. 2.4.1"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgradeVersion} isLoading={upgrading}>
              Save Version
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
