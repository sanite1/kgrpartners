// Mirrors kgr-backend interfaces/batterySwap.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export interface BatterySwap {
  _id: string;
  swapId: number;
  date: string;
  bus: string;
  busNumber: string;
  initialBattery: string;
  initialBatteryCode: string;
  suppliedBattery: string;
  suppliedBatteryCode: string;
  tripsAdded: number;
  note: string;
  by: ReceiptUserRef | string;
  byName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatterySwapPayload {
  busId: string;
  initialBatteryId: string;
  suppliedBatteryId: string;
  tripsAdded: number;
  note?: string;
}

export interface BatterySwapsQueryParams {
  page?: number;
  pageSize?: number;
  date?: string;
  busId?: string;
  search?: string;
}
