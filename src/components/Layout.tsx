import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import type { Tab } from "../types";

// SVG icon components — clean, stroke-based, consistent weight
function IconDashboard({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function IconAnimals({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 4 5.5 4 10c0 2.5 1 4.5 2.5 6L8 21h8l1.5-5C19 14.5 20 12.5 20 10c0-4.5-4-8-8-8z"/>
      <path d="M9 10h.01M15 10h.01"/>
      <path d="M9.5 14.5c.7.7 1.5 1 2.5 1s1.8-.3 2.5-1"/>
    </svg>
  );
}

function IconFeed({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.5 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3.5-7-7-7z"/>
      <path d="M12 6v8M9 9l3-3 3 3"/>
    </svg>
  );
}

function IconContacts({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

function IconChecklist({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { id: "animals",   label: "Animals",   Icon: IconAnimals },
  { id: "feed",      label: "Feed",      Icon: IconFeed },
  { id: "contacts",  label: "Contacts",  Icon: IconContacts },
  { id: "checklist", label: "Checklist", Icon: IconChecklist },
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

  const todayShort = DateTime.now().setZone(timezone).toFormat("MM/dd/yyyy");
  const todayLong  = DateTime.now().setZone(timezone).toFormat("d MMMM yyyy");

  return (
    <div className="min-h-screen flex flex-col bg-surface">

      {/* Header */}
      <header className="relative bg-surface-raised border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-text-primary leading-none">{farmName}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            <span className="sm:hidden">{todayShort}</span>
            <span className="hidden sm:inline">{todayLong}</span>
          </p>
        </div>

        {/* Centered wordmark */}
        <span className="absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-tight text-accent pointer-events-none select-none">
          Stockpile
        </span>

        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-base font-semibold text-text-primary tabular-nums">{clock}</p>
          <button
            onClick={onOpenSettings}
            className="text-text-muted hover:text-text-primary transition-colors self-center p-2 -mr-2"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Desktop tab nav — hidden on mobile */}
      <nav className="hidden sm:flex bg-surface-raised border-b border-border px-4 gap-1">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={[
                "flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong",
              ].join(" ")}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Offline banner */}
      {syncMode === "network" && !pbOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2">
          <span className="text-amber-600 text-sm font-medium">Offline</span>
          <span className="text-amber-700 text-sm">— server unreachable. Changes won't be saved until the connection is restored.</span>
        </div>
      )}

      {/* Content — extra bottom padding on mobile so content clears the bottom nav */}
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto pb-32 sm:pb-6">
        {children}
      </main>

      <footer className="hidden sm:flex py-3 px-6 justify-end">
        <p className="text-xs text-text-muted">stockpile v0.2.1 / {syncMode === "network" ? (pbOnline ? "syncing" : "offline") : "local"}</p>
      </footer>

      {/* Bottom nav — mobile only — Apple glass pill */}
      {(() => {
        const activeIndex = TABS.findIndex(t => t.id === active);
        return (
          <nav
            className="sm:hidden fixed left-0 right-0 bottom-0 flex bg-surface-raised border-t border-border"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Sliding top-border indicator */}
            <span
              className="absolute top-0 h-0.5 bg-accent pointer-events-none"
              style={{
                width: `calc(100% / ${TABS.length})`,
                left: 0,
                transform: `translateX(calc(${activeIndex} * 100%))`,
                transition: "transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1)",
              }}
            />
            {TABS.map(({ id, label, Icon }) => {
              const isActive = id === active;
              return (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className="relative flex-1 flex flex-col items-center gap-1 py-2.5"
                  style={{
                    color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                    opacity: isActive ? 1 : 0.55,
                    transition: "color 0.25s ease, opacity 0.25s ease",
                  }}
                >
                  <span className="relative"><Icon size={22} /></span>
                  <span className="relative text-[10px] font-semibold tracking-wide">{label}</span>
                </button>
              );
            })}
          </nav>
        );
      })()}

    </div>
  );
}
