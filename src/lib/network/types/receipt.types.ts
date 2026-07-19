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
  batteryName: string;
  batteryPercent: number;
  voltage: number;
  timeOut: string; // HH:MM
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
  batteryName: string;
  batteryPercent: number;
  voltage?: number;
  timeOut: string; // HH:MM
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

// The summary is scoped by role on the server. Managers get the whole
// yard ("global"); everyone else gets only their own figures
// ("personal"). Fields for the other scope are absent.
export interface ReceiptSummary {
  scope: "global" | "personal";
  date: string;
  series: ReceiptSummarySeriesPoint[];
  // global (managers/admin)
  issuedCount?: number;
  expectedAmount?: string;
  collectedAmount?: string;
  outstandingAmount?: string;
  trips?: number;
  checkedIn?: number;
  awaitingCount?: number;
  monthCollected?: string;
  monthIssuedCount?: number;
  // personal (cashier and other non-managers)
  myCollectedToday?: string;
  myReceiptsToday?: number;
  myBusesToday?: number;
  myTripsToday?: number;
  myCheckedInToday?: number;
}
