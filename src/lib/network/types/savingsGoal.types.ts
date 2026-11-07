// Mirrors kgr-backend interfaces/savingsGoal.interface.ts plus the
// summary and series the server works out per goal.

export type GoalStatus = "active" | "reached" | "archived";
export type GoalEntryKind = "deposit" | "interest" | "withdrawal";
export type GoalVerdict =
  "reached" | "ahead" | "on_track" | "behind" | "not_started";

export interface SavingsGoal {
  _id: string;
  name: string;
  dailyAmount: number;
  ratePct: number;
  months: number;
  startDate: string;
  targetAmount: number;
  account: string;
  note: string;
  status: GoalStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSummary {
  today: string;
  endDate: string;
  totalDays: number;
  elapsedDays: number;
  daysLeft: number;
  monthsElapsed: number;
  monthsLeft: number;
  plannedMonthly: number;
  deposits: number;
  interest: number;
  withdrawals: number;
  actual: number;
  planToDate: number;
  gap: number;
  progressPct: number;
  neededDaily: number;
  paceDaily: number;
  monthsAtPace: number | null;
  reachDateAtPace: string | null;
  balanceAtEndAtPace: number;
  verdict: GoalVerdict;
  entryCount: number;
}

export type GoalWithSummary = SavingsGoal & { summary: GoalSummary };

export interface GoalEntryChange {
  date: string;
  kind: GoalEntryKind;
  amount: number;
  note: string;
}

export interface GoalEntryEdit {
  at: string;
  by: string;
  byName: string;
  note: string;
  from: GoalEntryChange;
  to: GoalEntryChange;
}

export interface GoalEntry {
  _id: string;
  goal: string;
  date: string;
  kind: GoalEntryKind;
  amount: number;
  note: string;
  addedBy: string;
  addedByName: string;
  edits: GoalEntryEdit[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalSeriesPoint {
  month: number;
  date: string;
  plan: number;
  actual: number | null;
}

export interface GoalDetailData {
  goal: SavingsGoal;
  summary: GoalSummary;
  series: GoalSeriesPoint[];
  entries: GoalEntry[];
}

export interface CreateGoalPayload {
  name: string;
  dailyAmount: number;
  ratePct: number;
  months: number;
  startDate: string;
  account?: string;
  note?: string;
}
export type UpdateGoalPayload = Partial<CreateGoalPayload> & {
  status?: GoalStatus;
};

export interface CreateGoalEntryPayload {
  date: string;
  kind: GoalEntryKind;
  amount: number;
  note?: string;
}
export type UpdateGoalEntryPayload = Partial<CreateGoalEntryPayload> & {
  editNote?: string;
};
