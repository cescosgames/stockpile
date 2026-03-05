import { useState, useEffect } from "react";
import type { Animal, FeedItem, FeedingTask, CheckedState, Settings } from "../types";

const STORE_VERSION = "v7"; // bump when data shape changes to clear stale localStorage

(function clearIfStale() {
  if (localStorage.getItem("storeVersion") !== STORE_VERSION) {
    ["animals", "feedItems", "feedingTasks", "checkedState"].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem("storeVersion", STORE_VERSION);
  }
})();

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const TODAY = new Date().toISOString().split("T")[0];

const SEED_ANIMALS: Animal[] = [
  {
    id: "a1",
    name: "Example Animal",
    type: "Example",
    health: "Good",
    sex: "Female",
    birthday: TODAY,
    notes: "Note goes here.",
    healthLog: [],
    vaccineLog: [{ id: "v1", date: TODAY, vaccine: "Example Vaccine", note: "Example note" }],
  },
];

const SEED_FEED: FeedItem[] = [
  { id: "f1", name: "Example Pellets", unit: "lbs", qty: 5, minQty: 15, scoopSize: 0.5 },
];

const SEED_TASKS: FeedingTask[] = [
  { id: "t1", label: "Feed animals", session: "AM", feedItemId: "f1", scoops: 1 },
  { id: "t2", label: "Feed animals", session: "PM", feedItemId: "f1", scoops: 1 },
];

const CHECKLIST_RETENTION_DAYS = 90;

function pruneCheckedState(state: CheckedState): CheckedState {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CHECKLIST_RETENTION_DAYS);
  const cutoffStr = cutoff.toISOString().split("T")[0]; // "YYYY-MM-DD"

  const pruned: CheckedState = {};
  for (const key in state) {
    const date = key.slice(0, 10); // keys are `${date}-${session}-${taskId}`
    if (date >= cutoffStr) pruned[key] = state[key];
  }
  return pruned;
}

const DEFAULT_SETTINGS: Settings = {
  farmName: "Your Farm",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function useStore() {
  const [animals, setAnimalsState] = useState<Animal[]>(() => load("animals", SEED_ANIMALS));
  const [feedItems, setFeedItemsState] = useState<FeedItem[]>(() => load("feedItems", SEED_FEED));
  const [feedingTasks, setFeedingTasksState] = useState<FeedingTask[]>(() => load("feedingTasks", SEED_TASKS));
  const [checkedState, setCheckedStateState] = useState<CheckedState>(() => pruneCheckedState(load("checkedState", {})));
  const [settings, setSettingsState] = useState<Settings>(() => load("settings", DEFAULT_SETTINGS));

  useEffect(() => { save("animals", animals); }, [animals]);
  useEffect(() => { save("feedItems", feedItems); }, [feedItems]);
  useEffect(() => { save("feedingTasks", feedingTasks); }, [feedingTasks]);
  useEffect(() => { save("checkedState", checkedState); }, [checkedState]);
  useEffect(() => { save("settings", settings); }, [settings]);

  function setAnimals(next: Animal[]) { setAnimalsState(next); }
  function setFeedItems(next: FeedItem[]) { setFeedItemsState(next); }
  function setFeedingTasks(next: FeedingTask[]) { setFeedingTasksState(next); }
  function setSettings(next: Settings) { setSettingsState(next); }

  function setChecked(key: string, value: boolean, task?: FeedingTask) {
    // Guard: skip if value isn't actually changing
    setCheckedStateState((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });

    if (task?.feedItemId && task.scoops) {
      setFeedItemsState((prev) => prev.map((f) => {
        if (f.id !== task.feedItemId) return f;
        const delta = task.scoops! * f.scoopSize;
        return { ...f, qty: Math.max(0, f.qty + (value ? -delta : delta)) };
      }));
    }
  }

  return { animals, feedItems, feedingTasks, checkedState, settings, setAnimals, setFeedItems, setFeedingTasks, setChecked, setSettings };
}
