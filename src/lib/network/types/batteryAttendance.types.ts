// Mirrors kgr-backend interfaces/batteryAttendance.interface.ts.
// Attendance is a submitted form like the battery exit form: one user
// walks the fleet, marks each pack, and saves the whole thing as one
// numbered log. Many users may each submit their own log per day.
import type { BatteryLocation, BatterySighting } from "./battery.types";

export type AttendanceStatus = "seen" | "missing";
export type AttendanceTimeOfDay = "morning" | "afternoon" | "night";

// where the closing sheets last put a pack to bed (a hint while marking)
export interface AttendanceClosingHint {
  location: BatteryLocation;
  date: string;
  sheet: string;
}

// one fleet row on the blank sheet for a new log
export interface AttendanceFleetRow {
  batteryId: string;
  batteryCode: string;
  batteryStatus: string;
  lastSeen: BatterySighting | null;
  closing: AttendanceClosingHint | null;
}

export interface AttendanceFleetData {
  date: string;
  rows: AttendanceFleetRow[];
}

export interface AttendanceLogRow {
  // filled by the system from a checklist/receipt sighting, not typed
  onBus?: string;
  auto?: boolean;
  battery: string;
  batteryCode: string;
  status: AttendanceStatus;
  timeOfDay: AttendanceTimeOfDay;
  location?: BatteryLocation;
  lastSeen?: string;
}

export interface AttendanceTotals {
  fleet: number;
  seen: number;
  missing: number;
  unmarked: number;
  auto?: number; // of the seen, how many the system filled in
}

export interface AttendanceLog {
  _id: string;
  logId: number;
  date: string;
  rows?: AttendanceLogRow[]; // absent in the list view
  // fleet packs the submitter never marked (detail view only)
  unmarked?: { battery: string; batteryCode: string }[];
  totals: AttendanceTotals;
  submittedBy: string;
  submittedByName: string;
  submittedByRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceLogRow {
  batteryId: string;
  status: AttendanceStatus;
  timeOfDay: AttendanceTimeOfDay;
  location?: BatteryLocation;
  lastSeen?: string;
}

export interface CreateAttendanceLogPayload {
  rows: CreateAttendanceLogRow[];
}

// COMPARE (admin): all of a date's logs laid side by side per battery

export type AttendanceCompareStatus =
  | "match"
  | "mismatch"
  | "partial"
  | "unmarked";

export interface CompareVerdict {
  onBus?: string;
  auto?: boolean;
  status: AttendanceStatus;
  timeOfDay: AttendanceTimeOfDay;
  location?: BatteryLocation;
  lastSeen?: string;
}

export interface CompareLogMeta {
  _id: string;
  logId: number;
  submittedByName: string;
  submittedAt: string;
}

export interface AttendanceCompareRow {
  batteryId: string;
  batteryCode: string;
  lastSeen: BatterySighting | null;
  verdicts: (CompareVerdict | null)[]; // aligned with logs order
  status: AttendanceCompareStatus;
}

export interface AttendanceCompareTotals {
  fleet: number;
  matched: number;
  mismatched: number;
  partial: number;
  unmarked: number;
}

export interface AttendanceCompareData {
  date: string;
  logs: CompareLogMeta[];
  rows: AttendanceCompareRow[];
  totals: AttendanceCompareTotals;
}
