// Mirrors kgr-backend interfaces/batteryExitForm.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";
import type { BatteryLocation, BatteryStatus } from "./battery.types";

// the CHECK column: the audit's own vocabulary, mapped onto the fleet on save
export type ExitCheck =
  "active" | "faulty" | "needs_check" | "out_of_use" | "sold" | "bms";

export interface RosterBattery {
  _id: string;
  code: string;
  status: BatteryStatus;
  location: BatteryLocation;
  needsCheck: boolean;
}

export interface RosterSeries {
  series: string;
  batteries: RosterBattery[];
}

export interface FleetRosterData {
  series: RosterSeries[];
  total: number;
  locations: { value: BatteryLocation; label: string }[];
}

export interface ExitFormRow {
  battery: string;
  code: string;
  series: string;
  check: ExitCheck;
  location: BatteryLocation;
  note: string;
}

export interface ExitFormTotals {
  active: number;
  faulty: number;
  needsCheck: number;
  outOfUse: number;
  sold: number;
  bms: number;
}

export interface BatteryExitForm {
  _id: string;
  formId: number;
  date: string;
  issuedBy: ReceiptUserRef | string;
  issuedByName: string;
  rows: ExitFormRow[];
  totals: ExitFormTotals;
  byLocation: Record<string, number>;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExitFormRowInput {
  batteryId: string;
  check: ExitCheck;
  location: BatteryLocation;
  note?: string;
}

export interface CreateExitFormPayload {
  date?: string;
  comments?: string;
  rows: ExitFormRowInput[];
}

export interface ExitFormsQueryParams {
  page?: number;
  pageSize?: number;
  date?: string;
  search?: string;
}
