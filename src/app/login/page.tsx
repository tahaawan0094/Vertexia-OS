"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("taha@vertexia.pk");
  const [password, setPassword] = useState("vertexia2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("vertexia2026!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Background visual accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-800/20 p-8">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl mb-4 shadow-lg shadow-blue-600/20">
            V
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
            VERTEXIA <span className="text-blue-600">OS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            One Platform. Complete Business Control.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vertexia.pk"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={loading}
          >
            <span>Access Vertexia OS</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Quick select for authorized team members */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Authorized Team Directory
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("taha@vertexia.pk")}
              className="p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors"
            >
              <div className="font-semibold text-xs text-slate-800">Taha Awan</div>
              <div className="text-[10px] text-blue-600 font-medium">Founder</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("ammar@vertexia.pk")}
              className="p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors"
            >
              <div className="font-semibold text-xs text-slate-800">M. Ammar</div>
              <div className="text-[10px] text-purple-600 font-medium">Co-founder</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("muzammil@vertexia.pk")}
              className="p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors"
            >
              <div className="font-semibold text-xs text-slate-800">Muzammil</div>
              <div className="text-[10px] text-emerald-600 font-medium">Designer</div>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Initial password: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">vertexia2026!</code>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Internal Operating System • Karachi HQ</span>
        </div>
      </div>
    </div>
  );
}
