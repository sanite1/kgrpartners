// Mirrors kgr-backend interfaces/gatePass.interface.ts.

export type GatePassStatus =
  | "pending"
  | "approved"
  | "declined"
  | "carried_out";

export interface GatePassItem {
  description: string;
  quantity: number;
  purpose: string;
  location: string;
}

export interface GatePass {
  _id: string;
  passId: number;
  date: string;
  requestedBy: string;
  requestedByName: string;
  department: string;
  designation: string;
  items: GatePassItem[];
  exitAt: string;
  status: GatePassStatus;
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNote?: string;
  carriedOutBy?: string;
  carriedOutByName?: string;
  carriedOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGatePassPayload {
  department: string;
  designation?: string;
  exitAt: string;
  items: {
    description: string;
    quantity: number;
    purpose?: string;
    location?: string;
  }[];
}

export interface DecideGatePassPayload {
  note?: string;
}

export interface GatePassesQueryParams {
  page?: number;
  pageSize?: number;
  status?: GatePassStatus;
  search?: string;
}
