import { useState } from "react";
import { DateTime } from "luxon";
import type { FeedingTask, FeedItem, CheckedState, Session } from "../types";

type Props = {
  feedingTasks: FeedingTask[];
  feedItems: FeedItem[];
  checkedState: CheckedState;
  timezone: string;
  setChecked: (key: string, value: boolean, task?: FeedingTask) => void;
  setFeedingTasks: (tasks: FeedingTask[]) => void;
};

function todayKey(tz: string) {
  return DateTime.now().setZone(tz).toISODate() ?? "";
}

function checkedKey(date: string, session: Session, taskId: string) {
  return `${date}-${session}-${taskId}`;
}

function newId() { return Date.now().toString(); }

type TaskFormState = { label: string; session: Session; feedItemId: string; scoops: string };
const BLANK_TASK: TaskFormState = { label: "", session: "AM", feedItemId: "", scoops: "" };

export default function Checklist({ feedingTasks, feedItems, checkedState, timezone, setChecked, setFeedingTasks }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormState>(BLANK_TASK);
  const today = todayKey(timezone);

  const amTasks = feedingTasks.filter((t) => t.session === "AM");
  const pmTasks = feedingTasks.filter((t) => t.session === "PM");

  function toggle(task: FeedingTask) {
    const key = checkedKey(today, task.session, task.id);
    setChecked(key, !checkedState[key], task);
  }

  function deleteTask(id: string) {
    if (!confirm("Remove this task?")) return;
    setFeedingTasks(feedingTasks.filter((t) => t.id !== id));
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.label.trim()) return;
    const task: FeedingTask = {
      id: newId(),
      label: taskForm.label.trim(),
      session: taskForm.session,
      ...(taskForm.feedItemId && taskForm.scoops
        ? { feedItemId: taskForm.feedItemId, scoops: parseFloat(taskForm.scoops) }
        : {}),
    };
    setFeedingTasks([...feedingTasks, task]);
    setTaskForm(BLANK_TASK);
    setShowForm(false);
  }

  function SessionBlock({ session, tasks }: { session: Session; tasks: FeedingTask[] }) {
    const done = tasks.filter((t) => checkedState[checkedKey(today, session, t.id)]).length;
    const allDone = done === tasks.length && tasks.length > 0;

    return (
      <section className="bg-surface-raised rounded-card border border-border overflow-hidden">
        <div className={`px-5 py-3 flex items-center justify-between border-b border-border ${allDone ? "bg-success-subtle" : "bg-surface-sunken"}`}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text-primary">{session === "AM" ? "Morning" : "Evening"}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${allDone ? "bg-success text-white" : "bg-surface text-text-muted border border-border"}`}>
              {done}/{tasks.length}
            </span>
          </div>
          {allDone && <span className="text-xs text-success font-medium">All done ✓</span>}
        </div>

        <div className="divide-y divide-border">
          {tasks.length === 0 && (
            <p className="px-5 py-4 text-sm text-text-muted">No {session} tasks.</p>
          )}
          {tasks.map((task) => {
            const key = checkedKey(today, session, task.id);
            const checked = !!checkedState[key];
            const feedItem = task.feedItemId ? feedItems.find((f) => f.id === task.feedItemId) : null;

            return (
              <div
                key={task.id}
                className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-surface-sunken transition-colors ${checked ? "opacity-60" : ""}`}
                onClick={() => toggle(task)}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${checked ? "bg-success border-success" : "border-border-strong"}`}>
                  {checked && <span className="text-white text-xs font-bold">✓</span>}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${checked ? "line-through text-text-muted" : "text-text-primary"}`}>
                    {task.label}
                  </span>
                  {feedItem && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {task.scoops} scoop{task.scoops !== 1 ? "s" : ""} · {((task.scoops ?? 0) * feedItem.scoopSize).toFixed(2)} {feedItem.unit} of {feedItem.name}
                    </p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="text-text-muted hover:text-danger text-xs px-2 py-1 rounded hover:bg-danger-subtle transition-colors shrink-0"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Checklist</h2>
          <p className="text-xs text-text-muted">{DateTime.now().toFormat("EEEE, d MMMM yyyy")}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-btn hover:bg-accent-hover transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Add task form */}
      {showForm && (
        <form onSubmit={addTask} className="bg-surface-raised rounded-card border border-border p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="col-span-2 border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
              placeholder="Task label" value={taskForm.label}
              onChange={(e) => setTaskForm((p) => ({ ...p, label: e.target.value }))} required autoFocus
            />
            <div className="flex gap-2">
              {(["AM", "PM"] as Session[]).map((s) => (
                <button key={s} type="button"
                  onClick={() => setTaskForm((p) => ({ ...p, session: s }))}
                  className={["flex-1 py-1.5 rounded-btn text-sm font-medium border transition-colors",
                    taskForm.session === s ? "bg-accent text-white border-accent" : "bg-surface border-border text-text-secondary hover:border-border-strong"
                  ].join(" ")}
                >{s}</button>
              ))}
            </div>
            <select
              className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
              value={taskForm.feedItemId} onChange={(e) => setTaskForm((p) => ({ ...p, feedItemId: e.target.value }))}
            >
              <option value="">No feed item</option>
              {feedItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          {taskForm.feedItemId && (
            <input
              type="number" min="0.5" step="0.5"
              placeholder="Number of scoops"
              className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
              value={taskForm.scoops} onChange={(e) => setTaskForm((p) => ({ ...p, scoops: e.target.value }))}
            />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover">
              Add Task
            </button>
          </div>
        </form>
      )}

      <SessionBlock session="AM" tasks={amTasks} />
      <SessionBlock session="PM" tasks={pmTasks} />
    </div>
  );
}
