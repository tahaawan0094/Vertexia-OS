import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary" | "purple";
  size?: "sm" | "md";
}

export function Badge({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    secondary: "bg-slate-800 text-slate-100 border-slate-700",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[11px]",
    md: "px-2 py-0.5 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-md border tracking-wide",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const norm = (status || "").toUpperCase();
  let variant: BadgeProps["variant"] = "default";

  switch (norm) {
    case "ACTIVE":
    case "WON":
    case "PAID":
    case "RESOLVED":
    case "COMPLETED":
    case "DONE":
      variant = "success";
      break;
    case "NEW":
    case "INTERESTED":
    case "DEMO_SCHEDULED":
    case "PARTIALLY_PAID":
    case "IN_PROGRESS":
    case "ASSIGNED":
      variant = "info";
      break;
    case "PENDING":
    case "NEGOTIATION":
    case "WAITING_FOR_CLIENT":
    case "EXPIRING_SOON":
    case "PLANNING":
      variant = "warning";
      break;
    case "LOST":
    case "EXPIRED":
    case "SUSPENDED":
    case "OVERDUE":
    case "CANCELLED":
    case "CRITICAL":
      variant = "danger";
      break;
    case "LIFETIME":
    case "STABLE":
      variant = "purple";
      break;
    default:
      variant = "default";
  }

  const label = status ? status.replace(/_/g, " ") : "UNKNOWN";

  return <Badge variant={variant}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const norm = (priority || "").toUpperCase();
  let variant: BadgeProps["variant"] = "default";

  if (norm === "URGENT" || norm === "CRITICAL") variant = "danger";
  else if (norm === "HIGH") variant = "warning";
  else if (norm === "MEDIUM") variant = "info";
  else variant = "default";

  return <Badge variant={variant} size="sm">{norm}</Badge>;
}
