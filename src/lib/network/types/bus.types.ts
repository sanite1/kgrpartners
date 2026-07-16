// Mirrors kgr-backend interfaces/bus.interface.ts + models/Bus.ts.

export interface Bus {
  _id: string;
  number: string; // normalized "A 37" format
  driverName: string;
  driverPhone: string;
  isActive: boolean;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusPayload {
  number: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

export interface UpdateBusPayload {
  number?: string;
  driverName?: string;
  driverPhone?: string;
  isActive?: boolean;
  notes?: string;
}

export interface BusesQueryParams {
  page?: number;
  pageSize?: number;
  isActive?: "true" | "false";
  search?: string;
}
