import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import type { Tab } from "../types";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "animals",   label: "Animals",   icon: "🐄" },
  { id: "feed",      label: "Feed",      icon: "🌾" },
  { id: "checklist", label: "Checklist", icon: "✓" },
];

type Props = {
  active: Tab;
  farmName: string;
  timezone: string;
  onTabChange: (tab: Tab) => void;
  onOpenSettings: () => void;
  children: React.ReactNode;
};

export default function Layout({ active, farmName, timezone, onTabChange, onOpenSettings, children }: Props) {
  const [clock, setClock] = useState(() => DateTime.now().setZone(timezone).toFormat("h:mm a"));

  useEffect(() => {
    const id = setInterval(() => {
      setClock(DateTime.now().setZone(timezone).toFormat("h:mm a"));
    }, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  const today = DateTime.now().setZone(timezone).toFormat("EEEE, d MMMM yyyy");

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-surface-raised border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-none">{farmName}</h1>
          <p className="text-xs text-text-muted mt-0.5">{today}</p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-base font-semibold text-text-primary tabular-nums">{clock}</p>

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
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong",
              ].join(" ")}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
