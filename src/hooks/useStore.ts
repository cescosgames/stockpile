import { useState, useEffect, useRef } from "react";
import PocketBase from "pocketbase";
import type { RecordModel } from "pocketbase";
import type { Animal, FeedItem, FeedingTask, WeeklyTask, Note, CheckedState, Settings } from "../types";

const STORE_VERSION = "v13"; // bumped: Settings extended with syncMode + pbUrl

// True when running inside the Electron wrapper — window.electronAPI is
// injected by electron/preload.cjs via Electron's contextBridge
const isElectron = typeof window !== "undefined" && typeof window.electronAPI !== "undefined";

// --- localStorage helpers (browser / PWA / PB cache) ---

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
    ["animals", "feedItems", "feedingTasks", "weeklyTasks", "notes", "checkedState", "settings"].forEach((k) =>
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
  { id: "f2", name: "Chicken Feed",  unit: "lbs", qty: 12,  minQty: 15,  maxQty: 100, scoopSize: 0.5 },
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
  syncMode: "local",
  pbUrl: "",
};

// --- PocketBase setup ---
// Read sync config synchronously from localStorage at module load time.
// isPB is a module-level constant — sync mode changes take effect after reload.

function getInitialSyncConfig(): { syncMode: "local" | "network"; pbUrl: string } {
  if (isElectron) return { syncMode: "local", pbUrl: "" };
  try {
    const s = load<Settings>("settings", DEFAULT_SETTINGS);
    return { syncMode: s.syncMode ?? "local", pbUrl: s.pbUrl ?? "" };
  } catch {
    return { syncMode: "local", pbUrl: "" };
  }
}

const { syncMode: INITIAL_SYNC_MODE, pbUrl: INITIAL_PB_URL } = getInitialSyncConfig();
const isPB = INITIAL_SYNC_MODE === "network" && !!INITIAL_PB_URL;

// --- PocketBase record mappers ---

function pbToAnimal(r: RecordModel): Animal {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    health: r.health as Animal["health"],
    sex: r.sex as Animal["sex"],
    birthday: r.birthday ?? "",
    notes: r.notes ?? "",
    healthLog: r.healthLog ?? [],
    vaccineLog: r.vaccineLog ?? [],
  };
}

function pbToFeedItem(r: RecordModel): FeedItem {
  return {
    id: r.id,
    name: r.name,
    unit: r.unit as FeedItem["unit"],
    qty: r.qty ?? 0,
    minQty: r.minQty ?? 0,
    maxQty: r.maxQty ?? 0,
    scoopSize: r.scoopSize ?? 0,
  };
}

function pbToFeedingTask(r: RecordModel): FeedingTask {
  return {
    id: r.id,
    label: r.label,
    session: r.session as FeedingTask["session"],
    feedItemId: r.feedItemId || undefined,
    scoops: r.scoops || undefined,
    perAnimal: r.perAnimal || undefined,
    animalType: r.animalType || undefined,
  };
}

function pbToWeeklyTask(r: RecordModel): WeeklyTask {
  return { id: r.id, label: r.label };
}

function pbToNote(r: RecordModel): Note {
  return { id: r.id, date: r.date, text: r.text };
}

function applyEvent<T extends { id: string }>(prev: T[], action: string, record: T): T[] {
  if (action === "create") return [...prev, record];
  if (action === "update") return prev.map(i => i.id === record.id ? record : i);
  if (action === "delete") return prev.filter(i => i.id !== record.id);
  return prev;
}

// --- Hook ---

export function useStore() {
  // Browser / PB: initialise from localStorage (PB will replace state once connected)
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

  const [pbOnline, setPbOnline] = useState(false);
  const pbRef = useRef<PocketBase | null>(null);
  const checkedStateRecordId = useRef<string | null>(null);
  const settingsRecordId = useRef<string | null>(null);

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
        api.set("storeVersion", STORE_VERSION);
        setElectronReady(true);
        return;
      }

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

  // PocketBase: connect on mount, load all collections, subscribe to real-time changes
  useEffect(() => {
    if (!isPB) return;

    const pb = new PocketBase(INITIAL_PB_URL);
    pbRef.current = pb;

    async function init() {
      try {
        await pb.health.check();

        const [animalRecs, feedRecs, taskRecs, weeklyRecs, noteRecs, csRecs, settingsRecs] =
          await Promise.all([
            pb.collection("animals").getFullList<RecordModel>({ sort: "created" }),
            pb.collection("feedItems").getFullList<RecordModel>({ sort: "created" }),
            pb.collection("feedingTasks").getFullList<RecordModel>({ sort: "created" }),
            pb.collection("weeklyTasks").getFullList<RecordModel>({ sort: "created" }),
            pb.collection("notes").getFullList<RecordModel>({ sort: "-date" }),
            pb.collection("checkedState").getFullList<RecordModel>(),
            pb.collection("settings").getFullList<RecordModel>(),
          ]);

        if (animalRecs.length)  setAnimalsState(animalRecs.map(pbToAnimal));
        if (feedRecs.length)    setFeedItemsState(feedRecs.map(pbToFeedItem));
        if (taskRecs.length)    setFeedingTasksState(taskRecs.map(pbToFeedingTask));
        if (weeklyRecs.length)  setWeeklyTasksState(weeklyRecs.map(pbToWeeklyTask));
        if (noteRecs.length)    setNotesState(noteRecs.map(pbToNote));

        if (csRecs.length) {
          checkedStateRecordId.current = csRecs[0].id;
          setCheckedStateState(pruneCheckedState(csRecs[0].data ?? {}));
        }

        if (settingsRecs.length) {
          settingsRecordId.current = settingsRecs[0].id;
          // Merge PB settings (farmName, timezone) with local settings (syncMode, pbUrl stay local)
          setSettingsState(prev => ({
            ...prev,
            farmName: settingsRecs[0].farmName ?? prev.farmName,
            timezone: settingsRecs[0].timezone ?? prev.timezone,
          }));
        }

        setPbOnline(true);

        // Real-time subscriptions
        pb.collection("animals").subscribe("*", ({ action, record }) =>
          setAnimalsState(prev => applyEvent(prev, action, pbToAnimal(record)))
        );
        pb.collection("feedItems").subscribe("*", ({ action, record }) =>
          setFeedItemsState(prev => applyEvent(prev, action, pbToFeedItem(record)))
        );
        pb.collection("feedingTasks").subscribe("*", ({ action, record }) =>
          setFeedingTasksState(prev => applyEvent(prev, action, pbToFeedingTask(record)))
        );
        pb.collection("weeklyTasks").subscribe("*", ({ action, record }) =>
          setWeeklyTasksState(prev => applyEvent(prev, action, pbToWeeklyTask(record)))
        );
        pb.collection("notes").subscribe("*", ({ action, record }) =>
          setNotesState(prev => applyEvent(prev, action, pbToNote(record)))
        );
        pb.collection("checkedState").subscribe("*", ({ record }) => {
          checkedStateRecordId.current = record.id;
          setCheckedStateState(pruneCheckedState(record.data ?? {}));
        });
        pb.collection("settings").subscribe("*", ({ record }) => {
          settingsRecordId.current = record.id;
          setSettingsState(prev => ({
            ...prev,
            farmName: record.farmName ?? prev.farmName,
            timezone: record.timezone ?? prev.timezone,
          }));
        });
      } catch {
        setPbOnline(false);
      }
    }

    init();

    return () => {
      ["animals", "feedItems", "feedingTasks", "weeklyTasks", "notes", "checkedState", "settings"]
        .forEach(name => pb.collection(name).unsubscribe());
    };
  }, []);

  // Save effects — write to localStorage after every state change.
  // In Electron: debounced IPC writes. In PB mode: localStorage acts as a local cache.
  // electronReady guard prevents overwriting real data with seed data before Electron load completes.
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

  // --- PocketBase sync helper ---
  // Diffs prev → next and fires create/update/delete calls against the given collection.

  async function pbSyncCollection<T extends { id: string }>(
    collectionName: string,
    prev: T[],
    next: T[]
  ): Promise<void> {
    const pb = pbRef.current!;
    const prevIds = new Set(prev.map(i => i.id));
    const nextIds = new Set(next.map(i => i.id));

    await Promise.all([
      ...next.filter(i => !prevIds.has(i.id)).map(item =>
        pb.collection(collectionName).create(item)
      ),
      ...next.filter(i => prevIds.has(i.id)).map(item => {
        const { id, ...body } = item as { id: string } & Record<string, unknown>;
        return pb.collection(collectionName).update(id, body);
      }),
      ...prev.filter(i => !nextIds.has(i.id)).map(i =>
        pb.collection(collectionName).delete(i.id)
      ),
    ]);
  }

  // --- Write functions ---

  function setAnimals(next: Animal[]) {
    if (isPB && !pbOnline) return;
    if (isPB) pbSyncCollection("animals", animals, next).catch(() => setPbOnline(false));
    setAnimalsState(next);
  }

  function setFeedItems(next: FeedItem[]) {
    if (isPB && !pbOnline) return;
    if (isPB) pbSyncCollection("feedItems", feedItems, next).catch(() => setPbOnline(false));
    setFeedItemsState(next);
  }

  function setFeedingTasks(next: FeedingTask[]) {
    if (isPB && !pbOnline) return;
    if (isPB) pbSyncCollection("feedingTasks", feedingTasks, next).catch(() => setPbOnline(false));
    setFeedingTasksState(next);
  }

  function setWeeklyTasks(next: WeeklyTask[]) {
    if (isPB && !pbOnline) return;
    if (isPB) pbSyncCollection("weeklyTasks", weeklyTasks, next).catch(() => setPbOnline(false));
    setWeeklyTasksState(next);
  }

  function setNotes(next: Note[]) {
    if (isPB && !pbOnline) return;
    if (isPB) pbSyncCollection("notes", notes, next).catch(() => setPbOnline(false));
    setNotesState(next);
  }

  function setSettings(next: Settings) {
    setSettingsState(next);
    // syncMode + pbUrl are local-only preferences — never synced to PocketBase
    if (isPB && pbOnline) {
      const pb = pbRef.current!;
      const pbData = { farmName: next.farmName, timezone: next.timezone };
      if (settingsRecordId.current) {
        pb.collection("settings").update(settingsRecordId.current, pbData)
          .catch(() => setPbOnline(false));
      } else {
        pb.collection("settings").create(pbData)
          .then(r => { settingsRecordId.current = r.id; })
          .catch(() => setPbOnline(false));
      }
    }
  }

  function setChecked(key: string, value: boolean, task?: FeedingTask) {
    if (isPB && !pbOnline) return;

    setCheckedStateState((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });

    // Sync checkedState blob to PocketBase
    if (isPB && checkedState[key] !== value) {
      const next = { ...checkedState, [key]: value };
      const pb = pbRef.current!;
      if (checkedStateRecordId.current) {
        pb.collection("checkedState").update(checkedStateRecordId.current, { data: next })
          .catch(() => setPbOnline(false));
      } else {
        pb.collection("checkedState").create({ data: next })
          .then(r => { checkedStateRecordId.current = r.id; })
          .catch(() => setPbOnline(false));
      }
    }

    if (task?.feedItemId && task.scoops) {
      setFeedItemsState((prev) =>
        prev.map((f) => {
          if (f.id !== task.feedItemId) return f;
          const delta = task.scoops! * f.scoopSize;
          const updated = { ...f, qty: Math.max(0, f.qty + (value ? -delta : delta)) };
          if (isPB && pbOnline) {
            pbRef.current!.collection("feedItems")
              .update(f.id, { qty: updated.qty })
              .catch(() => setPbOnline(false));
          }
          return updated;
        })
      );
    }
  }

  function wipeData() {
    setAnimalsState([]);
    setFeedItemsState([]);
    setFeedingTasksState([]);
    setWeeklyTasksState([]);
    setNotesState([]);
    setCheckedStateState({});
  }

  return {
    animals, feedItems, feedingTasks, weeklyTasks, notes, checkedState, settings,
    setAnimals, setFeedItems, setFeedingTasks, setWeeklyTasks, setNotes, setChecked, setSettings, wipeData,
    pbOnline,
  };
}
