import type {
  GoalStatus,
  GoalVerdict,
  GoalEntryKind,
  SavingsGoal,
} from "@/lib/network/types/savingsGoal.types";

// bits the Goal Tracker list and the goal page share

export const lagosIso = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
export const todayIso = () => lagosIso(new Date());

export const compact = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}₦${(abs / 1_000_000_000).toFixed(2)}bn`;
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${sign}₦${Math.round(abs / 1_000)}k`;
  return `${sign}₦${Math.round(abs)}`;
};

export const VERDICT_META: Record<
  GoalVerdict,
  { label: string; pill: string; bar: string }
> = {
  reached: {
    label: "Reached",
    pill: "bg-brand-100 text-brand-700",
    bar: "bg-brand-500",
  },
  ahead: {
    label: "Ahead of plan",
    pill: "bg-brand-100 text-brand-700",
    bar: "bg-brand-500",
  },
  on_track: {
    label: "On track",
    pill: "bg-sky-100 text-sky-700",
    bar: "bg-sky-500",
  },
  behind: {
    label: "Behind plan",
    pill: "bg-amber-100 text-amber-700",
    bar: "bg-amber-500",
  },
  not_started: {
    label: "Not started",
    pill: "bg-haze text-fog",
    bar: "bg-fog",
  },
};

export const STATUS_META: Record<GoalStatus, { label: string; pill: string }> =
  {
    active: { label: "Active", pill: "bg-brand-100 text-brand-700" },
    reached: { label: "Reached", pill: "bg-forest-deep text-neon" },
    archived: { label: "Archived", pill: "bg-haze text-fog" },
  };

export const KIND_META: Record<
  GoalEntryKind,
  { label: string; sign: string; cls: string }
> = {
  deposit: { label: "Deposit", sign: "+", cls: "text-ink" },
  interest: { label: "Interest", sign: "+", cls: "text-brand-600" },
  withdrawal: { label: "Withdrawal", sign: "-", cls: "text-red-600" },
};

export const planText = (g: SavingsGoal) =>
  `₦${g.dailyAmount.toLocaleString("en-NG")} a day · ${g.ratePct}% · ${g.months} months`;
