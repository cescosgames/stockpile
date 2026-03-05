import { useState, useEffect } from "react";
import type { Animal, FeedItem, FeedingTask, WeeklyTask, Note, CheckedState, Settings } from "../types";

const STORE_VERSION = "v12";

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
    id: "a1", name: "Bessie", type: "Cow", health: "Good", sex: "Female", birthday: "2021-04-10",
    notes: "Lead dairy cow. Highest producer in the herd.",
    healthLog: [
      { date: "2026-01-10", status: "Fair", note: "Slight limp — kept under observation" },
      { date: "2026-01-18", status: "Good", note: "Fully recovered" },
    ],
    vaccineLog: [
      { id: "v1", date: "2025-09-01", vaccine: "FMD", note: "Annual" },
      { id: "v2", date: "2026-03-01", vaccine: "Bovine Respiratory", note: "" },
    ],
  },
  {
    id: "a2", name: "Rosie", type: "Cow", health: "Fair", sex: "Female", birthday: "2020-06-22",
    notes: "Reduced appetite this week. Monitoring closely.",
    healthLog: [
      { date: "2026-02-15", status: "Good", note: "" },
      { date: "2026-03-03", status: "Fair", note: "Reduced appetite, keeping an eye on her" },
    ],
    vaccineLog: [
      { id: "v3", date: "2025-09-01", vaccine: "FMD", note: "Annual" },
    ],
  },
  {
    id: "a3", name: "Daisy", type: "Cow", health: "Good", sex: "Female", birthday: "2022-02-14",
    notes: "",
    healthLog: [{ date: TODAY, status: "Good", note: "" }],
    vaccineLog: [],
  },
  {
    id: "a4", name: "Hen #1", type: "Chicken", health: "Good", sex: "Female", birthday: "2023-08-01",
    notes: "",
    healthLog: [{ date: TODAY, status: "Good", note: "" }],
    vaccineLog: [{ id: "v4", date: "2025-11-10", vaccine: "Newcastle Disease", note: "Flock treatment" }],
  },
  {
    id: "a5", name: "Hen #2", type: "Chicken", health: "Good", sex: "Female", birthday: "2023-08-01",
    notes: "",
    healthLog: [{ date: TODAY, status: "Good", note: "" }],
    vaccineLog: [],
  },
  {
    id: "a6", name: "Hen #3", type: "Chicken", health: "Poor", sex: "Female", birthday: "2023-08-01",
    notes: "Lethargic and not eating. Isolated from the flock.",
    healthLog: [
      { date: "2026-03-04", status: "Good", note: "" },
      { date: TODAY, status: "Poor", note: "Lethargic and not eating — isolated from flock" },
    ],
    vaccineLog: [],
  },
  {
    id: "a7", name: "Billy", type: "Goat", health: "Good", sex: "Male", birthday: "2023-03-15",
    notes: "",
    healthLog: [{ date: TODAY, status: "Good", note: "" }],
    vaccineLog: [{ id: "v5", date: "2026-01-20", vaccine: "CDT", note: "Annual booster" }],
  },
  {
    id: "a8", name: "Nanny", type: "Goat", health: "Good", sex: "Female", birthday: "2022-11-05",
    notes: "Expecting kids in April.",
    healthLog: [{ date: TODAY, status: "Good", note: "" }],
    vaccineLog: [{ id: "v6", date: "2026-01-20", vaccine: "CDT", note: "Annual booster" }],
  },
];

const SEED_FEED: FeedItem[] = [
  { id: "f1", name: "Dairy Pellets", unit: "lbs", qty: 200, minQty: 50,  maxQty: 500, scoopSize: 2   },
  { id: "f2", name: "Chicken Feed",  unit: "lbs", qty: 12,  minQty: 15,  maxQty: 100, scoopSize: 0.5 }, // intentionally low to demo warning
  { id: "f3", name: "Hay",           unit: "lbs", qty: 350, minQty: 100, maxQty: 600, scoopSize: 10  },
  { id: "f4", name: "Goat Mix",      unit: "kg",  qty: 40,  minQty: 10,  maxQty: 80,  scoopSize: 1   },
];

const SEED_NOTES: Note[] = [
  { id: "n1", date: "2026-03-01", text: "Ordered extra Chicken Feed — should arrive by end of week. Running low." },
  { id: "n2", date: "2026-03-04", text: "Hen #3 isolated from flock. Vet visit scheduled for Friday morning." },
  { id: "n3", date: TODAY, text: "Nanny (goat) expecting kids in April. Set up separate pen by end of month." },
];

const SEED_WEEKLY: WeeklyTask[] = [
  { id: "w1", label: "Replace bedding" },
  { id: "w2", label: "Deep clean water troughs" },
  { id: "w3", label: "Check fencing for damage" },
  { id: "w4", label: "Scrub feed buckets" },
];

const SEED_TASKS: FeedingTask[] = [
  { id: "t1",  label: "Feed Dairy Cows", session: "AM", feedItemId: "f1", scoops: 2, perAnimal: true, animalType: "Cow" },
  { id: "t2",  label: "Feed Dairy Cows", session: "PM", feedItemId: "f1", scoops: 2, perAnimal: true, animalType: "Cow" },
  { id: "t3",  label: "Morning Hay",     session: "AM", feedItemId: "f3", scoops: 3 },
  { id: "t4",  label: "Feed Chickens",   session: "AM", feedItemId: "f2", scoops: 2 },
  { id: "t5",  label: "Feed Chickens",   session: "PM", feedItemId: "f2", scoops: 2 },
  { id: "t6",  label: "Feed Goats",      session: "AM", feedItemId: "f4", scoops: 2 },
  { id: "t7",  label: "Feed Goats",      session: "PM", feedItemId: "f4", scoops: 2 },
  { id: "t8",  label: "Collect Eggs",    session: "AM" },
  { id: "t9",  label: "Check Water",     session: "AM" },
  { id: "t10", label: "Check Water",     session: "PM" },
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
  const [weeklyTasks, setWeeklyTasksState] = useState<WeeklyTask[]>(() =>
    isElectron ? SEED_WEEKLY : load("weeklyTasks", SEED_WEEKLY)
  );
  const [notes, setNotesState] = useState<Note[]>(() =>
    isElectron ? SEED_NOTES : load("notes", SEED_NOTES)
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
        api.get("weeklyTasks"),
        api.get("notes"),
        api.get("checkedState"),
        api.get("settings"),
      ]).then(([a, f, t, w, n, c, s]) => {
        if (a) setAnimalsState(a as Animal[]);
        if (f) setFeedItemsState(f as FeedItem[]);
        if (t) setFeedingTasksState(t as FeedingTask[]);
        if (w) setWeeklyTasksState(w as WeeklyTask[]);
        if (n) setNotesState(n as Note[]);
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
      const t = setTimeout(() => window.electronAPI!.set("weeklyTasks", weeklyTasks), DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    save("weeklyTasks", weeklyTasks);
  }, [weeklyTasks, electronReady]);

  useEffect(() => {
    if (!electronReady) return;
    if (isElectron) {
      const t = setTimeout(() => window.electronAPI!.set("notes", notes), DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    save("notes", notes);
  }, [notes, electronReady]);

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
  function setWeeklyTasks(next: WeeklyTask[]) { setWeeklyTasksState(next); }
  function setNotes(next: Note[]) { setNotesState(next); }
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
    setWeeklyTasksState([]);
    setCheckedStateState({});
  }

  return { animals, feedItems, feedingTasks, weeklyTasks, notes, checkedState, settings, setAnimals, setFeedItems, setFeedingTasks, setWeeklyTasks, setNotes, setChecked, setSettings, wipeData };
}
