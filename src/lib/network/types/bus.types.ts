// Mirrors kgr-backend interfaces/bus.interface.ts + models/Bus.ts.
import type { PaginationMeta } from "./api.types";

export type TrackerHealth = "ok" | "no_power" | "no_data";

export interface Bus {
  _id: string;
  number: string; // normalized "A 37" format
  driverName: string;
  driverPhone: string;
  isActive: boolean;
  hasTracker: boolean;
  trackerHealth: TrackerHealth;
  notes: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusPayload {
  number: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

export interface UpdateBusPayload {
  number?: string;
  driverName?: string;
  driverPhone?: string;
  isActive?: boolean;
  hasTracker?: boolean;
  trackerHealth?: TrackerHealth;
  notes?: string;
}

export interface BusesQueryParams {
  page?: number;
  pageSize?: number;
  isActive?: "true" | "false";
  search?: string;
}

// one period's totals on the bus page, straight from receipts
export interface BusTripsSummaryBlock {
  trips: number;
  receipts: number;
  expectedAmount: string;
  collectedAmount: string;
}

// one trip row: a generated receipt for this bus
export interface BusTripReceipt {
  _id: string;
  billId: number;
  ticketId: string;
  date: string;
  expectedTrips: number;
  batteryName: string;
  expectedAmount: string;
  amountPaid?: string;
  status: "awaiting_payment" | "paid" | "void";
  createdAt: string;
  issuedBy?: { firstName?: string; lastName?: string } | string;
}

// one working day's total for the bus within the selected period
export interface BusTripDay {
  date: string;
  trips: number;
  receipts: number;
}

export interface BusTripsData {
  bus: Bus;
  summary: {
    today: BusTripsSummaryBlock;
    thisMonth: BusTripsSummaryBlock;
    allTime: BusTripsSummaryBlock;
    range: BusTripsSummaryBlock;
  };
  minTripsPerDay: number; // days below this are painted red
  days: BusTripDay[];
  lowTripDays: number; // days in the period below the minimum
  receipts: BusTripReceipt[];
  pagination: PaginationMeta;
}

export interface BusTripsQueryParams {
  page?: number;
  pageSize?: number;
  from?: string; // YYYY-MM-DD, inclusive
  to?: string;
}
