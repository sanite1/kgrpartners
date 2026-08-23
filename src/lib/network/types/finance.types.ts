// Mirrors kgr-backend interfaces/finance.interface.ts. The money
// behind the operation: investments, loans, debt, salaries, profit.

export type FinanceEntryKind =
  | "investment"
  | "loan"
  | "repayment"
  | "salary"
  | "other_debt";

export interface FinanceEntry {
  _id: string;
  kind: FinanceEntryKind;
  amount: string;
  date: string;
  month: string;
  label: string;
  note: string;
  loan?: { _id: string; label: string; amount: string; date: string } | string | null;
  fromProfitPercent?: number;
  by: string;
  byName: string;
  createdAt: string;
}

export interface MonthBreakdown {
  month: string;
  revenue: number;
  expenses: number;
  salary: number;
  profit: number;
  buyDown: number;
  kept: number;
}

export interface FinanceOverviewData {
  totals: {
    invested: number;
    loans: number;
    otherDebt: number;
    repaid: number;
    debtOutstanding: number;
    retainedProfit: number;
  };
  thisMonth: MonthBreakdown;
  lastMonth: MonthBreakdown | null;
  verdict: {
    direction: "up" | "down" | "steady";
    profitChangePct: number | null; // latest finished month vs the one before
    compared: { latest: string; before: string } | null;
    repaidThisMonth: number; // by the date the money moved
  };
}

export interface FinanceMonthsData {
  months: MonthBreakdown[];
}

export interface FinancePerformancePoint {
  key: string;
  label: string;
  revenue: string;
  costs: string;
  profit: string;
}

export interface FinanceDebtPoint {
  key: string;
  label: string;
  outstanding: string;
  repaid: string;
}

export interface FinanceSeriesData {
  range: "daily" | "weekly" | "monthly" | "yearly";
  performance: FinancePerformancePoint[];
  debt: FinanceDebtPoint[];
}

export interface CreateFinanceEntryPayload {
  kind: FinanceEntryKind;
  amount: number;
  date?: string;
  month?: string;
  label?: string;
  note?: string;
  loanId?: string;
}

export interface BuyDownPayload {
  month: string;
  percent: number;
  loanId?: string;
  note?: string;
}

export interface FinanceEntriesQueryParams {
  page?: number;
  pageSize?: number;
  kind?: FinanceEntryKind;
}
