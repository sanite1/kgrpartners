// Mirrors kgr-backend interfaces/repair.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export type RepairStatus = "open" | "completed" | "cancelled";

export interface RepairPartLine {
  item: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitCost: string;
  amount: string;
}

export interface RepairJob {
  _id: string;
  jobId: number;
  title: string;
  description: string;
  bus?: string;
  busNumber?: string;
  battery?: string;
  batteryCode?: string;
  parts: RepairPartLine[];
  partsCost: string;
  laborCost: string;
  totalCost: string;
  status: RepairStatus;
  openedBy: ReceiptUserRef | string;
  closedBy?: ReceiptUserRef | string;
  closedAt?: string;
  closeNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairPartInput {
  itemId: string;
  quantity: number;
}

export interface CreateRepairJobPayload {
  title: string;
  description?: string;
  busId?: string;
  batteryId?: string;
  parts?: RepairPartInput[];
}

export interface CompleteRepairJobPayload {
  laborCost?: string;
  note?: string;
}

export interface CancelRepairJobPayload {
  note?: string;
}

export interface RepairJobsQueryParams {
  page?: number;
  pageSize?: number;
  status?: RepairStatus;
  busId?: string;
  search?: string;
}
