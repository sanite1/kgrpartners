// Mirrors kgr-backend interfaces/expenditure.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export interface ExpenditureCategory {
  _id: string;
  name: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenditureSource = "manual" | "part_request" | "repair";
export type ExpenditureStatus = "completed" | "pending" | "cancelled";

export interface Expenditure {
  _id: string;
  expenditureId: number;
  date: string; // YYYY-MM-DD
  amount: string;
  category: string;
  categoryName: string;
  bus?: string;
  busNumber?: string;
  description: string;
  note: string;
  source: ExpenditureSource;
  sourceRef?: string;
  status: ExpenditureStatus;
  recordedBy: ReceiptUserRef | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenditurePayload {
  date?: string;
  amount: string;
  categoryId?: string;
  categoryName?: string; // create a folder inline
  busId?: string;
  description: string;
  note?: string;
}

export interface UpdateExpenditurePayload {
  date?: string;
  amount?: string;
  categoryId?: string;
  busId?: string | null;
  description?: string;
  note?: string;
}

export interface ExpendituresQueryParams {
  page?: number;
  pageSize?: number;
  busId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
  status?: ExpenditureStatus;
  source?: ExpenditureSource;
}

export interface ExpenditureCategoryTotal {
  category: string;
  total: string;
  count: number;
}

export interface ExpenditureBusTotal {
  busNumber: string;
  total: string;
  count: number;
}

export interface ExpenditureSummary {
  from: string | null;
  to: string | null;
  total: string;
  count: number;
  byCategory: ExpenditureCategoryTotal[];
  byBus: ExpenditureBusTotal[];
}

export interface ExpenditureSummaryParams {
  from?: string;
  to?: string;
  busId?: string;
  categoryId?: string;
  search?: string;
  status?: ExpenditureStatus;
  source?: ExpenditureSource;
}

export interface CreateCategoryPayload {
  name: string;
}
