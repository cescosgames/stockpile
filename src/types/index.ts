export type HealthStatus = "Good" | "Fair" | "Poor";

export type Sex = "Male" | "Female" | "Unknown";

export type VaccineEntry = {
  id: string;
  date: string;
  vaccine: string;
  note: string;
};

export type Animal = {
  id: string;
  name: string;
  type: string;      // "Cow" | "Chicken" | "Pig" | free text
  health: HealthStatus;
  sex: Sex;
  birthday: string;  // ISO date string, e.g. "2022-03-05"
  notes: string;
  healthLog: { date: string; status: HealthStatus; note: string }[];
  vaccineLog: VaccineEntry[];
};

export type FeedItem = {
  id: string;
  name: string;
  unit: "kg" | "lbs";
  qty: number;       // current stock in unit
  minQty: number;    // low-stock threshold in unit
  scoopSize: number; // weight per scoop in unit
};

export type Session = "AM" | "PM";

export type FeedingTask = {
  id: string;
  label: string;
  session: Session;
  feedItemId?: string; // undefined = no feed consumed (e.g. "collect eggs")
  scoops?: number;
  perAnimal?: boolean;  // if true, renders one checkbox per animal of animalType
  animalType?: string;  // e.g. "Cow" — filters animals list for per-animal tasks
};

export type CheckedState = Record<string, boolean>;

export type Settings = {
  farmName: string;
  timezone: string;
};

export type Tab = "dashboard" | "animals" | "feed" | "checklist";

// Exposed by electron/preload.cjs via contextBridge — only present when running in Electron
declare global {
  interface Window {
    electronAPI?: {
      get: (key: string) => Promise<unknown>;
      set: (key: string, value: unknown) => Promise<void>;
    };
  }
}
