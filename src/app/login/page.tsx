"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  HelpCircle,
  Shield,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // High-res curated tech & business architecture visuals for Vertexia
  const showcaseSlides = [
    {
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop",
      title: "Core Platform Architecture",
      subtitle: "Enterprise POS, CRM & Business Control",
    },
    {
      url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1600&auto=format&fit=crop",
      title: "Cloud Synchronized Operations",
      subtitle: "Multi-branch retail & real-time telemetry",
    },
  ];

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
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % showcaseSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + showcaseSlides.length) % showcaseSlides.length);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans relative overflow-x-hidden">
      
      {/* Left Column: Full-height login area (50% on desktop) */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 z-10 bg-white">
        
        {/* Inner container to keep inputs elegantly proportioned */}
        <div className="max-w-md w-full mx-auto flex flex-col justify-between h-full py-2">
          
          {/* Top Brand Logo & Name */}
          <div>
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-md">
                <Image
                  src="/9b8db237-6cd9-4f56-9713-92c1a701dcc0.png"
                  alt="Vertexia Logo"
                  width={44}
                  height={44}
                  className="object-contain w-full h-full p-1"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-xl tracking-tight text-slate-900 leading-none">
                  VERTEXIA <span className="text-[#0D594B]">OS</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                  Business Management
                </span>
              </div>
            </div>

            {/* Heading & Subtitle */}
            <div className="mt-12 mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
                Welcome Back!
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Please Log in to your account.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vertexia.pk"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D594B] focus:ring-2 focus:ring-[#0D594B]/15 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D594B] focus:ring-2 focus:ring-[#0D594B]/15 transition-all shadow-sm font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0D594B] focus:ring-[#0D594B]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Action buttons row */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-9 py-3.5 rounded-xl bg-[#0D594B] hover:bg-[#094338] active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-[#0D594B]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>Login</span>
                </button>

                <div className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold bg-slate-50 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#0D594B]" />
                  <span>Internal Access</span>
                </div>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-6 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
            By signing up you agree to our terms and that you have read our internal data security policy.
          </div>
        </div>
      </div>

      {/* Center Floating Indicator (Positioned exactly on the 50% split line) */}
      <div 
        className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-amber-400 text-amber-950 shadow-xl items-center justify-center z-30 font-bold border-4 border-white hover:scale-110 transition-transform cursor-pointer"
        onClick={handleNextSlide}
        title="Switch showcase slide"
      >
        <ChevronRight className="w-5 h-5 fill-current" />
      </div>

      {/* Right Column: Full-height visual showcase (50% on desktop, edge-to-edge) */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen relative bg-slate-950 overflow-hidden">
        {/* Full-bleed Visual Image */}
        <div className="absolute inset-0">
          <Image
            src={showcaseSlides[currentSlide].url}
            alt={showcaseSlides[currentSlide].title}
            fill
            className="object-cover transition-opacity duration-700 opacity-90"
            sizes="50vw"
            priority
          />
          {/* Subtle gradient vignette for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/25" />
        </div>

        {/* Top subtle badge */}
        <div className="absolute top-8 left-8 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-medium shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Vertexia OS v2.0 • Karachi HQ</span>
          </div>
        </div>

        {/* Bottom Title & Pagination controls */}
        <div className="absolute bottom-8 left-8 right-8 z-10 flex items-end justify-between text-white">
          <div className="max-w-[70%]">
            <h2 className="font-heading font-bold text-xl text-white leading-tight drop-shadow-md">
              {showcaseSlides[currentSlide].title}
            </h2>
            <p className="text-xs text-white/80 mt-1.5 drop-shadow leading-relaxed">
              {showcaseSlides[currentSlide].subtitle}
            </p>
          </div>

          {/* Pagination Widget */}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/20 p-1.5 rounded-xl shadow-lg">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              title="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 py-1 rounded-md bg-white text-slate-900 font-bold text-xs select-none shadow-sm">
              {currentSlide + 1}
            </div>
            <button
              type="button"
              onClick={handleNextSlide}
              className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              title="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Helper Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-slate-900 font-heading font-bold text-base mb-2">
              <HelpCircle className="w-5 h-5 text-[#0D594B]" />
              <h3>Password Reset Assistance</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Vertexia OS is an internal operating platform. For security compliance, password resets and credential recovery are managed directly by authorized system administrators.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 mb-5 font-mono">
              <div><strong className="font-sans text-slate-900">Admin Contact:</strong> admin@vertexia.pk</div>
              <div><strong className="font-sans text-slate-900">Support Line:</strong> +92 300 0000000</div>
              <div><strong className="font-sans text-slate-900">Office:</strong> Karachi HQ Operations</div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-5 py-2 rounded-xl bg-[#0D594B] text-white text-xs font-semibold hover:bg-[#094338] transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
