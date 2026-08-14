// Mirrors kgr-backend interfaces/tracker.interface.ts. The tracker
// board: one row per GPS tracker, updated by hand off the platform.

export type TrackerStatus = "online" | "offline" | "parked";

export interface Tracker {
  _id: string;
  busName: string;
  bus?: string;
  status: TrackerStatus;
  lastSeenText: string;
  location: string;
  purpose: string;
  note: string;
  lastUpdateAt?: string;
  lastUpdateByName: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerUpdateEntry {
  _id: string;
  tracker: string;
  busName: string;
  status: TrackerStatus;
  lastSeenText: string;
  location: string;
  purpose: string;
  note: string;
  by: string;
  byName: string;
  createdAt: string;
}

export interface TrackerSummaryData {
  total: number;
  counts: Record<TrackerStatus, number>;
}

export interface CreateTrackerPayload {
  busId?: string;
  busName?: string;
}

export interface UpdateTrackerPayload {
  status: TrackerStatus;
  lastSeenText: string;
  location: string;
  purpose?: string;
  note?: string;
}

export interface TrackersQueryParams {
  page?: number;
  pageSize?: number;
  status?: TrackerStatus;
  search?: string;
}
