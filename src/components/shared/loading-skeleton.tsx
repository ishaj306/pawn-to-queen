import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "card" | "list";
}

export function LoadingSkeleton({ className = "", variant = "text" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={`bg-surface border border-border p-6 shadow-sm space-y-4 animate-pulse ${className}`}>
        <div className="h-3 bg-border w-1/4 rounded-sm" />
        <div className="h-8 bg-border w-1/2 rounded-sm" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`space-y-4 animate-pulse ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center py-4 border-b border-border">
            <div className="space-y-2 w-2/3">
              <div className="h-4 bg-border w-1/3 rounded-sm" />
              <div className="h-3 bg-border w-full rounded-sm" />
            </div>
            <div className="h-8 bg-border w-16 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-4 bg-border rounded-sm w-3/4" />
      <div className="h-3 bg-border rounded-sm w-full" />
      <div className="h-3 bg-border rounded-sm w-5/6" />
    </div>
  );
}
