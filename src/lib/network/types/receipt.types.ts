// Mirrors kgr-backend interfaces/receipt.interface.ts + models/Receipt.ts.

export type ReceiptStatus = "awaiting_payment" | "paid" | "void";

export interface ReceiptUserRef {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface Receipt {
  _id: string;
  billId: number;
  ticketId: string;
  bus: string;
  busNumber: string;
  expectedTrips: number;
  unitPrice: string;
  expectedAmount: string;
  date: string; // YYYY-MM-DD Lagos business day
  status: ReceiptStatus;
  issuedBy: ReceiptUserRef | string;
  checkedIn: boolean;
  checkedInAt?: string;
  paidAt?: string;
  paidBy?: ReceiptUserRef | string;
  voidedAt?: string;
  voidedBy?: ReceiptUserRef | string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceiptPayload {
  busId: string;
  expectedTrips: number;
  checkIn?: boolean;
  allowDuplicate?: boolean;
}

export interface ReceiptsQueryParams {
  page?: number;
  pageSize?: number;
  status?: ReceiptStatus;
  busId?: string;
  date?: string;
  search?: string;
}

export interface VoidReceiptPayload {
  reason: string;
}

export interface ReceiptSummarySeriesPoint {
  date: string;
  expectedAmount: string;
  collectedAmount: string;
}

export interface ReceiptSummary {
  date: string;
  issuedCount: number;
  expectedAmount: string;
  collectedAmount: string;
  outstandingAmount: string;
  trips: number;
  checkedIn: number;
  awaitingCount: number;
  series: ReceiptSummarySeriesPoint[];
}
