import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Archive,
  History,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import ConfirmModal from "../components/console/ConfirmModal";
import {
  useGetGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCreateGoalEntry,
  useUpdateGoalEntry,
  useDeleteGoalEntry,
} from "@/lib/network/api/savingsGoal.api";
import type {
  GoalEntry,
  GoalEntryKind,
} from "@/lib/network/types/savingsGoal.types";
import { cn, fmtDate, fmtNaira, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";
import {
  VERDICT_META,
  STATUS_META,
  KIND_META,
  compact,
  planText,
  todayIso,
} from "./goalShared";

const KINDS: GoalEntryKind[] = ["deposit", "interest", "withdrawal"];

// One goal: where the money really is against where the plan said it
// would be, the catch-up figure, and every entry with its history.
export default function GoalDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetGoal(id);
  const detail = data?.data;
  const goal = detail?.goal;
  const s = detail?.summary;
  const entries = detail?.entries ?? [];

  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const createEntry = useCreateGoalEntry();
  const updateEntry = useUpdateGoalEntry();
  const deleteEntry = useDeleteGoalEntry();

  // entry modal (add or correct)
  const [entryModal, setEntryModal] = useState<null | { item?: GoalEntry }>(
    null,
  );
  const [date, setDate] = useState(todayIso());
  const [kind, setKind] = useState<GoalEntryKind>("deposit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [editNote, setEditNote] = useState("");
  const openEntry = (item?: GoalEntry) => {
    setDate(item?.date ?? todayIso());
    setKind(item?.kind ?? "deposit");
    setAmount(item ? String(item.amount) : "");
    setNote(item?.note ?? "");
    setEditNote("");
    setEntryModal({ item });
  };
  const amountNum = Number(amount);
  const canSaveEntry =
    amount !== "" && amountNum >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const saveEntry = () => {
    if (!goal) return;
    if (entryModal?.item) {
      updateEntry.mutate(
        {
          goalId: goal._id,
          entryId: entryModal.item._id,
          payload: {
            date,
            kind,
            amount: amountNum,
            note: note.trim(),
            editNote,
          },
        },
        { onSuccess: () => setEntryModal(null) },
      );
    } else {
      createEntry.mutate(
        {
          goalId: goal._id,
          payload: {
            date,
            kind,
            amount: amountNum,
            note: note.trim() || undefined,
          },
        },
        { onSuccess: () => setEntryModal(null) },
      );
    }
  };
  const [deleteEntryFor, setDeleteEntryFor] = useState<GoalEntry | null>(null);
  const [historyFor, setHistoryFor] = useState<GoalEntry | null>(null);

  // goal settings modal
  const [settings, setSettings] = useState(false);
  const [gName, setGName] = useState("");
  const [gDaily, setGDaily] = useState("");
  const [gRate, setGRate] = useState("");
  const [gMonths, setGMonths] = useState("");
  const [gStart, setGStart] = useState("");
  const [gAccount, setGAccount] = useState("");
  const [gNote, setGNote] = useState("");
  const openSettings = () => {
    if (!goal) return;
    setGName(goal.name);
    setGDaily(String(goal.dailyAmount));
    setGRate(String(goal.ratePct));
    setGMonths(String(goal.months));
    setGStart(goal.startDate);
    setGAccount(goal.account);
    setGNote(goal.note);
    setSettings(true);
  };
  const canSaveGoal =
    gName.trim().length > 0 &&
    gDaily !== "" &&
    Number(gDaily) >= 0 &&
    gRate !== "" &&
    Number(gRate) >= 0 &&
    Number.isInteger(Number(gMonths)) &&
    Number(gMonths) >= 1 &&
    /^\d{4}-\d{2}-\d{2}$/.test(gStart);
  const saveGoal = () => {
    if (!goal) return;
    updateGoal.mutate(
      {
        id: goal._id,
        payload: {
          name: gName.trim(),
          dailyAmount: Number(gDaily),
          ratePct: Number(gRate),
          months: Number(gMonths),
          startDate: gStart,
          account: gAccount.trim(),
          note: gNote.trim(),
        },
      },
      { onSuccess: () => setSettings(false) },
    );
  };
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // the chart: plan line faint, actual line solid up to today
  const chart = useMemo(() => {
    const series = detail?.series ?? [];
    const W = 640;
    const H = 240;
    const padL = 56;
    const padB = 28;
    const peak = Math.max(
      1,
      ...series.map((p) => Math.max(p.plan, p.actual ?? 0)),
    );
    const maxMonth = Math.max(1, goal?.months ?? 1);
    const x = (m: number) => padL + (m / maxMonth) * (W - padL - 12);
    const y = (v: number) => 12 + (1 - v / peak) * (H - padB - 12);
    const planPts = series
      .map((p) => `${x(p.month).toFixed(1)},${y(p.plan).toFixed(1)}`)
      .join(" ");
    const actualPts = series
      .filter((p) => p.actual !== null)
      .map((p) => `${x(p.month).toFixed(1)},${y(p.actual ?? 0).toFixed(1)}`)
      .join(" ");
    const todayX = s ? x(s.monthsElapsed) : null;
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    const labels = series.filter(
      (p) =>
        Number.isInteger(p.month) &&
        (p.month === 0 ||
          p.month === maxMonth ||
          p.month % Math.max(1, Math.round(maxMonth / 6)) === 0),
    );
    return {
      W,
      H,
      padL,
      padB,
      peak,
      x,
      y,
      planPts,
      actualPts,
      todayX,
      ticks,
      labels,
    };
  }, [detail?.series, goal?.months, s]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      </div>
    );
  }
  if (isError || !goal || !s) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
        <p className="m-0 text-[15px] font-bold text-red-600">
          Could not load this goal.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink"
        >
          Try again
        </button>
        <Link to="/goals" className="text-[13px] font-extrabold text-brand-600">
          Back to goals
        </Link>
      </div>
    );
  }

  const v = VERDICT_META[s.verdict];
  const st = STATUS_META[goal.status];
  const pct = Math.min(100, s.progressPct);
  const sentence = (() => {
    if (s.verdict === "reached")
      return `Target reached. The balance stands at ${fmtNaira(s.actual)} against a target of ${fmtNaira(goal.targetAmount)}.`;
    if (s.verdict === "not_started")
      return `Nothing logged yet. The plan expects ${fmtNaira(s.plannedMonthly)} a month from ${fmtDate(goal.startDate)}.`;
    const where = s.gap >= 0 ? "ahead of" : "behind";
    const catchUp =
      s.monthsLeft > 0
        ? ` To still finish on ${fmtDate(s.endDate)} you now need ${fmtNaira(Math.ceil(s.neededDaily))} a day.`
        : " The plan period has ended.";
    const pace = s.reachDateAtPace
      ? ` At the current pace the target lands around ${fmtDate(s.reachDateAtPace)}.`
      : s.paceDaily > 0
        ? " At the current pace the target is not reached within 50 years."
        : "";
    return `${fmtNaira(s.actual)} saved so far, ${fmtNaira(Math.abs(s.gap))} ${where} the plan.${catchUp}${pace}`;
  })();

  return (
    <>
      <PageMeta title={`${goal.name} | Goal Tracker`} />
      <Link
        to="/goals"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-extrabold text-fog no-underline hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={3} /> All goals
      </Link>
      <PageHead
        eyebrow={planText(goal)}
        title={goal.name}
        subtitle={[
          `Started ${fmtDate(goal.startDate)}, ends ${fmtDate(s.endDate)}.`,
          goal.account ? `Held at ${goal.account}.` : "",
          goal.note,
        ]
          .filter(Boolean)
          .join(" ")}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openSettings}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-line bg-white px-4 py-3 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              <Pencil size={14} strokeWidth={3} /> Edit plan
            </button>
            {goal.status === "active" ? (
              <button
                type="button"
                onClick={() => setConfirmArchive(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-line bg-white px-4 py-3 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
              >
                <Archive size={14} strokeWidth={3} /> Archive
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  updateGoal.mutate({
                    id: goal._id,
                    payload: { status: "active" },
                  })
                }
                className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-line bg-white px-4 py-3 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
              >
                Reactivate
              </button>
            )}
            <button
              type="button"
              onClick={() => openEntry()}
              className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={3} /> Log entry
            </button>
          </div>
        }
      />

      {/* the verdict */}
      <div className="mb-4 rounded-2xl border border-forest-border bg-forest-deep px-5 py-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-extrabold",
              v.pill,
            )}
          >
            {v.label}
          </span>
          {goal.status !== "active" && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                st.pill,
              )}
            >
              {st.label}
            </span>
          )}
          <span className="text-[11px] font-extrabold tracking-[1px] text-mint">
            DAY {s.elapsedDays} OF {s.totalDays}
          </span>
        </div>
        <p className="m-0 text-[14.5px] font-bold leading-relaxed text-white">
          {sentence}
        </p>
        <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-white/15">
          <div
            className={cn("h-full rounded-full", v.bar)}
            style={{ width: `${pct}%` }}
          />
          {goal.targetAmount > 0 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-white"
              style={{
                left: `${Math.min(100, (s.planToDate / goal.targetAmount) * 100)}%`,
              }}
              title="Plan to date"
            />
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] font-bold text-mint/80">
          <span>
            {s.progressPct}% of {compact(goal.targetAmount)}
          </span>
          <span>white line = where the plan says you should be</span>
        </div>
      </div>

      {/* the numbers */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["SAVED SO FAR", s.actual, "text-ink"],
            ["PLAN TO DATE", s.planToDate, "text-bark"],
            [
              s.gap >= 0 ? "AHEAD BY" : "BEHIND BY",
              Math.abs(s.gap),
              s.gap >= 0 ? "text-brand-600" : "text-amber-600",
            ],
            ["TARGET", goal.targetAmount, "text-ink"],
            ["DEPOSITS", s.deposits, "text-ink"],
            ["INTEREST CREDITED", s.interest, "text-brand-600"],
            ["WITHDRAWN", s.withdrawals, "text-red-600"],
            ["NEEDED PER DAY NOW", s.neededDaily, "text-ink"],
          ] as const
        ).map(([label, value, cls]) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl border border-line bg-white p-4"
          >
            <span
              className={cn(
                "block break-all text-[16px] font-extrabold leading-tight tabular-nums sm:text-[20px]",
                cls,
              )}
            >
              {fmtNaira(Math.round(value))}
            </span>
            <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* the curve */}
      <div className="mb-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="block text-[14px] font-extrabold text-ink">
              Actual vs plan
            </span>
            <span className="block text-[12px] font-semibold text-fog">
              Solid line is the real balance, faint line is the plan
            </span>
          </div>
          <div className="flex gap-4 text-[11px] font-extrabold text-fog">
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-0.5 w-5 bg-brand-500" /> Actual
            </span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-0.5 w-5 border-t-2 border-dashed border-fog" />{" "}
              Plan
            </span>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${chart.W} ${chart.H}`}
            className="h-auto w-full min-w-[480px]"
            role="img"
            aria-label="Actual balance against the plan"
          >
            {chart.ticks.map((t) => {
              const yy = 12 + (1 - t) * (chart.H - chart.padB - 12);
              return (
                <g key={t}>
                  <line
                    x1={chart.padL}
                    x2={chart.W - 12}
                    y1={yy}
                    y2={yy}
                    stroke="#E7EFE9"
                    strokeWidth="1"
                  />
                  <text
                    x={chart.padL - 6}
                    y={yy + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="700"
                    fill="#7A8A80"
                  >
                    {compact(chart.peak * t)}
                  </text>
                </g>
              );
            })}
            {chart.labels.map((p) => (
              <text
                key={p.month}
                x={chart.x(p.month)}
                y={chart.H - 8}
                textAnchor={
                  p.month === goal.months
                    ? "end"
                    : p.month === 0
                      ? "start"
                      : "middle"
                }
                fontSize="10"
                fontWeight="700"
                fill="#7A8A80"
              >
                {fmtDate(p.date)}
              </text>
            ))}
            {chart.todayX !== null && (
              <line
                x1={chart.todayX}
                x2={chart.todayX}
                y1={12}
                y2={chart.H - chart.padB}
                stroke="#0B2E1C"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.5"
              />
            )}
            <polyline
              points={chart.planPts}
              fill="none"
              stroke="#7A8A80"
              strokeWidth="2"
              strokeDasharray="6 4"
              strokeLinejoin="round"
            />
            {chart.actualPts && (
              <polyline
                points={chart.actualPts}
                fill="none"
                stroke="#0FA53A"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* the entries */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line bg-haze px-5 py-3">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
            ENTRIES · {entries.length}
          </span>
          <button
            type="button"
            onClick={() => openEntry()}
            className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] font-extrabold text-brand-600 hover:text-brand-500"
          >
            + Log entry
          </button>
        </div>
        {entries.length === 0 ? (
          <p className="m-0 px-5 py-10 text-center text-[14px] font-bold text-bark">
            Nothing logged yet. Add the first deposit.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {["DATE", "TYPE", "AMOUNT", "NOTE", "BY", ""].map((h, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const k = KIND_META[e.kind];
                  return (
                    <tr
                      key={e._id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold text-ink">
                        {fmtDate(e.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-bark">
                        {k.label}
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-[13px] font-extrabold tabular-nums",
                          k.cls,
                        )}
                      >
                        {k.sign}
                        {fmtNaira(e.amount)}
                      </td>
                      <td className="max-w-[260px] px-4 py-3 text-[12.5px] font-medium text-bark">
                        {e.note || "·"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold text-fog">
                        {e.addedByName || "·"}
                        {e.edits.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setHistoryFor(e)}
                            className="ml-2 inline-flex cursor-pointer items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] font-extrabold text-amber-700"
                          >
                            <History size={11} strokeWidth={3} /> edited{" "}
                            {e.edits.length}x
                          </button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEntry(e)}
                          title="Correct"
                          className="cursor-pointer rounded-lg border border-line bg-white p-1.5 text-bark hover:border-brand-500"
                        >
                          <Pencil size={13} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteEntryFor(e)}
                          title="Remove"
                          className="ml-1.5 cursor-pointer rounded-lg border border-line bg-white p-1.5 text-red-600 hover:border-red-400"
                        >
                          <Trash2 size={13} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="mt-4 cursor-pointer border-none bg-transparent p-0 text-[12px] font-extrabold text-red-600 hover:text-red-500"
      >
        Delete this goal and all its entries
      </button>

      {/* entry add / correct */}
      <Modal
        title={entryModal?.item ? "Correct entry" : "Log entry"}
        open={!!entryModal}
        onClose={() => setEntryModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "flex-1 cursor-pointer rounded-[10px] border px-3 py-2.5 text-[13px] font-extrabold",
                  kind === k
                    ? "cta-gradient border-transparent text-forest-deep"
                    : "border-line bg-white text-bark hover:border-brand-500",
                )}
              >
                {KIND_META[k].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="entry-date" className={labelClasses}>
                Date
              </label>
              <input
                id="entry-date"
                type="date"
                value={date}
                min={goal.startDate}
                max={todayIso()}
                onChange={(e) => setDate(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="entry-amount" className={labelClasses}>
                Amount (₦)
              </label>
              <input
                id="entry-amount"
                type="number"
                min="0"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClasses}
                autoFocus
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="entry-note" className={labelClasses}>
              Note (optional)
            </label>
            <input
              id="entry-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                kind === "interest"
                  ? "e.g. Q1 interest per statement"
                  : kind === "withdrawal"
                    ? "What it was taken out for"
                    : "e.g. March profit"
              }
              className={inputClasses}
            />
          </div>
          {entryModal?.item && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="entry-edit-note" className={labelClasses}>
                Why the correction
              </label>
              <input
                id="entry-edit-note"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Kept in the history log"
                className={inputClasses}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEntryModal(null)}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                !canSaveEntry || createEntry.isPending || updateEntry.isPending
              }
              onClick={saveEntry}
              className="cta-gradient cursor-pointer rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createEntry.isPending || updateEntry.isPending
                ? "Saving..."
                : entryModal?.item
                  ? "Save correction"
                  : "Log it"}
            </button>
          </div>
        </div>
      </Modal>

      {/* history */}
      <Modal
        title="Edit history"
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
      >
        <div className="flex flex-col gap-3">
          {historyFor?.edits.map((ed, i) => (
            <div
              key={i}
              className="rounded-xl border border-line bg-haze p-3 text-[12.5px]"
            >
              <div className="mb-1 flex justify-between font-extrabold text-ink">
                <span>{ed.byName || "Someone"}</span>
                <span className="text-fog">
                  {fmtDate(ed.at)} · {fmtTime(ed.at)}
                </span>
              </div>
              <div className="font-semibold text-bark">
                {KIND_META[ed.from.kind].label} {fmtNaira(ed.from.amount)} on{" "}
                {fmtDate(ed.from.date)}
                {" → "}
                {KIND_META[ed.to.kind].label} {fmtNaira(ed.to.amount)} on{" "}
                {fmtDate(ed.to.date)}
              </div>
              {ed.from.note !== ed.to.note && (
                <div className="mt-0.5 text-fog">
                  note: "{ed.from.note || "·"}" → "{ed.to.note || "·"}"
                </div>
              )}
              {ed.note && (
                <div className="mt-1 italic text-bark">"{ed.note}"</div>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* plan settings */}
      <Modal
        title="Edit plan"
        open={settings}
        onClose={() => setSettings(false)}
      >
        <div className="flex flex-col gap-4">
          <p className="m-0 text-[12.5px] font-semibold text-fog">
            Changing the plan moves the target and the plan line. Entries stay
            as they are.
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-name" className={labelClasses}>
              Goal name
            </label>
            <input
              id="g-name"
              value={gName}
              onChange={(e) => setGName(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="g-daily" className={labelClasses}>
                Per day (₦)
              </label>
              <input
                id="g-daily"
                type="number"
                min="0"
                value={gDaily}
                onChange={(e) => setGDaily(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="g-rate" className={labelClasses}>
                Rate (% a year)
              </label>
              <input
                id="g-rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={gRate}
                onChange={(e) => setGRate(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="g-months" className={labelClasses}>
                Months
              </label>
              <input
                id="g-months"
                type="number"
                min="1"
                max="600"
                value={gMonths}
                onChange={(e) => setGMonths(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="g-start" className={labelClasses}>
                Start date
              </label>
              <input
                id="g-start"
                type="date"
                value={gStart}
                onChange={(e) => setGStart(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="g-account" className={labelClasses}>
                Where the money sits
              </label>
              <input
                id="g-account"
                value={gAccount}
                onChange={(e) => setGAccount(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-note" className={labelClasses}>
              Note
            </label>
            <textarea
              id="g-note"
              rows={2}
              value={gNote}
              onChange={(e) => setGNote(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSettings(false)}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSaveGoal || updateGoal.isPending}
              onClick={saveGoal}
              className="cta-gradient cursor-pointer rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateGoal.isPending ? "Saving..." : "Save plan"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteEntryFor}
        title="Remove entry?"
        message={
          deleteEntryFor
            ? `Remove the ${KIND_META[deleteEntryFor.kind].label.toLowerCase()} of ${fmtNaira(deleteEntryFor.amount)} on ${fmtDate(deleteEntryFor.date)}? This cannot be undone.`
            : ""
        }
        loading={deleteEntry.isPending}
        onConfirm={() =>
          deleteEntryFor &&
          deleteEntry.mutate(
            { goalId: goal._id, entryId: deleteEntryFor._id },
            { onSuccess: () => setDeleteEntryFor(null) },
          )
        }
        onClose={() => setDeleteEntryFor(null)}
      />
      <ConfirmModal
        open={confirmArchive}
        title="Archive this goal?"
        message="It moves to the archived list and stops counting as active. You can reactivate it later."
        confirmLabel="Yes, archive"
        loading={updateGoal.isPending}
        onConfirm={() =>
          updateGoal.mutate(
            { id: goal._id, payload: { status: "archived" } },
            { onSuccess: () => setConfirmArchive(false) },
          )
        }
        onClose={() => setConfirmArchive(false)}
      />
      <ConfirmModal
        open={confirmDelete}
        title="Delete this goal?"
        message={`${goal.name} and all ${entries.length} entries will be removed for good.`}
        confirmLabel="Yes, delete"
        loading={deleteGoal.isPending}
        onConfirm={() =>
          deleteGoal.mutate(goal._id, { onSuccess: () => navigate("/goals") })
        }
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
