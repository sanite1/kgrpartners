// Mirrors kgr-backend interfaces/batteryAttendance.interface.ts. The
// paper "Battery Attendance" sheet: three times a day the registered
// fleet is called and every pack is seen somewhere or missing.
import type { BatteryLocation, BatterySighting } from "./battery.types";

export type AttendanceSession = "morning" | "afternoon" | "night";
export type AttendanceStatus = "seen" | "missing";

// three independent registers kept by three different sets of eyes;
// the admin compares them
export type AttendanceRegister = "manager" | "staff" | "storekeeper";

export interface AttendanceMark {
  _id: string;
  date: string;
  session: AttendanceSession;
  register: AttendanceRegister;
  battery: string;
  batteryCode: string;
  status: AttendanceStatus;
  location?: BatteryLocation;
  lastSeen: string;
  markedBy: string;
  markedByName: string;
  createdAt: string;
  updatedAt: string;
}

// where the closing sheets last put the pack to bed (a suggestion)
export interface AttendanceClosingHint {
  location: BatteryLocation;
  date: string;
  sheet: string; // main | muhd_kamila | main_yard | ubs
}

// one fleet pack with its verdict for the session (null = unmarked)
export interface AttendanceRow {
  batteryId: string;
  batteryCode: string;
  batteryStatus: string;
  lastSeen: BatterySighting | null;
  closing: AttendanceClosingHint | null;
  mark: AttendanceMark | null;
}

export interface AttendanceTotals {
  fleet: number;
  seen: number;
  missing: number;
  unmarked: number;
}

export interface AttendanceData {
  date: string;
  session: AttendanceSession;
  register: AttendanceRegister;
  rows: AttendanceRow[];
  totals: AttendanceTotals;
}

export interface MarkAttendancePayload {
  batteryId: string;
  session: AttendanceSession;
  register: AttendanceRegister;
  status: AttendanceStatus;
  location?: BatteryLocation;
  lastSeen?: string;
}

export interface AttendanceDayRow {
  date: string;
  session: AttendanceSession;
  register: AttendanceRegister;
  seen: number;
  missing: number;
  marked: number;
}

// one register's verdict on one pack inside the comparison
export interface CompareVerdict {
  status: AttendanceStatus;
  location?: BatteryLocation;
  lastSeen?: string;
  markedByName: string;
}

// green: all three agree; red: they disagree; amber: some registers
// have not called it yet; plain: nobody has
export type AttendanceCompareStatus =
  | "match"
  | "mismatch"
  | "partial"
  | "unmarked";

export interface AttendanceCompareRow {
  batteryId: string;
  batteryCode: string;
  lastSeen: BatterySighting | null;
  manager: CompareVerdict | null;
  staff: CompareVerdict | null;
  storekeeper: CompareVerdict | null;
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
  session: AttendanceSession;
  rows: AttendanceCompareRow[];
  totals: AttendanceCompareTotals;
}
