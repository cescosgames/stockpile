import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import type { Tab } from "../types";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "animals",   label: "Animals",   icon: "🐄" },
  { id: "feed",      label: "Feed",      icon: "🌾" },
  { id: "contacts",  label: "Contacts",  icon: "☎" },
  { id: "checklist", label: "Checklist", icon: "✓" },
];

type Props = {
  active: Tab;
  farmName: string;
  timezone: string;
  onTabChange: (tab: Tab) => void;
  onOpenSettings: () => void;
  children: React.ReactNode;
  pbOnline?: boolean;
  syncMode?: "local" | "network";
};

export default function Layout({ active, farmName, timezone, onTabChange, onOpenSettings, children, pbOnline, syncMode }: Props) {
  const [clock, setClock] = useState(() => DateTime.now().setZone(timezone).toFormat("h:mm a"));

  useEffect(() => {
    const id = setInterval(() => {
      setClock(DateTime.now().setZone(timezone).toFormat("h:mm a"));
    }, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  const today = DateTime.now().setZone(timezone).toFormat("MM/dd/yyyy");

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="relative bg-surface-raised border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-text-primary leading-none">{farmName}</h1>
          <p className="text-xs text-text-muted mt-0.5">{today}</p>
        </div>

        {/* Centered wordmark */}
        <span className="absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-tight text-accent pointer-events-none select-none">
          Stockpile
        </span>

        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-base font-semibold text-text-primary tabular-nums">{clock}</p>

          <button
            onClick={onOpenSettings}
            className="text-text-muted hover:text-text-primary transition-colors self-center"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-surface-raised border-b border-border px-4 flex gap-1">
        {TABS.map(({ id, label, icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={[
                "flex items-center gap-2 px-3 sm:px-5 py-4 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong",
              ].join(" ")}
            >
              <span className="text-3xl sm:text-base">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Offline banner — only shown in network mode when PocketBase is unreachable */}
      {syncMode === "network" && !pbOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2">
          <span className="text-amber-600 text-sm font-medium">Offline</span>
          <span className="text-amber-700 text-sm">— server unreachable. Changes won't be saved until the connection is restored.</span>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {children}
      </main>

      <footer className="py-3 px-6 flex justify-end">
        <p className="text-xs text-text-muted">stockpile v0.1.0 / {syncMode === "network" ? (pbOnline ? "syncing" : "offline") : "local"}</p>
      </footer>
    </div>
  );
}
