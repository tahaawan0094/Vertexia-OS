import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  href?: string;
  colorClass?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  href,
  colorClass = "text-brand-600 bg-brand-50",
}: StatCardProps) {
  const content = (
    <div className="bg-white p-5 rounded-lg border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-all group relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={cn("p-2 rounded-md transition-transform group-hover:scale-105", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded",
              trend.isPositive
                ? "text-emerald-700 bg-emerald-50"
                : "text-amber-700 bg-amber-50"
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          {subtitle}
        </p>
      )}

      {href && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
