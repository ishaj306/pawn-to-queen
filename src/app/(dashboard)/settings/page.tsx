import React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <PageHeader 
        title="Journal Settings" 
        subtitle="Configure your growth environment and account details."
      />

      <div className="max-w-2xl bg-surface border border-border p-8 space-y-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-text-primary border-b border-border pb-3">
          Account Configurations
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-sans font-medium text-text-primary">Email Notifications</p>
              <p className="text-xs text-text-secondary">Receive quiet weekly digests of your playbook rules.</p>
            </div>
            <button className="w-10 h-6 bg-gold/20 rounded-full p-0.5 transition-colors cursor-pointer flex items-center justify-end">
              <span className="w-5 h-5 bg-gold rounded-full" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-sans font-medium text-text-primary">Rating Milestones</p>
              <p className="text-xs text-text-secondary">Enable visual ceremony markings on the timeline when you cross a milestone.</p>
            </div>
            <button className="w-10 h-6 bg-gold rounded-full p-0.5 transition-colors cursor-pointer flex items-center justify-end">
              <span className="w-5 h-5 bg-white rounded-full" />
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-between">
          <Button variant="outline" className="border-border hover:bg-background text-xs uppercase tracking-wider font-sans text-danger border-danger/20 hover:text-danger hover:bg-danger/5">
            Reset All Journal Data
          </Button>
          <Button variant="default" className="bg-gold hover:bg-gold/90 text-white font-sans text-xs uppercase tracking-wider px-6">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
