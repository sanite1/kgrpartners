// Mirrors kgr-backend services/report.service.ts payloads.

export interface MonthlyReportRow {
  date: string;
  issued: number;
  expected: string;
  collected: string;
  fromToday: string;
  fromArrears: string;
  outstanding: string;
  voided: number;
  notCheckedIn: number;
}

export interface MonthlyReportData {
  month: string;
  days: MonthlyReportRow[];
  totals: Omit<MonthlyReportRow, "date">;
}

export interface ExpenseReportRow {
  busNumber: string;
  requestsCount: number;
  requestsTotal: string;
  repairsCount: number;
  repairsParts: string;
  repairsLabor: string;
  repairsTotal: string;
  total: string;
}

export interface ExpenseReportData {
  from: string | null;
  to: string | null;
  buses: ExpenseReportRow[];
  totals: Omit<ExpenseReportRow, "busNumber">;
}
