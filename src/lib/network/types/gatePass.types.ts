// Mirrors kgr-backend interfaces/gatePass.interface.ts.

export type GatePassStatus =
  | "pending"
  | "approved"
  | "declined"
  | "carried_out";

// security's verdict on one item, given at the gate against the pass
// itself: cleared matches the line; flagged is held back
export interface ItemClearance {
  status: "cleared" | "flagged";
  seenQuantity?: number;
  note?: string;
  byName?: string;
  at?: string;
}

export interface GatePassItem {
  description: string;
  quantity: number;
  purpose: string;
  location: string;
  clearance?: ItemClearance; // absent until security checks it
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

export interface ClearGatePassItemPayload {
  outcome: "cleared" | "flagged";
  seenQuantity?: number;
  note?: string;
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
