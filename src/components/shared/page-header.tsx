import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between pb-6 mb-8 border-b border-border gap-4">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-secondary font-sans mt-1 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
