// Mirrors kgr-backend interfaces/batteryAttendance.interface.ts. The
// paper "Battery Attendance" sheet: three times a day the registered
// fleet is called and every pack is seen somewhere or missing.
import type { BatteryLocation } from "./battery.types";

export type AttendanceSession = "morning" | "afternoon" | "night";
export type AttendanceStatus = "seen" | "missing";

export interface AttendanceMark {
  _id: string;
  date: string;
  session: AttendanceSession;
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
  busNumber: string;
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
  rows: AttendanceRow[];
  totals: AttendanceTotals;
}

export interface MarkAttendancePayload {
  batteryId: string;
  session: AttendanceSession;
  status: AttendanceStatus;
  location?: BatteryLocation;
  lastSeen?: string;
}

export interface AttendanceDayRow {
  date: string;
  session: AttendanceSession;
  seen: number;
  missing: number;
  marked: number;
}
