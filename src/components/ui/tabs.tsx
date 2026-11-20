import React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: Array<{ id: string; label: string; count?: number; icon?: React.ComponentType<{ className?: string }> }>;
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("border-b border-slate-200 flex gap-2 overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 py-3 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors relative -mb-[1px]",
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
