import { useState, useEffect } from "react";
import type { Animal, FeedItem, FeedingTask, CheckedState, Settings } from "../types";

const STORE_VERSION = "v7";

// True when running inside the Electron wrapper — window.electronAPI is
// injected by electron/preload.cjs via Electron's contextBridge
const isElectron = typeof window !== "undefined" && typeof window.electronAPI !== "undefined";

// --- localStorage helpers (browser / PWA only) ---

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

// On browser load: clear stale data if the store version has changed
if (!isElectron) {
  if (localStorage.getItem("storeVersion") !== STORE_VERSION) {
    ["animals", "feedItems", "feedingTasks", "checkedState", "settings"].forEach((k) =>
      localStorage.removeItem(k)
    );
    localStorage.setItem("storeVersion", STORE_VERSION);
  }
}

// --- Seed data ---

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
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const pruned: CheckedState = {};
  for (const key in state) {
    if (key.slice(0, 10) >= cutoffStr) pruned[key] = state[key];
  }
  return pruned;
}

const DEFAULT_SETTINGS: Settings = {
  farmName: "Your Farm",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

// --- Hook ---

export function useStore() {
  // Browser: initialise synchronously from localStorage
  // Electron: start with seed data; real data loads async below
  const [animals, setAnimalsState] = useState<Animal[]>(() =>
    isElectron ? SEED_ANIMALS : load("animals", SEED_ANIMALS)
  );
  const [feedItems, setFeedItemsState] = useState<FeedItem[]>(() =>
    isElectron ? SEED_FEED : load("feedItems", SEED_FEED)
  );
  const [feedingTasks, setFeedingTasksState] = useState<FeedingTask[]>(() =>
    isElectron ? SEED_TASKS : load("feedingTasks", SEED_TASKS)
  );
  const [checkedState, setCheckedStateState] = useState<CheckedState>(() =>
    isElectron ? {} : pruneCheckedState(load("checkedState", {}))
  );
  const [settings, setSettingsState] = useState<Settings>(() =>
    isElectron ? DEFAULT_SETTINGS : load("settings", DEFAULT_SETTINGS)
  );

  // electronReady: false until the async load from electron-store completes.
  // Save effects check this flag — prevents overwriting real data with seed
  // data on the first render before the load comes back.
  const [electronReady, setElectronReady] = useState(!isElectron);

  // Electron: load persisted data on mount
  useEffect(() => {
    if (!isElectron) return;
    const api = window.electronAPI!;

    api.get("storeVersion").then((version) => {
      if (version !== STORE_VERSION) {
        // Fresh install or version bump — seed data is already in state.
        // Just record the version and let the save effects persist the seeds.
        api.set("storeVersion", STORE_VERSION);
        setElectronReady(true);
        return;
      }

      // Load all keys in parallel, then hydrate state
      Promise.all([
        api.get("animals"),
        api.get("feedItems"),
        api.get("feedingTasks"),
        api.get("checkedState"),
        api.get("settings"),
      ]).then(([a, f, t, c, s]) => {
        if (a) setAnimalsState(a as Animal[]);
        if (f) setFeedItemsState(f as FeedItem[]);
        if (t) setFeedingTasksState(t as FeedingTask[]);
        if (c) setCheckedStateState(pruneCheckedState(c as CheckedState));
        if (s) setSettingsState(s as Settings);
        setElectronReady(true);
      });
    });
  }, []);

  // Save effects — run whenever state changes, but only after initial load.
  // In Electron, writes are debounced 400ms so rapid keystrokes produce one IPC
  // write at the end rather than one per character. The effect cleanup cancels
  // any pending timer if state changes again before it fires.
  const DEBOUNCE_MS = 400;

  useEffect(() => {
    if (!electronReady) return;
    if (isElectron) {
      const t = setTimeout(() => window.electronAPI!.set("animals", animals), DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    save("animals", animals);
  }, [animals, electronReady]);

  useEffect(() => {
    if (!electronReady) return;
    if (isElectron) {
      const t = setTimeout(() => window.electronAPI!.set("feedItems", feedItems), DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    save("feedItems", feedItems);
  }, [feedItems, electronReady]);

  useEffect(() => {
    if (!electronReady) return;
    if (isElectron) {
      const t = setTimeout(() => window.electronAPI!.set("feedingTasks", feedingTasks), DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    save("feedingTasks", feedingTasks);
  }, [feedingTasks, electronReady]);

  useEffect(() => {
    if (!electronReady) return;
    if (isElectron) {
      const t = setTimeout(() => window.electronAPI!.set("checkedState", checkedState), DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    save("checkedState", checkedState);
  }, [checkedState, electronReady]);

  useEffect(() => {
    if (!electronReady) return;
    if (isElectron) {
      const t = setTimeout(() => window.electronAPI!.set("settings", settings), DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    save("settings", settings);
  }, [settings, electronReady]);

  function setAnimals(next: Animal[]) { setAnimalsState(next); }
  function setFeedItems(next: FeedItem[]) { setFeedItemsState(next); }
  function setFeedingTasks(next: FeedingTask[]) { setFeedingTasksState(next); }
  function setSettings(next: Settings) { setSettingsState(next); }

  function setChecked(key: string, value: boolean, task?: FeedingTask) {
    setCheckedStateState((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });

    if (task?.feedItemId && task.scoops) {
      setFeedItemsState((prev) =>
        prev.map((f) => {
          if (f.id !== task.feedItemId) return f;
          const delta = task.scoops! * f.scoopSize;
          return { ...f, qty: Math.max(0, f.qty + (value ? -delta : delta)) };
        })
      );
    }
  }

  function wipeData() {
    setAnimalsState([]);
    setFeedItemsState([]);
    setFeedingTasksState([]);
    setCheckedStateState({});
  }

  return { animals, feedItems, feedingTasks, checkedState, settings, setAnimals, setFeedItems, setFeedingTasks, setChecked, setSettings, wipeData };
}
