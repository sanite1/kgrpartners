// Mirrors kgr-backend interfaces/battery.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export type BatteryStatus =
  | "active"
  | "faulty"
  | "charging"
  | "fully_charged"
  | "not_charged"
  | "not_in_use";

export type BatteryMoveAction = "issue" | "collect" | "status";

export type BatteryLocation =
  "main_yard" | "muhd_house" | "kamila_house" | "ubs";

export type BatteryRetiredReason =
  "sold" | "dismantled" | "accident" | "bms_burnt" | "other";

// where humans last wrote the pack down (checklist or receipt)
export interface BatterySighting {
  busName: string;
  date: string;
  source: "checklist" | "receipt" | "hijet";
}

export interface Battery {
  _id: string;
  code: string;
  status: BatteryStatus;
  location: BatteryLocation;
  needsCheck: boolean;
  lastSeen?: BatterySighting | null;
  // per-row summary: receipts naming this pack, canon matched
  trips?: { today: number; month: number };
  notes: string;
  isActive: boolean;
  retiredReason?: BatteryRetiredReason;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatteryMovement {
  _id: string;
  battery: string;
  batteryCode: string;
  action: BatteryMoveAction;
  fromStatus: BatteryStatus;
  toStatus: BatteryStatus;
  bus?: string;
  busNumber?: string;
  note: string;
  by: ReceiptUserRef | string;
  createdAt: string;
}

export interface BatterySummaryData {
  counts: Record<BatteryStatus, number>;
  total: number;
  onBus: number; // distinct batteries named on today's live receipts
}

// a pack that has not appeared on any receipt for 48h or more
export interface IdleBattery {
  _id: string;
  code: string;
  status: BatteryStatus;
  location: BatteryLocation;
  needsCheck: boolean;
  lastWorkedDate: string | null; // null = never on a receipt
  idleDays: number;
  snoozedUntil: string | null;
  snoozedByName: string;
}

export interface IdleBatteriesData {
  batteries: IdleBattery[];
  count: number;
  snoozed: IdleBattery[];
  snoozedCount: number;
  thresholdHours: number;
}

export interface CreateBatteryPayload {
  code: string;
  status?: BatteryStatus;
  notes?: string;
}

export interface UpdateBatteryPayload {
  code?: string;
  notes?: string;
  location?: BatteryLocation;
  needsCheck?: boolean;
  isActive?: boolean;
  retiredReason?: BatteryRetiredReason;
}

export interface SetBatteryStatusPayload {
  to: BatteryStatus;
  note?: string;
}

export interface BatteriesQueryParams {
  page?: number;
  pageSize?: number;
  status?: BatteryStatus;
  isActive?: "true" | "false";
  search?: string;
}

// everything the console knows about one pack, on one page
export interface BatteryTripBlock {
  trips: number;
  receipts: number;
}

export interface BatteryTripReceipt {
  _id: string;
  billId: number;
  date: string;
  busNumber: string;
  expectedTrips: number;
  createdAt: string;
}

export interface BatteryClosingAppearance {
  _id: string;
  date: string;
  sheet?: string;
  batteryName: string;
  percent: number;
  voltage: string;
  location: BatteryLocation;
  worked: boolean;
  addedByName: string;
}

export interface BatterySwapRecord {
  _id: string;
  busNumber: string;
  initialBatteryCode: string;
  suppliedBatteryCode: string;
  tripsAdded: number;
  byName: string;
  createdAt: string;
  role: "went_on" | "came_off";
}

export interface BatteryAttendanceHistoryRow {
  _id: string; // the log's id
  logId: number;
  date: string;
  timeOfDay: string;
  status: "seen" | "missing";
  location?: BatteryLocation;
  onBus?: string; // auto-marked from a sighting
  auto?: boolean;
  autoSource?: string;
  asOf?: string;
  note?: string;
  lastSeen: string;
  submittedByName: string;
  at: string;
}

export interface BatteryDetailsData {
  battery: Battery;
  lastSeen: BatterySighting | null;
  trips: {
    today: BatteryTripBlock;
    thisMonth: BatteryTripBlock;
    allTime: BatteryTripBlock;
  };
  receipts: BatteryTripReceipt[];
  attendance: BatteryAttendanceHistoryRow[];
  closings: BatteryClosingAppearance[];
  swaps: BatterySwapRecord[];
}
