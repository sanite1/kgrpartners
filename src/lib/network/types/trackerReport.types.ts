// Mirrors kgr-backend interfaces/trackerReport.interface.ts.
import type { ReceiptUserRef } from "./receipt.types";

export interface TrackerRow {
  bus?: string;
  busNumber: string;
  status: string;
  startTime: string; // HH:MM:SS
  endTime: string;
  mileageKm: number;
  note: string;
}

export interface TrackerSummary {
  totalDevices: number;
  activeCount: number;
  notActiveTracked: string[];
  noTracker: string[];
  badTracker: string[];
  totalMileageKm: number;
}

export interface TrackerReport {
  _id: string;
  reportId: number;
  date: string;
  rows: TrackerRow[];
  summary: TrackerSummary;
  submittedBy: ReceiptUserRef | string;
  submittedByName: string;
  rawText: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerCrossCheck {
  movedNoReceipt: { busNumber: string; mileageKm: number }[];
  receiptNoMovement: string[];
}

export type TrackerReportDetail = TrackerReport & {
  crossCheck: TrackerCrossCheck;
};

// one row as returned by the parse endpoint, before saving
export interface ParsedRow {
  busId?: string;
  busNumber: string;
  status: string;
  startTime: string;
  endTime: string;
  mileageKm: number;
  issues: string[];
}

export interface ParseResultData {
  date: string;
  dateDetected: boolean;
  rows: ParsedRow[];
  issues: string[];
  parsedCount: number;
  matchedCount: number;
}

export interface TrackerRowInput {
  busId?: string;
  busNumber: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  mileageKm: number;
  note?: string;
}

export interface CreateTrackerReportPayload {
  date: string;
  rows: TrackerRowInput[];
  rawText?: string;
  notes?: string;
  replace?: boolean;
}

export interface TrackerReportsQueryParams {
  page?: number;
  pageSize?: number;
  date?: string;
}

export interface MileageBusRow {
  busNumber: string;
  days: number;
  totalKm: number;
  avgKm: number;
  maxKm: number;
}

export interface MileageSummaryData {
  month: string;
  daysReported: number;
  buses: MileageBusRow[];
}
