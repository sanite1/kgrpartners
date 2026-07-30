// Mirrors kgr-backend interfaces/purchase.interface.ts.

export type PurchaseStatus = "purchased" | "shipping" | "arrived" | "delivered";

export interface PurchaseStatusEvent {
  status: PurchaseStatus;
  at: string;
  by: string;
  byName: string;
  note: string;
}

export interface PurchaseOrder {
  _id: string;
  orderId: number;
  title: string;
  supplier: string;
  quantity?: number;
  trackingNumber: string;
  expectedArrival: string;
  notes: string;
  status: PurchaseStatus;
  history: PurchaseStatusEvent[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchasePayload {
  title: string;
  supplier?: string;
  quantity?: number;
  trackingNumber?: string;
  expectedArrival?: string;
  notes?: string;
}

export interface UpdatePurchasePayload {
  trackingNumber?: string;
  expectedArrival?: string;
  notes?: string;
}

export interface SetPurchaseStatusPayload {
  status: PurchaseStatus;
  note?: string;
}

export interface PurchasesQueryParams {
  page?: number;
  pageSize?: number;
  status?: PurchaseStatus;
  search?: string;
}

export type PurchaseCounts = Record<PurchaseStatus, number>;
