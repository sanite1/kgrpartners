// Mirrors kgr-backend interfaces/conversion.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export type ConversionStatus = "new" | "in_review" | "contacted" | "closed";

export interface ConversionField {
  label: string;
  value: string;
}

export interface ConversionSection {
  title: string;
  fields: ConversionField[];
}

export interface ConversionRequest {
  _id: string;
  requestId: number;
  name: string;
  email: string;
  phone: string;
  remarks: string;
  sections: ConversionSection[];
  status: ConversionStatus;
  handledBy?: ReceiptUserRef | string;
  handledAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

// public submission
export interface SubmitConversionPayload {
  name: string;
  email: string;
  phone?: string;
  remarks?: string;
  sections?: { title: string; fields: ConversionField[] }[];
}

export interface UpdateConversionStatusPayload {
  status: ConversionStatus;
  note?: string;
}

export interface ConversionsQueryParams {
  page?: number;
  pageSize?: number;
  status?: ConversionStatus;
  search?: string;
}
