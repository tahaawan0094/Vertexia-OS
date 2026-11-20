"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
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

  // Curated high-res relevant tech / digital architecture visuals for Vertexia
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
    <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans relative overflow-hidden">
      {/* Subtle organic background vector lines */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d="M-100,200 C300,100 600,500 1200,300 C1500,200 1800,600 2200,400"
            fill="none"
            stroke="url(#grid-grad)"
            strokeWidth="1.5"
          />
          <path
            d="M-50,500 C400,300 700,700 1400,450 C1700,350 1900,800 2400,600"
            fill="none"
            stroke="url(#grid-grad)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Main Container Card — Matches Kafh UI design layout */}
      <div className="relative w-full max-w-5xl bg-white rounded-[28px] border border-slate-200/90 shadow-2xl shadow-slate-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] z-10">
        
        {/* Left Side: Login Form (approx 48% on desktop) */}
        <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-white">
          <div>
            {/* Top Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-md">
                <Image
                  src="/9b8db237-6cd9-4f56-9713-92c1a701dcc0.png"
                  alt="Vertexia Logo"
                  width={40}
                  height={40}
                  className="object-contain w-full h-full p-1"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-lg tracking-tight text-slate-900 leading-none">
                  VERTEXIA <span className="text-[#0D594B]">OS</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  Business Management
                </span>
              </div>
            </div>

            {/* Heading & Subtitle */}
            <div className="mt-8 mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
                Welcome Back!
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1.5">
                Please Log in to your account.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@vertexia.pk"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D594B] focus:ring-2 focus:ring-[#0D594B]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D594B] focus:ring-2 focus:ring-[#0D594B]/15 transition-all font-mono tracking-wider"
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
                  className="px-8 py-3 rounded-xl bg-[#0D594B] hover:bg-[#094338] active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-[#0D594B]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>Login</span>
                </button>

                <div className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold bg-slate-50 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#0D594B]" />
                  <span>Internal Access</span>
                </div>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
            By signing up you agree to our terms and that you have read our internal data security policy.
          </div>
        </div>

        {/* Center Floating Indicator (Matches the yellow circle from Kafh design) */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-400 text-amber-950 shadow-lg items-center justify-center z-20 font-bold border-2 border-white hover:scale-105 transition-transform cursor-pointer"
             onClick={handleNextSlide}
             title="Switch showcase slide"
        >
          <ChevronRight className="w-5 h-5 fill-current" />
        </div>

        {/* Right Side: Stunning relevant visual showcase (approx 52% on desktop) */}
        <div className="lg:col-span-6 relative bg-slate-950 overflow-hidden min-h-[320px] lg:min-h-full">
          {/* Visual Image */}
          <div className="absolute inset-0">
            <Image
              src={showcaseSlides[currentSlide].url}
              alt={showcaseSlides[currentSlide].title}
              fill
              className="object-cover transition-opacity duration-700 opacity-90"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {/* Subtle gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
          </div>

          {/* Top subtle badge */}
          <div className="absolute top-6 left-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Vertexia OS v2.0 • Karachi HQ</span>
            </div>
          </div>

          {/* Bottom Title & Pagination controls (Matches Kafh controls [ < ] [ 1 ] [ > ]) */}
          <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between text-white">
            <div className="max-w-[70%]">
              <h2 className="font-heading font-bold text-lg text-white leading-tight drop-shadow-md">
                {showcaseSlides[currentSlide].title}
              </h2>
              <p className="text-xs text-white/80 mt-1 drop-shadow">
                {showcaseSlides[currentSlide].subtitle}
              </p>
            </div>

            {/* Pagination Widget */}
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/20 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                title="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 py-0.5 rounded-md bg-white text-slate-900 font-bold text-xs select-none shadow-sm">
                {currentSlide + 1}
              </div>
              <button
                type="button"
                onClick={handleNextSlide}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                title="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
