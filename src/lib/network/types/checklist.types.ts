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

// one side of a compared row: what one list wrote for a bus and session
export interface CompareSide {
  batteryName: string;
  trips: number;
  addedByName: string;
  createdAt: string;
}

// green: both lists agree; red: both wrote it but differently;
// yellow: only one list has it
export type CompareStatus =
  "match" | "mismatch" | "security_only" | "staff_only";

export interface CompareRow {
  busName: string;
  session: ChecklistSession;
  security: CompareSide | null;
  staff: CompareSide | null;
  status: CompareStatus;
}

export interface ChecklistCompareTotals {
  matched: number;
  mismatched: number;
  securityOnly: number;
  staffOnly: number;
  securityTrips: number;
  staffTrips: number;
}

export interface ChecklistCompareData {
  date: string;
  rows: CompareRow[];
  totals: ChecklistCompareTotals;
}

// the checklists against the day's receipts, per bus
export type ReceiptsCompareStatus =
  | "match"
  | "underpaid"
  | "no_receipt"
  | "not_on_checklist"
  | "battery_differs"
  | "fewer_trips";

export interface ReceiptsCompareSide {
  batteries: string[];
  trips: number;
  sessions: string[];
  addedByNames: string[];
  batteryOk: boolean;
  tripsVerdict: "ok" | "more" | "fewer";
}

export interface ReceiptsCompareReceipt {
  bills: { billId: number; batteryName: string; trips: number }[];
  batteries: string[];
  trips: number;
}

export interface ReceiptsCompareRow {
  busName: string;
  security: ReceiptsCompareSide | null;
  staff: ReceiptsCompareSide | null;
  receipt: ReceiptsCompareReceipt | null;
  status: ReceiptsCompareStatus;
  note: string;
}

export interface ReceiptsCompareTotals {
  matched: number;
  underpaid: number;
  noReceipt: number;
  notOnChecklist: number;
  batteryDiffers: number;
  fewerTrips: number;
  receiptTrips: number;
  securityTrips: number;
  staffTrips: number;
}

export interface ChecklistReceiptsCompareData {
  date: string;
  rows: ReceiptsCompareRow[];
  totals: ReceiptsCompareTotals;
}
