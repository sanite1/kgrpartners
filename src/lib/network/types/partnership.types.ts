// Mirrors kgr-backend interfaces/partnership.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";
import type { ConversionStatus } from "./conversion.types";

export type PartnershipKind = "corporate" | "individual";

export interface PartnershipField {
  label: string;
  value: string;
}

export interface PartnershipSection {
  title: string;
  fields: PartnershipField[];
}

export interface PartnershipRequest {
  _id: string;
  requestId: number;
  kind: PartnershipKind;
  name: string;
  email: string;
  phone: string;
  sections: PartnershipSection[];
  status: ConversionStatus;
  handledBy?: ReceiptUserRef | string;
  handledAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

// public submission
export interface SubmitPartnershipPayload {
  kind: PartnershipKind;
  name: string;
  email: string;
  phone?: string;
  sections?: { title: string; fields: PartnershipField[] }[];
}

export interface UpdatePartnershipStatusPayload {
  status: ConversionStatus;
  note?: string;
}

export interface PartnershipsQueryParams {
  page?: number;
  pageSize?: number;
  status?: ConversionStatus;
  kind?: PartnershipKind;
  search?: string;
}
