// Mirrors kgr-backend interfaces/hijet.interface.ts. The Hijet log:
// which battery each errand vehicle took, closing the blind spot.
import type { BatteryLocation } from "./battery.types";

export type HijetTimeOfDay = "morning" | "afternoon" | "night";

export interface HijetEntry {
  _id: string;
  date: string;
  vehicleName: string;
  batteryName: string;
  timeOfDay?: HijetTimeOfDay;
  fromLocation?: BatteryLocation;
  trips?: number;
  note: string;
  by: string;
  byName: string;
  createdAt: string;
  updatedAt: string;
}

export interface HijetSummaryData {
  today: {
    entries: number;
    batteries: number;
    vehicles: number;
    trips: number;
  };
}

export interface CreateHijetEntryPayload {
  vehicleName: string;
  batteryName: string;
  timeOfDay?: HijetTimeOfDay;
  fromLocation?: BatteryLocation;
  trips?: number;
  note?: string;
}

export interface HijetEntriesQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  date?: string;
}
