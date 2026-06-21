import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    type: "positive" | "negative" | "neutral";
  };
}

export function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <div className="bg-surface border border-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
      <p className="text-[11px] font-sans font-medium uppercase tracking-widest text-text-secondary">
        {label}
      </p>
      <div className="flex items-baseline justify-between mt-4">
        <span className="text-3xl font-mono font-semibold text-text-primary">
          {value}
        </span>
        {delta && (
          <span
            className={`flex items-center gap-0.5 text-xs font-mono font-medium px-2 py-0.5 rounded-full ${
              delta.type === "positive"
                ? "bg-success/10 text-success"
                : delta.type === "negative"
                ? "bg-danger/10 text-danger"
                : "bg-text-muted/10 text-text-secondary"
            }`}
          >
            {delta.type === "positive" && <ArrowUpRight className="w-3.5 h-3.5" />}
            {delta.type === "negative" && <ArrowDownRight className="w-3.5 h-3.5" />}
            {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}
