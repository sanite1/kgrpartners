// Mirrors kgr-backend interfaces/payment.interface.ts + payment.service.ts.
import type { ReceiptUserRef } from "./receipt.types";
import type { PaginationMeta } from "./api.types";

export interface PaymentReceiptRef {
  _id: string;
  billId: number;
  ticketId: string;
  busNumber: string;
  date: string;
  expectedTrips?: number;
}

export interface Payment {
  _id: string;
  receipt: PaymentReceiptRef | string;
  amount: string;
  method: "cash";
  collectedBy: ReceiptUserRef | string;
  date: string; // day the cash was collected
  receiptDate: string; // the receipt's own day (arrears when older)
  reason?: string; // set when less than the expected amount was collected
  createdAt: string;
  updatedAt: string;
}

export interface PayReceiptPayload {
  receiptId: string;
  amount?: string; // omitted = pay in full
  reason?: string; // required when amount is below the expected amount
}

export interface PayReceiptData {
  payment: Payment;
  receipt: import("./receipt.types").Receipt;
}

export interface PaymentsQueryParams {
  page?: number;
  pageSize?: number;
  date?: string;
  collectedBy?: string; // user id or "me"
}

export interface DailyAccountCashier {
  id: string;
  name: string;
  count: number;
  amount: string;
}

export interface DailyAccountData {
  date: string;
  receiptsIssued: number;
  expectedAmount: string;
  collectedTotal: string;
  collectedFromToday: string;
  collectedFromArrears: string;
  outstandingToday: string;
  cashiers: DailyAccountCashier[];
  payments: Payment[];
  pagination: PaginationMeta;
}

export interface ExportPaymentsParams {
  date?: string;
  collectedBy?: string;
}
