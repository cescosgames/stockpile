import { DateTime } from "luxon";
import type { Animal, FeedItem, FeedingTask, CheckedState, HealthStatus } from "../types";

type Props = {
  animals: Animal[];
  feedItems: FeedItem[];
  feedingTasks: FeedingTask[];
  checkedState: CheckedState;
  timezone: string;
};

const HEALTH_STYLE: Record<HealthStatus, string> = {
  Good: "bg-success-subtle text-success",
  Fair: "bg-warning-subtle text-warning",
  Poor: "bg-danger-subtle text-danger",
};

function todayKey(tz: string) {
  return DateTime.now().setZone(tz).toISODate() ?? "";
}

function checklistKey(date: string, session: string, taskId: string) {
  return `${date}-${session}-${taskId}`;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-surface-raised rounded-card border border-border p-5">
      <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ?? "text-text-primary"}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ animals, feedItems, feedingTasks, checkedState, timezone }: Props) {
  const today = todayKey(timezone);
  const totalAnimals = animals.length;
  const lowStock = feedItems.filter((f) => f.qty <= f.minQty);

  const amTasks = feedingTasks.filter((t) => t.session === "AM");
  const pmTasks = feedingTasks.filter((t) => t.session === "PM");
  const amDone = amTasks.filter((t) => checkedState[checklistKey(today, "AM", t.id)]).length;
  const pmDone = pmTasks.filter((t) => checkedState[checklistKey(today, "PM", t.id)]).length;

  const healthCounts = animals.reduce(
    (acc, a) => { acc[a.health] = (acc[a.health] ?? 0) + 1; return acc; },
    {} as Record<HealthStatus, number>,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Animals" value={totalAnimals} sub={`${new Set(animals.map((a) => a.type.toLowerCase())).size} types`} />
        <StatCard
          label="Low Stock"
          value={lowStock.length}
          sub={lowStock.length ? lowStock.map((f) => f.name).join(", ") : "All stocked"}
          accent={lowStock.length ? "text-warning" : "text-success"}
        />
        <StatCard label="AM Tasks" value={`${amDone}/${amTasks.length}`} sub="completed today" accent={amDone === amTasks.length ? "text-success" : "text-text-primary"} />
        <StatCard label="PM Tasks" value={`${pmDone}/${pmTasks.length}`} sub="completed today" accent={pmDone === pmTasks.length ? "text-success" : "text-text-primary"} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Animal health */}
        <section className="bg-surface-raised rounded-card border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Animal Health</h2>
          <div className="flex flex-col gap-2">
            {animals.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-text-primary">{a.name}</span>
                  <span className="text-xs text-text-muted ml-2">{a.type}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HEALTH_STYLE[a.health]}`}>
                  {a.health}
                </span>
              </div>
            ))}
            {animals.length === 0 && <p className="text-sm text-text-muted">No animals added yet.</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex gap-3">
            {(["Good", "Fair", "Poor"] as HealthStatus[]).map((s) => (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${HEALTH_STYLE[s]}`}>
                {healthCounts[s] ?? 0} {s}
              </span>
            ))}
          </div>
        </section>

        {/* Feed inventory */}
        <section className="bg-surface-raised rounded-card border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Feed Inventory</h2>
          <div className="flex flex-col gap-3">
            {feedItems.map((f) => {
              const pct = Math.min(100, Math.round((f.qty / Math.max(f.maxQty, 1)) * 100));
              const isLow = f.qty <= f.minQty;
              return (
                <div key={f.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium ${isLow ? "text-warning" : "text-text-primary"}`}>
                      {isLow ? "⚠ " : ""}{f.name}
                    </span>
                    <span className="text-text-muted">{f.qty} / {f.maxQty} {f.unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {feedItems.length === 0 && <p className="text-sm text-text-muted">No feed items added yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
