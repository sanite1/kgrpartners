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
  checkedInBy?: ReceiptUserRef | string;
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
  sort?: "newest" | "oldest";
}

export interface OutstandingBucket {
  count: number;
  amount: string;
}

export interface OutstandingSummary {
  count: number;
  totalAmount: string;
  buckets: {
    d0_7: OutstandingBucket;
    d8_30: OutstandingBucket;
    d30plus: OutstandingBucket;
  };
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
  monthCollected: string;
  monthIssuedCount: number;
  series: ReceiptSummarySeriesPoint[];
}
