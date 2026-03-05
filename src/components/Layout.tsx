import type { Tab } from "../types";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "animals",   label: "Animals",   icon: "🐄" },
  { id: "feed",      label: "Feed",      icon: "🌾" },
  { id: "checklist", label: "Checklist", icon: "✓" },
];

type Props = {
  active: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
};

export default function Layout({ active, onTabChange, children }: Props) {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-surface-raised border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary leading-none">
            Giannini Farm
          </h1>
          <p className="text-xs text-text-muted mt-0.5">{today}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center text-sm">
          🌿
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
