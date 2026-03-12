import { useState, useEffect, useRef } from "react";
import PocketBase from "pocketbase";
import type { RecordModel } from "pocketbase";
import type { Animal, FeedItem, FeedingTask, WeeklyTask, Note, CheckedState, Settings, Contact } from "../types";

const STORE_VERSION = "v18"; // bumped: flexible units, servingUnit, location on FeedItem

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
    // Preserve sync config (pbUrl, syncMode) across version bumps — user preferences, not data
    const savedSettings = localStorage.getItem("settings");
    let preservedSyncConfig: { syncMode?: string; pbUrl?: string } = {};
    try {
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        preservedSyncConfig = { syncMode: s.syncMode, pbUrl: s.pbUrl };
      }
    } catch { /* ignore */ }

    ["animals", "feedItems", "feedingTasks", "weeklyTasks", "notes", "checkedState", "settings", "contacts"].forEach((k) =>
      localStorage.removeItem(k)
    );

    if (preservedSyncConfig.syncMode || preservedSyncConfig.pbUrl) {
      localStorage.setItem("settings", JSON.stringify({
        farmName: "Your Farm",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        syncMode: preservedSyncConfig.syncMode ?? "local",
        pbUrl: preservedSyncConfig.pbUrl ?? "",
      }));
    }

    localStorage.setItem("storeVersion", STORE_VERSION);
  }
}

// --- Seed data ---

const TODAY = new Date().toISOString().split("T")[0];

const SEED_ANIMALS: Animal[] = [
  { id: "seed0animal0001", name: "Hope",       type: "Sheep",   health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0002", name: "Faith",      type: "Sheep",   health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0003", name: "Henry",      type: "Sheep",   health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0004", name: "Little Girl", type: "Sheep",  health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0005", name: "Chicken 1",  type: "Chicken", health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0006", name: "Chicken 2",  type: "Chicken", health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0007", name: "Chicken 3",  type: "Chicken", health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0008", name: "Chicken 4",  type: "Chicken", health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0009", name: "Leaf",       type: "Goat",    health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0010", name: "Winter",     type: "Goat",    health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
  { id: "seed0animal0011", name: "Ducky",      type: "Duck",    health: "Good", sex: "Unknown", birthday: "", notes: "", healthLog: [], vaccineLog: [] },
];

const SEED_FEED: FeedItem[] = [];

const SEED_NOTES: Note[] = [];

const SEED_WEEKLY: WeeklyTask[] = [];

const SEED_TASKS: FeedingTask[] = [];

const SEED_CONTACTS: Contact[] = [];

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
    unit: r.unit ?? "",
    qty: r.qty ?? 0,
    minQty: r.minQty ?? 0,
    maxQty: r.maxQty ?? 0,
    scoopSize: r.scoopSize ?? 0,
    servingUnit: r.servingUnit ?? "",
    location: r.location ?? "",
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

function pbToContact(r: RecordModel): Contact {
  return { id: r.id, name: r.name, role: r.role ?? "", phone: r.phone ?? "", email: r.email ?? "", notes: r.notes ?? "" };
}

function applyEvent<T extends { id: string }>(prev: T[], action: string, record: T): T[] {
  if (action === "create") return prev.some(i => i.id === record.id) ? prev : [...prev, record];
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
  const [contacts, setContactsState] = useState<Contact[]>(() =>
    isElectron ? SEED_CONTACTS : load("contacts", SEED_CONTACTS)
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
        api.get("contacts"),
      ]).then(([a, f, t, w, n, c, s, co]) => {
        if (a) setAnimalsState(a as Animal[]);
        if (f) setFeedItemsState(f as FeedItem[]);
        if (t) setFeedingTasksState(t as FeedingTask[]);
        if (w) setWeeklyTasksState(w as WeeklyTask[]);
        if (n) setNotesState(n as Note[]);
        if (c) setCheckedStateState(pruneCheckedState(c as CheckedState));
        if (s) setSettingsState(s as Settings);
        if (co) setContactsState(co as Contact[]);
        setElectronReady(true);
      });
    });
  }, []);

  // PocketBase: connect on mount, load all collections, subscribe to real-time changes
  useEffect(() => {
    if (!isPB) return;

    let active = true;
    const pb = new PocketBase(INITIAL_PB_URL);
    pb.autoCancellation(false);
    pbRef.current = pb;

    async function init() {
      try {
        await pb.health.check();
        if (!active) return;

        const [animalRecs, feedRecs, taskRecs, weeklyRecs, noteRecs, csRecs, settingsRecs, contactRecs] =
          await Promise.all([
            pb.collection("animals").getFullList<RecordModel>(),
            pb.collection("feedItems").getFullList<RecordModel>(),
            pb.collection("feedingTasks").getFullList<RecordModel>(),
            pb.collection("weeklyTasks").getFullList<RecordModel>(),
            pb.collection("notes").getFullList<RecordModel>(),
            pb.collection("checkedState").getFullList<RecordModel>(),
            pb.collection("settings").getFullList<RecordModel>(),
            pb.collection("contacts").getFullList<RecordModel>().catch(() => [] as RecordModel[]),
          ]);

        // If PB is empty (first-time setup), seed it from local cache so all records exist in PB
        const localAnimals    = load<Animal[]>      ("animals",      SEED_ANIMALS);
        const localFeed       = load<FeedItem[]>    ("feedItems",    SEED_FEED);
        const localTasks      = load<FeedingTask[]> ("feedingTasks", SEED_TASKS);
        const localWeekly     = load<WeeklyTask[]>  ("weeklyTasks",  SEED_WEEKLY);
        const localNotes      = load<Note[]>        ("notes",        SEED_NOTES);
        const localChecked    = pruneCheckedState(load<CheckedState>("checkedState", {}));
        const localSettings   = load<Settings>      ("settings",     DEFAULT_SETTINGS);
        const localContacts   = load<Contact[]>     ("contacts",     SEED_CONTACTS);

        if (animalRecs.length)  setAnimalsState(animalRecs.map(pbToAnimal));
        else if (localAnimals.length) {
          await Promise.all(localAnimals.map(a => pb.collection("animals").create(a)));
          setAnimalsState(localAnimals);
        }

        if (feedRecs.length)    setFeedItemsState(feedRecs.map(pbToFeedItem));
        else if (localFeed.length) {
          await Promise.all(localFeed.map(f => pb.collection("feedItems").create(f)));
          setFeedItemsState(localFeed);
        }

        if (taskRecs.length)    setFeedingTasksState(taskRecs.map(pbToFeedingTask));
        else if (localTasks.length) {
          await Promise.all(localTasks.map(t => pb.collection("feedingTasks").create(t)));
          setFeedingTasksState(localTasks);
        }

        if (weeklyRecs.length)  setWeeklyTasksState(weeklyRecs.map(pbToWeeklyTask));
        else if (localWeekly.length) {
          await Promise.all(localWeekly.map(w => pb.collection("weeklyTasks").create(w)));
          setWeeklyTasksState(localWeekly);
        }

        if (noteRecs.length)    setNotesState(noteRecs.map(pbToNote));
        else if (localNotes.length) {
          await Promise.all(localNotes.map(n => pb.collection("notes").create(n)));
          setNotesState(localNotes);
        }

        if (contactRecs.length) setContactsState(contactRecs.map(pbToContact));
        else if (localContacts.length) {
          await Promise.all(localContacts.map(c => pb.collection("contacts").create(c).catch(() => {})));
          setContactsState(localContacts);
        }

        if (csRecs.length) {
          checkedStateRecordId.current = csRecs[0].id;
          setCheckedStateState(pruneCheckedState(csRecs[0].data ?? {}));
        } else if (Object.keys(localChecked).length) {
          const r = await pb.collection("checkedState").create({ data: localChecked });
          checkedStateRecordId.current = r.id;
          setCheckedStateState(localChecked);
        }

        if (settingsRecs.length) {
          settingsRecordId.current = settingsRecs[0].id;
          setSettingsState(prev => ({
            ...prev,
            farmName: settingsRecs[0].farmName ?? prev.farmName,
            timezone: settingsRecs[0].timezone ?? prev.timezone,
          }));
        } else {
          const r = await pb.collection("settings").create({
            farmName: localSettings.farmName,
            timezone: localSettings.timezone,
          });
          settingsRecordId.current = r.id;
        }

        setPbOnline(true);

        // Health-check interval — proactively detects offline/reconnect so the banner
        // appears before a write is attempted, and clears automatically when Pi returns.
        const HEALTH_INTERVAL_MS = 10_000;
        healthTimer = setInterval(async () => {
          try {
            await pb.health.check();
            setPbOnline(true);
          } catch {
            setPbOnline(false);
          }
        }, HEALTH_INTERVAL_MS);

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
        pb.collection("contacts").subscribe("*", ({ action, record }) =>
          setContactsState(prev => applyEvent(prev, action, pbToContact(record)))
        ).catch(() => { /* contacts collection not yet in PB — subscribe when schema is imported */ });
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
      } catch (err) {
        if (!active) return;
        setPbOnline(false);
      }
    }

    let healthTimer: ReturnType<typeof setInterval> | undefined;
    init();

    return () => {
      active = false;
      clearInterval(healthTimer);
      ["animals", "feedItems", "feedingTasks", "weeklyTasks", "notes", "contacts", "checkedState", "settings"]
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

  useEffect(() => {
    if (!electronReady) return;
    if (isElectron) {
      const t = setTimeout(() => window.electronAPI!.set("contacts", contacts), DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    save("contacts", contacts);
  }, [contacts, electronReady]);

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
    const prevMap = new Map(prev.map(i => [i.id, i]));

    await Promise.all([
      // New items
      ...next.filter(i => !prevIds.has(i.id)).map(item =>
        pb.collection(collectionName).create(item)
      ),
      // Changed items only — upsert in case the record doesn't exist in PB yet
      ...next.filter(i => prevIds.has(i.id) && JSON.stringify(i) !== JSON.stringify(prevMap.get(i.id))).map(item => {
        const { id, ...body } = item as { id: string } & Record<string, unknown>;
        return pb.collection(collectionName).update(id, body).catch((e: { status?: number }) => {
          if (e?.status === 404) return pb.collection(collectionName).create(item);
          throw e;
        });
      }),
      // Deleted items
      ...prev.filter(i => !nextIds.has(i.id)).map(i =>
        pb.collection(collectionName).delete(i.id).catch((e: { status?: number }) => {
          if (e?.status === 404) return;
          throw e;
        })
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

  function setContacts(next: Contact[]) {
    if (isPB && !pbOnline) return;
    if (isPB) pbSyncCollection("contacts", contacts, next).catch(() => { /* contacts not yet in PB */ });
    setContactsState(next);
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
    // Offline: allow local writes (localStorage) so farmhands can still check tasks.
    // On reconnect, PocketBase state overwrites local — offline checks are lost on other devices.
    // TODO (Option B): on pbOnline transition false→true, push local checkedState to PB so
    // offline checks survive and propagate to other devices after reconnect.

    setCheckedStateState((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });

    // Sync checkedState blob to PocketBase (skipped when offline)
    if (isPB && pbOnline && checkedState[key] !== value) {
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
    if (isPB && pbOnline) {
      const pb = pbRef.current!;
      const deleteAll = (collection: string, items: { id: string }[]) =>
        Promise.all(items.map(i => pb.collection(collection).delete(i.id).catch(() => {})));
      deleteAll("animals", animals);
      deleteAll("feedItems", feedItems);
      deleteAll("feedingTasks", feedingTasks);
      deleteAll("weeklyTasks", weeklyTasks);
      deleteAll("notes", notes);
      deleteAll("contacts", contacts);
      if (checkedStateRecordId.current) {
        pb.collection("checkedState").delete(checkedStateRecordId.current).catch(() => {});
        checkedStateRecordId.current = null;
      }
    }
    setAnimalsState([]);
    setFeedItemsState([]);
    setFeedingTasksState([]);
    setWeeklyTasksState([]);
    setNotesState([]);
    setCheckedStateState({});
    setContactsState([]);
    // Remove storeVersion so the next page load triggers a full re-seed from SEED_*
    if (!isElectron) localStorage.removeItem("storeVersion");
  }

  return {
    animals, feedItems, feedingTasks, weeklyTasks, notes, checkedState, settings, contacts,
    setAnimals, setFeedItems, setFeedingTasks, setWeeklyTasks, setNotes, setChecked, setSettings, setContacts, wipeData,
    pbOnline,
  };
}
