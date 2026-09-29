// Mirrors kgr-backend interfaces/moneyBook.interface.ts. The team's own
// money book: purchases written in by hand, categories they own.

export type MoneyBookType = "expense" | "income";

export interface MoneyBookCategory {
  _id: string;
  name: string;
  color: string;
  monthlyBudget?: number | null;
  sortOrder: number;
}

export interface MoneyBookAccount {
  _id: string;
  name: string;
  sortOrder: number;
}

export interface MoneyBookEntry {
  _id: string;
  type: MoneyBookType;
  date: string;
  month: string;
  title: string;
  amount: string;
  quantity?: number;
  unitPrice?: string;
  usdAmount?: string;
  category?: string | null;
  categoryName: string;
  account?: string | null;
  accountName: string;
  note: string;
  recurring: boolean;
  recurringOf?: string | null;
  seeded: boolean;
  by: string;
  byName: string;
  createdAt: string;
}

export interface MoneyBookOverviewData {
  month: string;
  totals: {
    expense: number;
    income: number;
    net: number;
    lastMonthExpense: number;
    changePct: number | null;
    count: number;
  };
  daily: { date: string; amount: number }[];
  monthly: { month: string; expense: number }[]; // the 12-month strip
  budgets: {
    categoryId: string;
    name: string;
    color: string;
    budget: number;
    spent: number;
  }[];
  recent: MoneyBookEntry[];
}

export interface MoneyBookEntriesData {
  month: string;
  entries: MoneyBookEntry[];
  totals: { expense: number; income: number; count: number };
}

export interface MoneyBookSlice {
  categoryId: string | null;
  name: string;
  color: string;
  amount: number;
  pct: number;
}

export interface MoneyBookReportsData {
  month: string;
  spendingByCategory: MoneyBookSlice[];
  incomeByCategory: MoneyBookSlice[];
  trend: { month: string; expense: number; income: number; net: number }[];
}

export interface MoneyBookMetaData {
  categories: MoneyBookCategory[];
  accounts: MoneyBookAccount[];
}

export interface CreateMoneyBookEntryPayload {
  type: MoneyBookType;
  date: string;
  title: string;
  amount: number;
  quantity?: number | null;
  unitPrice?: number | null;
  usdAmount?: number | null;
  categoryId?: string | null;
  accountId?: string | null;
  note?: string;
  recurring?: boolean;
}

export type UpdateMoneyBookEntryPayload = Partial<CreateMoneyBookEntryPayload>;

export interface MoneyBookEntriesQueryParams {
  month?: string;
  search?: string;
  categoryId?: string;
  accountId?: string;
  type?: MoneyBookType;
}

export interface CreateMoneyBookCategoryPayload {
  name: string;
  color?: string;
  monthlyBudget?: number | null;
}
