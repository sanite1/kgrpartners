// Mirrors kgr-backend interfaces/battery.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export type BatteryStatus =
  | "in_store"
  | "charging"
  | "on_bus"
  | "faulty"
  | "in_repair";

export type BatteryMoveAction = "issue" | "collect" | "status";

export interface Battery {
  _id: string;
  code: string;
  status: BatteryStatus;
  bus?: string;
  busNumber?: string;
  notes: string;
  isActive: boolean;
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
}

export interface CreateBatteryPayload {
  code: string;
  status?: "in_store" | "charging" | "faulty";
  notes?: string;
}

export interface UpdateBatteryPayload {
  code?: string;
  notes?: string;
  isActive?: boolean;
}

export interface IssueBatteryPayload {
  busId: string;
  note?: string;
}

export interface CollectBatteryPayload {
  to: "in_store" | "charging" | "faulty";
  note?: string;
}

export interface SetBatteryStatusPayload {
  to: Exclude<BatteryStatus, "on_bus">;
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
