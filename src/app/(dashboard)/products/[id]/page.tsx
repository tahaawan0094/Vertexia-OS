"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Layers,
  Sparkles,
  Tag,
  KeyRound,
  FileCode2,
  LifeBuoy,
  BookOpen,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  AlertCircle,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { formatPKR, formatDate } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Sub-entity creation modals
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDesc, setFeatureDesc] = useState("");

  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState("LIFETIME");
  const [planPrice, setPlanPrice] = useState(65000);
  const [billingCycle, setBillingCycle] = useState("ONE_TIME");

  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [verNumber, setVerNumber] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        router.push("/products");
        return;
      }
      const data = await res.json();
      setProduct(data.product);
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim()) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_FEATURE",
          data: { title: featureTitle, description: featureDesc, isHighlight: true },
        }),
      });
      if (res.ok) {
        setFeatureModalOpen(false);
        setFeatureTitle("");
        setFeatureDesc("");
        fetchProduct();
      }
    } catch (err) {
      console.error("Failed to add feature:", err);
    }
  };

  const handleAddPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PRICING",
          data: {
            name: planName,
            licenseType: planType,
            price: Number(planPrice),
            billingCycle,
          },
        }),
      });
      if (res.ok) {
        setPricingModalOpen(false);
        setPlanName("");
        fetchProduct();
      }
    } catch (err) {
      console.error("Failed to add pricing plan:", err);
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verNumber.trim()) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_VERSION",
          data: { versionNumber: verNumber, releaseNotes },
        }),
      });
      if (res.ok) {
        setVersionModalOpen(false);
        setVerNumber("");
        setReleaseNotes("");
        fetchProduct();
      }
    } catch (err) {
      console.error("Failed to add version:", err);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading product profile...</div>;
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/products"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Back to Product Portfolio
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {product.productCode}
            </span>
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              {product.name}
            </h1>
            <StatusBadge status={product.status} />
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            {product.tagline}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Version</span>
            <span className="font-bold text-slate-800 font-mono">v{product.currentVersion}</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-200" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Installations</span>
            <span className="font-bold text-purple-700">{product.installations?.length || 0} Deployed</span>
          </div>
        </div>
      </div>

      {/* 8-Tab Workspace Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <Tabs
          tabs={[
            { id: "overview", label: "1. Overview" },
            { id: "features", label: "2. Features", count: product.features?.length || 0 },
            { id: "pricing", label: "3. Pricing Plans", count: product.pricingPlans?.length || 0 },
            { id: "versions", label: "4. Versions & Releases", count: product.versions?.length || 0 },
            { id: "installations", label: "5. Installations", count: product.installations?.length || 0 },
            { id: "projects", label: "6. Projects", count: product.projects?.length || 0 },
            { id: "tickets", label: "7. Bug Reports & Tickets", count: product.tickets?.length || 0 },
            { id: "docs", label: "8. Documentation" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-heading font-semibold text-sm text-slate-900">
                Product Architecture & Description
              </h4>
              <p className="text-slate-700 leading-relaxed text-sm">
                {product.description || "No detailed description provided."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-heading font-semibold text-xs text-slate-800">Operational Status</h5>
                <div>Status: <StatusBadge status={product.status} /></div>
                <div>Category: <strong className="text-slate-800">{product.category?.name || "Uncategorized"}</strong></div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-heading font-semibold text-xs text-slate-800">Commercial Metric</h5>
                <div>Registered Installations: <strong className="text-purple-700">{product.installations?.length || 0}</strong></div>
                <div>Configured Pricing Tiers: <strong className="text-slate-800">{product.pricingPlans?.length || 0}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Features */}
        {activeTab === "features" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-semibold text-sm text-slate-900">Feature Specifications</h4>
                <p className="text-xs text-slate-500">Core software capabilities included in releases.</p>
              </div>
              <Button size="sm" onClick={() => setFeatureModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Feature</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.features?.map((f: any) => (
                <div key={f.id} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-heading font-semibold text-xs text-slate-900">{f.title}</span>
                  </div>
                  {f.description && <p className="text-xs text-slate-600 pl-6">{f.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Pricing */}
        {activeTab === "pricing" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-semibold text-sm text-slate-900">Pricing Models</h4>
                <p className="text-xs text-slate-500">Configured license tiers and recurring pricing for sales deals.</p>
              </div>
              <Button size="sm" onClick={() => setPricingModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pricing Plan</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {product.pricingPlans?.map((plan: any) => (
                <div key={plan.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {plan.licenseType}
                  </span>
                  <h5 className="font-heading font-bold text-sm text-slate-900">{plan.name}</h5>
                  <div className="text-xl font-bold font-heading text-slate-900">
                    {formatPKR(plan.price)}
                    <span className="text-xs font-normal text-slate-500"> / {plan.billingCycle.toLowerCase()}</span>
                  </div>
                  {plan.description && <p className="text-xs text-slate-500">{plan.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Versions & Releases */}
        {activeTab === "versions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-semibold text-sm text-slate-900">Release Changelog</h4>
                <p className="text-xs text-slate-500">Version tags, build history, and deployed patch notes.</p>
              </div>
              <Button size="sm" onClick={() => setVersionModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Release Tag</span>
              </Button>
            </div>

            <div className="space-y-3">
              {product.versions?.map((ver: any) => (
                <div key={ver.id} className="p-4 rounded-lg border border-slate-200 bg-white flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">v{ver.versionNumber}</span>
                      <StatusBadge status={ver.status} />
                    </div>
                    <p className="text-xs text-slate-600">{ver.releaseNotes || "Maintenance patch release."}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatDate(ver.releaseDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Installations */}
        {activeTab === "installations" && (
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-sm text-slate-900">
              Active Client Deployments ({product.installations?.length || 0})
            </h4>
            {product.installations?.length === 0 ? (
              <p className="text-xs text-slate-400">No active installations registered for this software yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {product.installations.map((ins: any) => (
                  <div key={ins.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-800">{ins.client.businessName}</strong>
                      <div className="text-[11px] text-slate-500 font-mono">Code: {ins.client.clientCode}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={ins.status} />
                      <Link href={`/installations/${ins.id}`} className="text-blue-600 font-semibold hover:underline">
                        Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Projects */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-sm text-slate-900">
              Related Engineering Projects
            </h4>
            {product.projects?.length === 0 ? (
              <p className="text-xs text-slate-400">No development projects linked to this product.</p>
            ) : (
              <div className="space-y-2">
                {product.projects.map((prj: any) => (
                  <div key={prj.id} className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900">{prj.name}</strong>
                      <div className="text-[11px] text-slate-500">{prj.description}</div>
                    </div>
                    <StatusBadge status={prj.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Bug Reports & Tickets */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-sm text-slate-900">
              Reported Software Issues & Bug Tickets
            </h4>
            {product.tickets?.length === 0 ? (
              <p className="text-xs text-slate-400">No open bugs or tickets reported for this product.</p>
            ) : (
              <div className="space-y-2">
                {product.tickets.map((t: any) => (
                  <div key={t.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-700 mr-2">{t.ticketCode}</span>
                      <strong className="text-slate-800">{t.title}</strong>
                      <div className="text-[11px] text-slate-500">Client: {t.client?.businessName}</div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Documentation */}
        {activeTab === "docs" && (
          <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto" />
            <h4 className="font-heading font-semibold text-sm text-slate-900">
              Technical Documentation & Installation Manuals
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hardware prerequisites, database connection strings, barcode printer configuration, and API sync endpoints.
            </p>
            <div className="pt-2">
              <Link href="/knowledge-base" className="text-xs font-semibold text-blue-600 hover:underline">
                Explore Knowledge Base SOPs →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Feature Modal */}
      <Modal
        isOpen={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
        title="Add Product Feature"
        description={`Add a capability to ${product.name}`}
      >
        <form onSubmit={handleAddFeature} className="space-y-4">
          <Input
            label="Feature Title"
            required
            placeholder="e.g. FIFO Batch Tracking"
            value={featureTitle}
            onChange={(e) => setFeatureTitle(e.target.value)}
          />
          <Textarea
            label="Feature Description"
            placeholder="Technical details and user benefit..."
            value={featureDesc}
            onChange={(e) => setFeatureDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setFeatureModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Feature</Button>
          </div>
        </form>
      </Modal>

      {/* Pricing Modal */}
      <Modal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        title="Add Pricing Plan"
        description={`Define a commercial price tier for ${product.name}`}
      >
        <form onSubmit={handleAddPricing} className="space-y-4">
          <Input
            label="Plan Name"
            required
            placeholder="e.g. Standard Lifetime License"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="License Model"
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
            >
              <option value="LIFETIME">Lifetime Perpetual</option>
              <option value="MONTHLY">Monthly SaaS</option>
              <option value="YEARLY">Yearly Subscription</option>
              <option value="TRIAL">Trial</option>
              <option value="CUSTOM">Custom</option>
            </Select>
            <Input
              label="Price (PKR)"
              type="number"
              value={planPrice}
              onChange={(e) => setPlanPrice(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPricingModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Pricing</Button>
          </div>
        </form>
      </Modal>

      {/* Version Modal */}
      <Modal
        isOpen={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        title="Add Software Release Tag"
        description="Record a new stable or beta release version."
      >
        <form onSubmit={handleAddVersion} className="space-y-4">
          <Input
            label="Version Number"
            required
            placeholder="e.g. 2.5.0"
            value={verNumber}
            onChange={(e) => setVerNumber(e.target.value)}
          />
          <Textarea
            label="Release Notes"
            placeholder="Bug fixes, added features, database migration notes..."
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setVersionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Publish Tag</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
