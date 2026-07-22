// Mirrors kgr-backend interfaces/bus.interface.ts + models/Bus.ts.

export type TrackerHealth = "ok" | "no_power" | "no_data";

export interface Bus {
  _id: string;
  number: string; // normalized "A 37" format
  driverName: string;
  driverPhone: string;
  isActive: boolean;
  hasTracker: boolean;
  trackerHealth: TrackerHealth;
  notes: string;
  createdBy: string;
  updatedBy?: string;
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
  hasTracker?: boolean;
  trackerHealth?: TrackerHealth;
  notes?: string;
}

export interface BusesQueryParams {
  page?: number;
  pageSize?: number;
  isActive?: "true" | "false";
  search?: string;
}
