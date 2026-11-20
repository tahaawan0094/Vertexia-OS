"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
  KeyRound,
  FileCode2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatPKR } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    categoryId: "",
    status: "PLANNING",
    currentVersion: "1.0.0",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
        if (data.categories?.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      setIsModalOpen(false);
      setFormData({
        name: "",
        tagline: "",
        description: "",
        categoryId: categories[0]?.id || "",
        status: "PLANNING",
        currentVersion: "1.0.0",
      });
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Product Portfolio & Engineering Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vertexia proprietary business software solutions, POS products, and release versions.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading software catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:border-blue-300 transition-all group flex flex-col justify-between">
              <div>
                <CardHeader className="bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                      {product.productCode}
                    </span>
                    <CardTitle>{product.name}</CardTitle>
                  </div>
                  <StatusBadge status={product.status} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {product.tagline || product.description}
                  </p>

                  {/* Highlights */}
                  {product.features?.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Key Capabilities
                      </span>
                      <div className="space-y-1 text-xs text-slate-700">
                        {product.features.slice(0, 3).map((f: any) => (
                          <div key={f.id} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>{f.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing Overview */}
                  {product.pricingPlans?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Plans:
                      </span>
                      {product.pricingPlans.map((pl: any) => (
                        <span key={pl.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {pl.name} ({formatPKR(pl.price)})
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>Version: <strong className="font-mono text-slate-800">v{product.currentVersion}</strong></span>
                  <span>•</span>
                  <span>Installations: <strong className="text-purple-700">{product.installations?.length || 0}</strong></span>
                </div>

                <Link
                  href={`/products/${product.id}`}
                  className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Manage Product <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Software Product"
        description="Expand Vertexia's internal product catalog with a new software offering."
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product Name"
            required
            placeholder="e.g. Vertexia Salon POS"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Tagline"
            placeholder="One-line value proposition"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Development Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_DEVELOPMENT">In Development</option>
              <option value="TESTING">Testing</option>
              <option value="ACTIVE">Active (Commercially Available)</option>
              <option value="MAINTENANCE">Maintenance</option>
            </Select>
          </div>

          <Input
            label="Initial Version"
            value={formData.currentVersion}
            onChange={(e) => setFormData({ ...formData, currentVersion: e.target.value })}
          />

          <Textarea
            label="Product Description"
            placeholder="Architecture, target audience, technical capabilities..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
