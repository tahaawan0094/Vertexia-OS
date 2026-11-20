"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  FileText,
  User,
  Calendar,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("COMPANY");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const q = activeCategory !== "ALL" ? `?category=${activeCategory}` : "";
      const res = await fetch(`/api/knowledge${q}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        if (data.articles?.length > 0 && !selectedArticle) {
          setSelectedArticle(data.articles[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load knowledge articles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [activeCategory]);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content, tags }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setTitle("");
        setContent("");
        setTags("");
        fetchArticles();
      }
    } catch (err) {
      console.error("Failed to create article:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Internal Knowledge Base & SOPs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard operating procedures, sales scripts, software deployment guides, and company handbook.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>New SOP / Article</span>
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <Tabs
            tabs={[
              { id: "ALL", label: "All Documents" },
              { id: "COMPANY", label: "Company Handbook" },
              { id: "SALES", label: "Sales Scripts" },
              { id: "PRODUCTS", label: "Product Docs" },
              { id: "TECHNICAL", label: "Technical SOPs" },
              { id: "OPERATIONS", label: "Operations" },
            ]}
            activeTab={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        <CardContent className="p-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading documentation...</div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No documentation articles in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Article List */}
              <div className="space-y-2 border-r border-slate-100 pr-4">
                {articles.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                      selectedArticle?.id === art.id
                        ? "border-blue-500 bg-blue-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      {art.category}
                    </span>
                    <strong className="text-slate-900 block font-heading">{art.title}</strong>
                    <span className="text-[10px] text-slate-400 mt-1 block">By {art.author}</span>
                  </button>
                ))}
              </div>

              {/* Right Column (2 spans): Reader View */}
              <div className="md:col-span-2 space-y-4">
                {selectedArticle ? (
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-slate-100">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                        {selectedArticle.category}
                      </span>
                      <h2 className="text-xl font-bold font-heading text-slate-900 mt-2">
                        {selectedArticle.title}
                      </h2>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                        <span>Author: {selectedArticle.author}</span>
                        <span>•</span>
                        <span>Last updated: {formatDate(selectedArticle.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                      {selectedArticle.content}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Select an article on the left to read.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Knowledge Article"
        description="Share internal procedure, installation checklist, or sales guide."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateArticle} className="space-y-4">
          <Input
            label="Article Title"
            required
            placeholder="e.g. Pharmacy POS Receipt Printer Setup Guide"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="COMPANY">Company Handbook & Policies</option>
            <option value="SALES">Sales Scripts & Pitches</option>
            <option value="PRODUCTS">Product Documentation</option>
            <option value="TECHNICAL">Technical SOPs & Deployments</option>
            <option value="OPERATIONS">Operations</option>
          </Select>

          <Textarea
            label="Article Content (Markdown supported)"
            required
            rows={6}
            placeholder="Document steps, prerequisites, and instructions..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Publish Article
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
