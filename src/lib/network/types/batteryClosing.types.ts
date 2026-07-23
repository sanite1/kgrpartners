// Mirrors kgr-backend interfaces/batteryClosing.interface.ts.
import type { BatteryLocation } from "./battery.types";

export type ClosingPercent = 50 | 75 | 100;

export interface BatteryClosingEntry {
  _id: string;
  date: string;
  batteryName: string;
  percent: ClosingPercent;
  voltage: string;
  location: BatteryLocation;
  trips: number;
  tripsAuto: boolean; // derived from receipts and swaps, not typed
  addedBy: string;
  addedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClosingTotals {
  count: number;
  fullyCharged: number;
  totalTrips: number;
  byLocation: Record<string, number>;
}

export interface ClosingReportData {
  date: string;
  entries: BatteryClosingEntry[];
  totals: ClosingTotals;
}

export interface CreateClosingEntryPayload {
  batteryName: string;
  percent: ClosingPercent;
  voltage: string;
  location: BatteryLocation;
  trips?: number; // omitted = system derives from receipts and swaps
}

export interface ClosingDayRow {
  date: string;
  count: number;
  fullyCharged: number;
  totalTrips: number;
}
