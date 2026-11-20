"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Users, Building2, KeyRound, Receipt, FolderKanban, LifeBuoy, X } from "lucide-react";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "lead":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "client":
        return <Building2 className="w-4 h-4 text-emerald-500" />;
      case "installation":
        return <KeyRound className="w-4 h-4 text-purple-500" />;
      case "invoice":
        return <Receipt className="w-4 h-4 text-amber-500" />;
      case "project":
      case "task":
        return <FolderKanban className="w-4 h-4 text-indigo-500" />;
      case "ticket":
        return <LifeBuoy className="w-4 h-4 text-rose-500" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Search box */}
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 z-10 overflow-hidden flex flex-col">
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, clients, invoices, tickets, installations, code..."
            className="w-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {query.length < 2 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search across all Vertexia OS modules...
            </div>
          )}

          {query.length >= 2 && !isLoading && results.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for &quot;{query}&quot;.
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((res) => (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => handleSelect(res.url)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-slate-50 group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-slate-100 group-hover:bg-white group-hover:shadow-sm">
                      {getIcon(res.type)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                        {res.title}
                      </div>
                      <div className="text-[11px] text-slate-500">{res.subtitle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigate with mouse or click result</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
