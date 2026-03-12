import { useState } from "react";
import { DateTime } from "luxon";
import type { Animal, FeedingTask, FeedItem, WeeklyTask, CheckedState, Session } from "../types";
import ConfirmModal from "./ConfirmModal";

type Props = {
  feedingTasks: FeedingTask[];
  weeklyTasks: WeeklyTask[];
  feedItems: FeedItem[];
  animals: Animal[];
  checkedState: CheckedState;
  timezone: string;
  setChecked: (key: string, value: boolean, task?: FeedingTask) => void;
  setFeedingTasks: (tasks: FeedingTask[]) => void;
  setWeeklyTasks: (tasks: WeeklyTask[]) => void;
};

function todayKey(tz: string) { return DateTime.now().setZone(tz).toISODate() ?? ""; }
function weekKey(tz: string) { return DateTime.now().setZone(tz).startOf("week").toISODate() ?? ""; }
function checkedKey(date: string, session: Session, taskId: string) { return `${date}-${session}-${taskId}`; }
function animalCheckedKey(date: string, session: Session, taskId: string, animalId: string) { return `${date}-${session}-${taskId}-${animalId}`; }
function weeklyCheckedKey(week: string, taskId: string) { return `${week}-week-${taskId}`; }
function newId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(15)))
    .map(b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
    .join("");
}

type TaskFormState = { label: string; session: Session | "Weekly"; feedItemId: string; scoops: string; perAnimal: boolean; animalType: string };
const BLANK_TASK: TaskFormState = { label: "", session: "AM", feedItemId: "", scoops: "", perAnimal: false, animalType: "" };

type SessionBlockProps = {
  session: Session;
  tasks: FeedingTask[];
  animals: Animal[];
  today: string;
  checkedState: CheckedState;
  feedItems: FeedItem[];
  toggle: (task: FeedingTask, animalId?: string) => void;
  requestDelete: (task: FeedingTask) => void;
  requestEdit: (task: FeedingTask) => void;
};

function SessionBlock({ session, tasks, animals, today, checkedState, feedItems, toggle, requestDelete, requestEdit }: SessionBlockProps) {
  const [collapsed, setCollapsed] = useState(false);

  let total = 0;
  let done = 0;
  for (const task of tasks) {
    total += 1;
    if (task.perAnimal && task.animalType) {
      const group = animals.filter((a) => a.type.toLowerCase() === task.animalType!.toLowerCase());
      const allFed = group.length > 0 && group.every((a) => !!checkedState[animalCheckedKey(today, session, task.id, a.id)]);
      if (allFed) done += 1;
    } else {
      if (checkedState[checkedKey(today, session, task.id)]) done += 1;
    }
  }
  const allDone = total > 0 && done === total;

  return (
    <section className="bg-surface-raised rounded-card border border-border overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={`w-full px-5 py-3 flex items-center gap-3 transition-colors select-none ${collapsed ? "bg-surface-raised" : allDone ? "bg-success-subtle" : "bg-surface-sunken"} ${collapsed ? "" : "border-b border-border"}`}
      >
        <span className="text-text-muted text-sm shrink-0" style={{ display: "inline-block", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▼</span>
        <span className="text-sm font-semibold text-text-primary">{session === "AM" ? "Morning" : "Evening"}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${allDone ? "bg-success text-white" : "bg-surface text-text-muted border border-border"}`}>
          {done}/{total}
        </span>
        {allDone && <span className="text-xs text-success font-medium ml-auto">All done ✓</span>}
      </button>

      {!collapsed && <div className="divide-y divide-border">
        {tasks.length === 0 && <p className="px-5 py-4 text-sm text-text-muted">No {session} tasks.</p>}

        {tasks.map((task) => {
          if (task.perAnimal && task.animalType) {
            const group = animals.filter((a) => a.type.toLowerCase() === task.animalType!.toLowerCase());
            const groupDone = group.filter((a) => !!checkedState[animalCheckedKey(today, session, task.id, a.id)]).length;
            const feedItem = task.feedItemId ? feedItems.find((f) => f.id === task.feedItemId) : null;

            return (
              <div key={task.id}>
                {/* Per-animal group header */}
                <div className="flex items-center gap-4 px-5 py-3 bg-surface-sunken border-b border-border">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary">{task.label}</span>
                    <span className="text-xs text-text-muted ml-2 tabular-nums">{groupDone}/{group.length}</span>
                    {feedItem && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {task.scoops} {feedItem.servingUnit || "scoop"}{task.scoops !== 1 ? "s" : ""} each · {feedItem.name}
                      </p>
                    )}
                  </div>
                  {group.length > 0 && (
                    <button
                      onClick={() => {
                        const shouldCheck = groupDone < group.length;
                        group.forEach((a) => {
                          const key = animalCheckedKey(today, session, task.id, a.id);
                          if (!!checkedState[key] !== shouldCheck) toggle(task, a.id);
                        });
                      }}
                      className="text-xs text-accent hover:text-accent-hover font-medium shrink-0"
                    >
                      {groupDone === group.length ? "Uncheck all" : "Check all"}
                    </button>
                  )}
                  <button
                    onClick={() => requestEdit(task)}
                    className="text-text-muted hover:text-accent text-sm px-3 py-2 rounded hover:bg-accent-subtle transition-colors shrink-0"
                  >✎</button>
                  <button
                    onClick={() => requestDelete(task)}
                    className="text-text-muted hover:text-danger text-sm px-3 py-2 rounded hover:bg-danger-subtle transition-colors shrink-0"
                  >✕</button>
                </div>

                {/* Individual animal rows */}
                {group.length === 0 && (
                  <p className="px-8 py-3 text-xs text-text-muted">No {task.animalType} animals found.</p>
                )}
                {group.map((animal) => {
                  const key = animalCheckedKey(today, session, task.id, animal.id);
                  const checked = !!checkedState[key];
                  return (
                    <div
                      key={animal.id}
                      onClick={() => toggle(task, animal.id)}
                      className={`flex items-center gap-4 pl-10 pr-5 py-3 cursor-pointer hover:bg-surface-sunken transition-colors border-b border-border last:border-b-0 ${checked ? "opacity-60" : ""}`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${checked ? "bg-success border-success" : "border-border-strong"}`}>
                        {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <span className={`text-sm ${checked ? "line-through text-text-muted" : "text-text-primary"}`}>{animal.name}</span>
                    </div>
                  );
                })}
              </div>
            );
          }

          // Communal task
          const key = checkedKey(today, session, task.id);
          const checked = !!checkedState[key];
          const feedItem = task.feedItemId ? feedItems.find((f) => f.id === task.feedItemId) : null;
          return (
            <div
              key={task.id}
              className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-surface-sunken transition-colors ${checked ? "opacity-60" : ""}`}
              onClick={() => toggle(task)}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${checked ? "bg-success border-success" : "border-border-strong"}`}>
                {checked && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${checked ? "line-through text-text-muted" : "text-text-primary"}`}>{task.label}</span>
                {feedItem && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {task.scoops} {feedItem.servingUnit || "scoop"}{task.scoops !== 1 ? "s" : ""} · {((task.scoops ?? 0) * feedItem.scoopSize).toFixed(2)} {feedItem.unit} of {feedItem.name}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); requestEdit(task); }}
                className="text-text-muted hover:text-accent text-sm px-3 py-2 rounded hover:bg-accent-subtle transition-colors shrink-0"
              >✎</button>
              <button
                onClick={(e) => { e.stopPropagation(); requestDelete(task); }}
                className="text-text-muted hover:text-danger text-sm px-3 py-2 rounded hover:bg-danger-subtle transition-colors shrink-0"
              >✕</button>
            </div>
          );
        })}
      </div>}
    </section>
  );
}

type WeeklyBlockProps = {
  tasks: WeeklyTask[];
  week: string;
  checkedState: CheckedState;
  toggle: (task: WeeklyTask) => void;
  requestDelete: (task: WeeklyTask) => void;
  requestEdit: (task: WeeklyTask) => void;
};

function WeeklyBlock({ tasks, week, checkedState, toggle, requestDelete, requestEdit }: WeeklyBlockProps) {
  const [collapsed, setCollapsed] = useState(false);

  const done = tasks.filter((t) => !!checkedState[weeklyCheckedKey(week, t.id)]).length;
  const allDone = tasks.length > 0 && done === tasks.length;

  return (
    <section className="bg-surface-raised rounded-card border border-border overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={`w-full px-5 py-3 flex items-center gap-3 transition-colors select-none ${collapsed ? "bg-surface-raised" : allDone ? "bg-success-subtle" : "bg-surface-sunken"} ${collapsed ? "" : "border-b border-border"}`}
      >
        <span className="text-text-muted text-sm shrink-0" style={{ display: "inline-block", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▼</span>
        <span className="text-sm font-semibold text-text-primary">Weekly</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${allDone ? "bg-success text-white" : "bg-surface text-text-muted border border-border"}`}>
          {done}/{tasks.length}
        </span>
        {allDone && <span className="text-xs text-success font-medium ml-auto">All done ✓</span>}
      </button>

      {!collapsed && (
        <div className="divide-y divide-border">
          {tasks.length === 0 && <p className="px-5 py-4 text-sm text-text-muted">No weekly tasks.</p>}
          {tasks.map((task) => {
            const checked = !!checkedState[weeklyCheckedKey(week, task.id)];
            return (
              <div
                key={task.id}
                className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-surface-sunken transition-colors ${checked ? "opacity-60" : ""}`}
                onClick={() => toggle(task)}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${checked ? "bg-success border-success" : "border-border-strong"}`}>
                  {checked && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className={`flex-1 text-sm ${checked ? "line-through text-text-muted" : "text-text-primary"}`}>{task.label}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); requestEdit(task); }}
                  className="text-text-muted hover:text-accent text-sm px-3 py-2 rounded hover:bg-accent-subtle transition-colors shrink-0"
                >✎</button>
                <button
                  onClick={(e) => { e.stopPropagation(); requestDelete(task); }}
                  className="text-text-muted hover:text-danger text-sm px-3 py-2 rounded hover:bg-danger-subtle transition-colors shrink-0"
                >✕</button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Checklist({ feedingTasks, weeklyTasks, feedItems, animals, checkedState, timezone, setChecked, setFeedingTasks, setWeeklyTasks }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormState>(BLANK_TASK);
  const [editingTask, setEditingTask] = useState<FeedingTask | WeeklyTask | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FeedingTask | null>(null);
  const [pendingWeeklyDelete, setPendingWeeklyDelete] = useState<WeeklyTask | null>(null);
  const today = todayKey(timezone);
  const week = weekKey(timezone);

  const amTasks = feedingTasks.filter((t) => t.session === "AM");
  const pmTasks = feedingTasks.filter((t) => t.session === "PM");
  const animalTypes = [...new Set(animals.map((a) => a.type))];

  function toggle(task: FeedingTask, animalId?: string) {
    const key = animalId
      ? animalCheckedKey(today, task.session, task.id, animalId)
      : checkedKey(today, task.session, task.id);
    setChecked(key, !checkedState[key], task);
  }

  function deleteTask(id: string) {
    setFeedingTasks(feedingTasks.filter((t) => t.id !== id));
  }

  function toggleWeekly(task: WeeklyTask) {
    const key = weeklyCheckedKey(week, task.id);
    setChecked(key, !checkedState[key]);
  }

  function requestEdit(task: FeedingTask | WeeklyTask) {
    if ("session" in task) {
      setTaskForm({
        label: task.label,
        session: task.session,
        feedItemId: task.feedItemId ?? "",
        scoops: task.scoops?.toString() ?? "",
        perAnimal: task.perAnimal ?? false,
        animalType: task.animalType ?? "",
      });
    } else {
      setTaskForm({ ...BLANK_TASK, label: task.label, session: "Weekly" });
    }
    setEditingTask(task);
    setShowForm(true);
  }

  function saveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.label.trim()) return;

    const isEditingWeekly = editingTask && !("session" in editingTask);
    const isEditingFeeding = editingTask && "session" in editingTask;

    if (taskForm.session === "Weekly") {
      const updated: WeeklyTask = { id: editingTask?.id ?? newId(), label: taskForm.label.trim() };
      if (isEditingFeeding) setFeedingTasks(feedingTasks.filter(t => t.id !== editingTask!.id));
      setWeeklyTasks(isEditingWeekly
        ? weeklyTasks.map(t => t.id === editingTask!.id ? updated : t)
        : [...weeklyTasks, updated]);
    } else {
      if (taskForm.perAnimal && !taskForm.animalType.trim()) return;
      const task: FeedingTask = {
        id: editingTask?.id ?? newId(),
        label: taskForm.label.trim(),
        session: taskForm.session,
        ...(taskForm.feedItemId && taskForm.scoops ? { feedItemId: taskForm.feedItemId, scoops: parseFloat(taskForm.scoops) } : {}),
        ...(taskForm.perAnimal ? { perAnimal: true, animalType: taskForm.animalType.trim() } : {}),
      };
      if (isEditingWeekly) setWeeklyTasks(weeklyTasks.filter(t => t.id !== editingTask!.id));
      setFeedingTasks(isEditingFeeding
        ? feedingTasks.map(t => t.id === editingTask!.id ? task : t)
        : [...feedingTasks, task]);
    }
    setTaskForm(BLANK_TASK);
    setEditingTask(null);
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Checklist</h2>
          <p className="text-xs text-text-muted">{DateTime.now().toFormat("EEEE, d MMMM yyyy")}</p>
        </div>
        <button
          onClick={() => {
            if (showForm) { setShowForm(false); setEditingTask(null); setTaskForm(BLANK_TASK); }
            else setShowForm(true);
          }}
          className="bg-accent text-white text-sm font-medium px-5 py-3 rounded-btn hover:bg-accent-hover transition-colors"
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveTask} className="bg-surface-raised rounded-card border border-border p-4 flex flex-col gap-3">
          <input
            className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
            placeholder="Task label" value={taskForm.label}
            onChange={(e) => setTaskForm((p) => ({ ...p, label: e.target.value }))} required autoFocus
          />
          <div className="flex gap-2">
            {(["AM", "PM", "Weekly"] as const).map((s) => (
              <button key={s} type="button"
                onClick={() => setTaskForm((p) => ({ ...p, session: s, perAnimal: false, animalType: "", feedItemId: "", scoops: "" }))}
                className={["flex-1 py-3 rounded-btn text-sm font-medium border transition-colors",
                  taskForm.session === s ? "bg-accent text-white border-accent" : "bg-surface border-border text-text-secondary hover:border-border-strong"
                ].join(" ")}
              >{s}</button>
            ))}
          </div>
          {taskForm.session !== "Weekly" && (
            <>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTaskForm((p) => ({ ...p, perAnimal: !p.perAnimal, animalType: "" }))}
                  className={["flex-1 py-3 rounded-btn text-sm font-medium border transition-colors",
                    taskForm.perAnimal ? "bg-accent text-white border-accent" : "bg-surface border-border text-text-secondary hover:border-border-strong"
                  ].join(" ")}
                >Per animal</button>
              </div>
              {taskForm.perAnimal && (
                <input
                  list="animal-types-list"
                  className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                  placeholder="Animal type (e.g. Cow)" value={taskForm.animalType}
                  onChange={(e) => setTaskForm((p) => ({ ...p, animalType: e.target.value }))} required
                />
              )}
              <datalist id="animal-types-list">{animalTypes.map((t) => <option key={t} value={t} />)}</datalist>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                  value={taskForm.feedItemId} onChange={(e) => setTaskForm((p) => ({ ...p, feedItemId: e.target.value }))}
                >
                  <option value="">No feed item</option>
                  {feedItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {taskForm.feedItemId && (
                  <input type="number" min="0.5" step="0.5" placeholder="Scoops"
                    className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                    value={taskForm.scoops} onChange={(e) => setTaskForm((p) => ({ ...p, scoops: e.target.value }))}
                  />
                )}
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingTask(null); setTaskForm(BLANK_TASK); }} className="flex-1 py-3 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover">{editingTask ? "Save Changes" : "Add Task"}</button>
          </div>
        </form>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Daily Tasks</p>
        <span className="text-xs text-text-muted">Resets midnight {DateTime.now().setZone(timezone).toFormat("EEEE, MMMM d")}</span>
      </div>

      <SessionBlock session="AM" tasks={amTasks} animals={animals} today={today} checkedState={checkedState} feedItems={feedItems} toggle={toggle} requestDelete={setPendingDelete} requestEdit={requestEdit} />
      <SessionBlock session="PM" tasks={pmTasks} animals={animals} today={today} checkedState={checkedState} feedItems={feedItems} toggle={toggle} requestDelete={setPendingDelete} requestEdit={requestEdit} />

      {/* Weekly section */}
      <div className="border-t border-border" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Weekly Tasks</p>
        <span className="text-xs text-text-muted">Resets midnight {DateTime.fromISO(week).plus({ weeks: 1 }).toFormat("EEEE, MMMM d")}</span>
      </div>

      <WeeklyBlock tasks={weeklyTasks} week={week} checkedState={checkedState} toggle={toggleWeekly} requestDelete={setPendingWeeklyDelete} requestEdit={requestEdit} />

      {pendingDelete && (
        <ConfirmModal
          message={`Remove "${pendingDelete.label}" from your tasks?`}
          confirmLabel="Remove"
          onConfirm={() => { deleteTask(pendingDelete.id); setPendingDelete(null); }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {pendingWeeklyDelete && (
        <ConfirmModal
          message={`Remove "${pendingWeeklyDelete.label}" from weekly tasks?`}
          confirmLabel="Remove"
          onConfirm={() => { setWeeklyTasks(weeklyTasks.filter((t) => t.id !== pendingWeeklyDelete.id)); setPendingWeeklyDelete(null); }}
          onCancel={() => setPendingWeeklyDelete(null)}
        />
      )}
    </div>
  );
}
