import React from "react";

interface EmptyStateProps {
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-surface/50 border border-dashed border-border py-16">
      <p className="text-lg font-serif font-medium text-text-primary max-w-md leading-snug">
        {message}
      </p>
      {description && (
        <p className="text-sm text-text-secondary font-sans mt-2 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
