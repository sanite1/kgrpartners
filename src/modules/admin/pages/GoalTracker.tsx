import { useEffect, useState } from "react";
import { Plus, Target } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import { useGetGoals, useCreateGoal } from "@/lib/network/api/savingsGoal.api";
import type { GoalWithSummary } from "@/lib/network/types/savingsGoal.types";
import { cn, fmtDate, fmtNaira } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";
import {
  VERDICT_META,
  STATUS_META,
  compact,
  planText,
  todayIso,
} from "./goalShared";

// Goal Tracker: the Growth Planner's sums turned into real targets,
// with the money that actually went in logged by hand against each.
export default function GoalTracker() {
  const [params, setParams] = useSearchParams();
  const { data, isLoading, isError, refetch } = useGetGoals();
  const goals = data?.data ?? [];
  const active = goals.filter((g) => g.status !== "archived");
  const archived = goals.filter((g) => g.status === "archived");

  // create modal; the Growth Planner can open it pre-filled by query
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [daily, setDaily] = useState("");
  const [rate, setRate] = useState("16");
  const [months, setMonths] = useState("36");
  const [startDate, setStartDate] = useState(todayIso());
  const [account, setAccount] = useState("");
  const [note, setNote] = useState("");
  const createGoal = useCreateGoal();

  useEffect(() => {
    if (params.get("new") !== "1") return;
    setDaily(params.get("daily") ?? "");
    setRate(params.get("rate") ?? "16");
    setMonths(params.get("months") ?? "36");
    setOpen(true);
    setParams({}, { replace: true });
  }, [params, setParams]);

  const openNew = () => {
    setName("");
    setDaily("");
    setRate("16");
    setMonths("36");
    setStartDate(todayIso());
    setAccount("");
    setNote("");
    setOpen(true);
  };

  const dailyNum = Number(daily);
  const rateNum = Number(rate);
  const monthsNum = Number(months);
  const canSave =
    name.trim().length > 0 &&
    daily !== "" &&
    dailyNum >= 0 &&
    rate !== "" &&
    rateNum >= 0 &&
    Number.isInteger(monthsNum) &&
    monthsNum >= 1 &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate);

  // same sum as the server, so the target shows before saving
  const previewTarget = (() => {
    const m = (dailyNum * 365.25) / 12;
    const r = rateNum / 100 / 12;
    let b = 0;
    for (let i = 0; i < Math.min(600, Math.max(0, monthsNum)); i += 1)
      b = (b + m) * (1 + r);
    return b;
  })();

  const save = () =>
    createGoal.mutate(
      {
        name: name.trim(),
        dailyAmount: dailyNum,
        ratePct: rateNum,
        months: monthsNum,
        startDate,
        account: account.trim() || undefined,
        note: note.trim() || undefined,
      },
      { onSuccess: () => setOpen(false) },
    );

  const Card = ({ g }: { g: GoalWithSummary }) => {
    const s = g.summary;
    const v = VERDICT_META[s.verdict];
    const st = STATUS_META[g.status];
    const pct = Math.min(100, s.progressPct);
    return (
      <Link
        to={`/goals/${g._id}`}
        className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 no-underline transition-colors hover:border-brand-500"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block truncate text-[16px] font-extrabold text-ink">
              {g.name}
            </span>
            <span className="block text-[12px] font-semibold text-fog">
              {planText(g)}
            </span>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
              g.status === "active" ? v.pill : st.pill,
            )}
          >
            {g.status === "active" ? v.label : st.label}
          </span>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[20px] font-extrabold tabular-nums text-ink">
              {compact(s.actual)}
            </span>
            <span className="text-[12px] font-bold text-fog">
              of {compact(g.targetAmount)} · {s.progressPct}%
            </span>
          </div>
          <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-haze">
            <div
              className={cn("h-full rounded-full", v.bar)}
              style={{ width: `${pct}%` }}
            />
            {/* where the plan says the money should be by today */}
            {g.targetAmount > 0 && (
              <div
                className="absolute top-0 h-full w-0.5 bg-ink/50"
                style={{
                  left: `${Math.min(100, (s.planToDate / g.targetAmount) * 100)}%`,
                }}
                title="Plan to date"
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[12px] font-semibold text-bark">
          <span>
            {s.gap >= 0 ? "Ahead by " : "Behind by "}
            <b className={s.gap >= 0 ? "text-brand-600" : "text-amber-600"}>
              {compact(Math.abs(s.gap))}
            </b>
          </span>
          <span className="text-right">
            Ends {fmtDate(s.endDate)} · {s.daysLeft}d left
          </span>
        </div>
      </Link>
    );
  };

  return (
    <>
      <PageMeta title="Goal Tracker | KGR Console" />
      <PageHead
        eyebrow="REAL MONEY AGAINST REAL TARGETS"
        title="Goal Tracker"
        subtitle="Each goal is a plan from the Growth Planner. Log what actually goes in and see whether you are ahead or behind."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> New goal
          </button>
        }
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}
      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <p className="m-0 text-[15px] font-bold text-red-600">
            Could not load the goals.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
          >
            Try again
          </button>
        </div>
      )}
      {!isLoading && !isError && goals.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            No goals yet. Work one out on the Growth Planner, then send it here,
            or start one from scratch.
          </p>
          <Link
            to="/growth-planner"
            className="text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
          >
            Open the Growth Planner
          </Link>
        </div>
      )}
      {active.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {active.map((g) => (
            <Card key={g._id} g={g} />
          ))}
        </div>
      )}
      {archived.length > 0 && (
        <>
          <span className="mt-8 mb-3 block text-[11px] font-extrabold tracking-[1.5px] text-fog">
            ARCHIVED
          </span>
          <div className="grid grid-cols-1 gap-3 opacity-70 md:grid-cols-2 xl:grid-cols-3">
            {archived.map((g) => (
              <Card key={g._id} g={g} />
            ))}
          </div>
        </>
      )}

      <Modal title="New goal" open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-name" className={labelClasses}>
              Goal name
            </label>
            <input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fleet expansion fund"
              className={inputClasses}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-daily" className={labelClasses}>
                Per day (₦)
              </label>
              <input
                id="goal-daily"
                type="number"
                min="0"
                inputMode="numeric"
                value={daily}
                onChange={(e) => setDaily(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-rate" className={labelClasses}>
                Rate (% a year)
              </label>
              <input
                id="goal-rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-months" className={labelClasses}>
                Months
              </label>
              <input
                id="goal-months"
                type="number"
                min="1"
                max="600"
                inputMode="numeric"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="rounded-xl border border-forest-border bg-forest-deep px-4 py-3">
            <span className="block text-[11px] font-extrabold tracking-[1px] text-mint">
              TARGET AT THE END
            </span>
            <span className="block text-[20px] font-extrabold tabular-nums text-neon">
              {fmtNaira(Math.round(previewTarget))}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-start" className={labelClasses}>
                Start date
              </label>
              <input
                id="goal-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-account" className={labelClasses}>
                Where the money sits (optional)
              </label>
              <input
                id="goal-account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Bank or fund name"
                className={inputClasses}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-note" className={labelClasses}>
              Note (optional)
            </label>
            <textarea
              id="goal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={inputClasses}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave || createGoal.isPending}
              onClick={save}
              className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Target size={15} strokeWidth={3} />
              {createGoal.isPending ? "Saving..." : "Create goal"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
