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
  | "main_yard"
  | "muhd_house"
  | "kamila_house"
  | "ubs";

export type BatteryRetiredReason =
  | "sold"
  | "dismantled"
  | "accident"
  | "bms_burnt"
  | "other";

export interface Battery {
  _id: string;
  code: string;
  status: BatteryStatus;
  location: BatteryLocation;
  needsCheck: boolean;
  bus?: string;
  busNumber?: string;
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
  onBus: number; // packs currently assigned to a bus (any status)
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

export interface IssueBatteryPayload {
  busId: string;
  note?: string;
}

export interface CollectBatteryPayload {
  note?: string;
}

export interface SetBatteryStatusPayload {
  to: BatteryStatus;
  note?: string;
}

export interface BatteriesQueryParams {
  page?: number;
  pageSize?: number;
  status?: BatteryStatus;
  busId?: string;
  isActive?: "true" | "false";
  search?: string;
}
