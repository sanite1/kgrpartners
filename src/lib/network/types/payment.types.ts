// Mirrors kgr-backend interfaces/payment.interface.ts + payment.service.ts.
import type { ReceiptUserRef } from "./receipt.types";

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
  createdAt: string;
  updatedAt: string;
}

export interface PayReceiptPayload {
  receiptId: string;
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
}

export interface ExportPaymentsParams {
  date?: string;
  collectedBy?: string;
}
