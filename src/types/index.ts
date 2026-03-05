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
  unit: string;
  qty: number;
  minQty: number;
};

export type Session = "AM" | "PM";

export type FeedingTask = {
  id: string;
  label: string;
  session: Session;
};

export type CheckedState = Record<string, boolean>;

export type Tab = "dashboard" | "animals" | "feed" | "checklist";
