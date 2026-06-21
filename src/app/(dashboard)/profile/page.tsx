import React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="space-y-10">
      <PageHeader 
        title="Journal Profile" 
        subtitle="Manage your connected chess handles and display preferences."
      />

      <div className="max-w-2xl bg-surface border border-border p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-serif text-2xl font-bold">
            L
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold text-text-primary">Laasya</h2>
            <p className="text-xs text-text-secondary">Journaling since June 2026</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-sans font-medium uppercase tracking-widest text-text-secondary block mb-1">
              Full Name
            </label>
            <p className="text-sm font-sans text-text-primary">Laasya Sharma</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-sans font-medium uppercase tracking-widest text-text-secondary block mb-1">
                Chess.com Username
              </label>
              <p className="text-sm font-mono text-text-primary">laasya_sharma</p>
            </div>
            <div>
              <label className="text-[11px] font-sans font-medium uppercase tracking-widest text-text-secondary block mb-1">
                Lichess Username
              </label>
              <p className="text-sm font-mono text-text-primary">laasya_s</p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="outline" className="border-border hover:bg-background text-xs uppercase tracking-wider font-sans">
            Edit Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
