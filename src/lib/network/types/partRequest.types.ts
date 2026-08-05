// Mirrors kgr-backend interfaces/partRequest.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export type RequestStatus = "pending" | "approved" | "declined";

export interface PartRequest {
  _id: string;
  requestId: number;
  bus: string;
  busNumber: string;
  item: string;
  itemName: string;
  quantity: number;
  unitCost: string;
  amount: string;
  narration: string;
  nextRequestDate?: string;
  status: RequestStatus;
  requestedBy: ReceiptUserRef | string;
  decidedBy?: ReceiptUserRef | string;
  decidedAt?: string;
  decisionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartRequestPayload {
  busId?: string; // a registered bus...
  target?: string; // ...or anything typed: generator, office, workshop
  itemId: string;
  quantity: number;
  narration?: string;
  nextRequestDate?: string;
  allowOverride?: boolean;
}

export interface DecideRequestPayload {
  note?: string;
}

export interface PartRequestsQueryParams {
  page?: number;
  pageSize?: number;
  status?: RequestStatus;
  busId?: string;
  search?: string;
}

export interface BusExpenseRow {
  busId: string;
  busNumber: string;
  count: number;
  totalAmount: string;
}

export interface BusExpenseData {
  buses: BusExpenseRow[];
}
