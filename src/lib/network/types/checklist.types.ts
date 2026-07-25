// Mirrors kgr-backend interfaces/checklist.interface.ts.

export type ChecklistKind = "security" | "admin";
export type ChecklistSession = "morning" | "evening";

export interface ChecklistEntry {
  _id: string;
  date: string;
  kind: ChecklistKind;
  busName: string;
  session: ChecklistSession;
  batteryName: string;
  trips: number;
  addedBy: string;
  addedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistTotals {
  morningTrips: number;
  eveningTrips: number;
  totalTrips: number;
  morningBuses: number;
  eveningBuses: number;
}

export interface ChecklistData {
  date: string;
  kind: ChecklistKind;
  entries: ChecklistEntry[];
  totals: ChecklistTotals;
}

export interface CreateChecklistEntryPayload {
  kind: ChecklistKind;
  busName: string;
  session: ChecklistSession;
  batteryName: string;
  trips: number;
}

export interface ChecklistDayRow {
  date: string;
  kind: ChecklistKind;
  buses: number;
  morningTrips: number;
  eveningTrips: number;
  totalTrips: number;
}
