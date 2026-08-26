// Mirrors kgr-backend interfaces/bus.interface.ts + models/Bus.ts.
import type { PaginationMeta } from "./api.types";

export type TrackerHealth = "ok" | "no_power" | "no_data";

// managers-only extras attached by the list/performance endpoints
export interface BusMaintenanceBadge {
  openRepairs: number;
  cost: string;
}

export interface Bus {
  maintenance?: BusMaintenanceBadge;
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

// the whole fleet judged against the daily trip minimum for a period
export type PerformanceBand = "good" | "average" | "under" | "idle";

export interface BusPerformanceRow extends Bus {
  trips: number;
  daysWorked: number;
  avgTripsPerDay: number;
  band: PerformanceBand;
}

export interface FleetPerformanceSummary {
  minTripsPerDay: number;
  fleetTrips: number;
  busesWorked: number;
  good: number;
  average: number;
  under: number;
  idle: number;
}

export interface BusPerformanceData {
  summary: FleetPerformanceSummary;
  buses: BusPerformanceRow[];
  pagination: PaginationMeta;
}

export interface BusPerformanceQueryParams {
  page?: number;
  pageSize?: number;
  isActive?: "true" | "false";
  search?: string;
  from?: string;
  to?: string;
  band?: PerformanceBand | "all";
}

// GET /api/buses/:id/maintenance (managers)
export type BusMaintenanceEventType =
  | "repair"
  | "request"
  | "expenditure"
  | "swap";

export interface BusMaintenanceEvent {
  type: BusMaintenanceEventType;
  at: string;
  title: string;
  detail: string;
  amount?: string;
  status?: string;
}

export interface BusMaintenanceData {
  bus: { _id: string; number: string };
  totals: {
    repairs: number;
    openRepairs: number;
    maintenanceCost: string;
    workshopDays: number;
    lastRepairAt: string | null;
  };
  events: BusMaintenanceEvent[];
}
