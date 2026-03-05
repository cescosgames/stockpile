import { useState, useEffect } from "react";
import type { Animal, FeedItem, FeedingTask, CheckedState, Settings } from "../types";

const STORE_VERSION = "v5"; // bump when data shape changes to clear stale localStorage

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

const SEED_ANIMALS: Animal[] = [
  { id: "a1", name: "Bessie", type: "Cow",     health: "Good", sex: "Female", birthday: "2022-02-10", notes: "",                         healthLog: [], vaccineLog: [{ id: "v1", date: "2025-09-10", vaccine: "BVD",  note: "Annual booster" }] },
  { id: "a2", name: "Daisy",  type: "Cow",     health: "Good", sex: "Female", birthday: "2023-01-22", notes: "",                         healthLog: [], vaccineLog: [{ id: "v2", date: "2025-09-10", vaccine: "BVD",  note: "Annual booster" }] },
  { id: "a3", name: "Bruno",  type: "Cow",     health: "Good", sex: "Male",   birthday: "2020-11-05", notes: "",                         healthLog: [], vaccineLog: [] },
  { id: "a4", name: "Hen #1", type: "Chicken", health: "Good", sex: "Female", birthday: "2025-02-01", notes: "",                         healthLog: [], vaccineLog: [] },
  { id: "a5", name: "Hen #2", type: "Chicken", health: "Good", sex: "Female", birthday: "2025-02-01", notes: "",                         healthLog: [], vaccineLog: [] },
  { id: "a6", name: "Hen #3", type: "Chicken", health: "Fair", sex: "Female", birthday: "2025-02-01", notes: "Reduced laying this week", healthLog: [], vaccineLog: [] },
  { id: "a7", name: "Hen #4", type: "Chicken", health: "Good", sex: "Female", birthday: "2025-02-01", notes: "",                         healthLog: [], vaccineLog: [] },
  { id: "a8", name: "Hamish", type: "Pig",     health: "Fair", sex: "Male",   birthday: "2024-01-15", notes: "Slight limp on right leg", healthLog: [], vaccineLog: [{ id: "v3", date: "2025-06-01", vaccine: "PRRS", note: "" }] },
  { id: "a9", name: "Rosie",  type: "Pig",     health: "Good", sex: "Female", birthday: "2024-09-03", notes: "",                         healthLog: [], vaccineLog: [] },
];

const SEED_FEED: FeedItem[] = [
  { id: "f1", name: "Hay",           unit: "kg",  qty: 120, minQty: 20,  scoopSize: 2    },
  { id: "f2", name: "Corn Feed",     unit: "kg",  qty: 4,   minQty: 15,  scoopSize: 0.5  },
  { id: "f3", name: "Layer Pellets", unit: "kg",  qty: 8,   minQty: 5,   scoopSize: 0.25 },
  { id: "f4", name: "Pig Meal",      unit: "kg",  qty: 3,   minQty: 10,  scoopSize: 0.5  },
];

const SEED_TASKS: FeedingTask[] = [
  { id: "t1", label: "Feed animals", session: "AM", feedItemId: "f1", scoops: 1 },
  { id: "t2", label: "Feed animals", session: "PM", feedItemId: "f3", scoops: 1 },
];

const DEFAULT_SETTINGS: Settings = {
  farmName: "My Farm",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function useStore() {
  const [animals, setAnimalsState] = useState<Animal[]>(() => load("animals", SEED_ANIMALS));
  const [feedItems, setFeedItemsState] = useState<FeedItem[]>(() => load("feedItems", SEED_FEED));
  const [feedingTasks, setFeedingTasksState] = useState<FeedingTask[]>(() => load("feedingTasks", SEED_TASKS));
  const [checkedState, setCheckedStateState] = useState<CheckedState>(() => load("checkedState", {}));
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
