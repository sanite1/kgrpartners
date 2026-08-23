import { useState } from "react";
import { Plus, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Skeleton from "../components/console/Skeleton";
import Modal from "../components/console/Modal";
import ConfirmModal from "../components/console/ConfirmModal";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetFinanceOverview,
  useGetFinanceMonths,
  useGetFinanceEntries,
  useCreateFinanceEntry,
  useBuyDown,
  useDeleteFinanceEntry,
} from "@/lib/network/api/finance.api";
import type {
  FinanceEntry,
  FinanceEntryKind,
} from "@/lib/network/types/finance.types";
import { cn, fmtDate, fmtNaira } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

const KIND_META: Record<
  FinanceEntryKind,
  { label: string; plural: string; tone: string; hint: string }
> = {
  investment: {
    label: "Investment",
    plural: "Investments",
    tone: "bg-brand-50 text-brand-600",
    hint: "Money put into the business",
  },
  loan: {
    label: "Loan",
    plural: "Loans",
    tone: "bg-[#FDF6E3] text-solar-700",
    hint: "Money borrowed; repayments bring it down",
  },
  repayment: {
    label: "Repayment",
    plural: "Repayments",
    tone: "bg-blue-50 text-blue-600",
    hint: "Money paid back on loans or debt",
  },
  other_debt: {
    label: "Other debt",
    plural: "Other debt",
    tone: "bg-red-50 text-red-600",
    hint: "Owed outside loans: suppliers, levies",
  },
  salary: {
    label: "Salary",
    plural: "Salaries",
    tone: "bg-mist text-bark",
    hint: "One total per month, it joins the profit formula",
  },
};

const KINDS: FinanceEntryKind[] = [
  "investment",
  "loan",
  "repayment",
  "other_debt",
  "salary",
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[(m || 1) - 1]} ${y}`;
};
const thisMonthKey = () => new Date().toISOString().slice(0, 7);

const thClasses =
  "whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog";
const tdClasses =
  "whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-bark";

// The money behind the operation: what went in, what is owed, what the
// months actually made, and the one verdict the owner wants: up or down.
export default function Finance() {
  const [kind, setKind] = useState<FinanceEntryKind>("investment");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // add entry modal
  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<FinanceEntryKind>("investment");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState(thisMonthKey());
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [loanId, setLoanId] = useState("");

  // buy-down modal
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyMonth, setBuyMonth] = useState(thisMonthKey());
  const [percent, setPercent] = useState("10");
  const [buyLoanId, setBuyLoanId] = useState("");
  const [buyNote, setBuyNote] = useState("");

  const [deleteFor, setDeleteFor] = useState<FinanceEntry | null>(null);

  const { data: overviewData, isLoading: overviewLoading } =
    useGetFinanceOverview();
  const overview = overviewData?.data;
  const totals = overview?.totals;
  const cur = overview?.thisMonth;
  const verdict = overview?.verdict;

  const { data: monthsData } = useGetFinanceMonths(12);
  const months = monthsData?.data?.months ?? [];

  const {
    data: entriesData,
    isLoading: entriesLoading,
    isError: entriesError,
    refetch: refetchEntries,
  } = useGetFinanceEntries({ kind, page, pageSize });
  const entries = entriesData?.data ?? [];
  const pagination = entriesData?.pagination;

  // loans to tie a repayment or buy-down to
  const { data: loansData } = useGetFinanceEntries(
    { kind: "loan", pageSize: 100 },
    { enabled: addOpen || buyOpen },
  );
  const loans = loansData?.data ?? [];

  const createEntry = useCreateFinanceEntry();
  const buyDown = useBuyDown();
  const deleteEntry = useDeleteFinanceEntry();

  const openAdd = (k: FinanceEntryKind) => {
    setAddKind(k);
    setAmount("");
    setDate("");
    setMonth(thisMonthKey());
    setLabel("");
    setNote("");
    setLoanId("");
    setAddOpen(true);
  };

  const amountNum = Number(amount);
  const canAdd = amountNum > 0;

  const buyRow = months.find((m) => m.month === buyMonth);
  const percentNum = Number(percent);
  const buyPreview =
    buyRow && buyRow.profit > 0 && percentNum > 0
      ? Math.min(buyRow.kept, (buyRow.profit * percentNum) / 100)
      : 0;

  const verdictMeta =
    verdict?.direction === "up"
      ? {
          Icon: TrendingUp,
          cls: "border-brand-200 bg-brand-50 text-brand-600",
          word: "Going up",
        }
      : verdict?.direction === "down"
        ? {
            Icon: TrendingDown,
            cls: "border-red-200 bg-red-50 text-red-600",
            word: "Going down",
          }
        : {
            Icon: Minus,
            cls: "border-line bg-white text-bark",
            word: "Holding steady",
          };

  const loanTitle = (e: FinanceEntry) =>
    e.loan && typeof e.loan === "object"
      ? `${e.loan.label || "Loan"} (${fmtNaira(e.loan.amount)})`
      : "";

  return (
    <>
      <PageMeta title="Finance | KGR Console" />
      <PageHead
        eyebrow="THE MONEY BEHIND IT"
        title="Finance"
        subtitle="Investments, loans, debt and what each month really made."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBuyMonth(thisMonthKey());
                setPercent("10");
                setBuyLoanId("");
                setBuyNote("");
                setBuyOpen(true);
              }}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              Buy down loan
            </button>
            <button
              type="button"
              onClick={() => openAdd(kind)}
              className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={3} /> Add entry
            </button>
          </div>
        }
      />

      {/* the verdict */}
      <div
        className={cn(
          "mb-5 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4",
          verdictMeta.cls,
        )}
      >
        <verdictMeta.Icon size={22} strokeWidth={2.5} />
        <div className="flex flex-col">
          <span className="text-[16px] font-extrabold">
            {overviewLoading ? "Working it out…" : verdictMeta.word}
          </span>
          {!overviewLoading && cur && (
            <span className="text-[12.5px] font-semibold opacity-90">
              {verdict?.compared && verdict.profitChangePct !== null
                ? `${monthLabel(verdict.compared.latest)} profit ${verdict.profitChangePct > 0 ? "+" : ""}${verdict.profitChangePct}% vs ${monthLabel(verdict.compared.before)}`
                : "Not enough finished months to compare yet"}
              {" · this month so far "}
              {fmtNaira(cur.profit)}
              {" · "}
              {verdict && verdict.repaidThisMonth > 0
                ? `debt down ${fmtNaira(verdict.repaidThisMonth)} this month`
                : "no repayment this month yet"}
            </span>
          )}
        </div>
      </div>

      {/* the four numbers */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["INVESTED", totals?.invested, "dark"],
            ["DEBT OUTSTANDING", totals?.debtOutstanding, "debt"],
            ["PROFIT THIS MONTH", cur?.profit, "profit"],
            ["RETAINED PROFIT", totals?.retainedProfit, "plain"],
          ] as const
        ).map(([tileLabel, value, kindOf]) => {
          const v = value ?? 0;
          const dark = kindOf === "dark";
          const red =
            (kindOf === "debt" && v > 0) || (kindOf === "profit" && v < 0);
          return (
            <div
              key={tileLabel}
              className={cn(
                "rounded-2xl border p-4",
                dark
                  ? "border-forest-border bg-forest-deep"
                  : red
                    ? "border-red-200 bg-red-50"
                    : "border-line bg-white",
              )}
            >
              {overviewLoading ? (
                <Skeleton className={cn("h-6 w-20", dark && "bg-white/15")} />
              ) : (
                <span
                  className={cn(
                    "block text-[20px] font-extrabold leading-none tabular-nums",
                    dark ? "text-neon" : red ? "text-red-600" : "text-ink",
                  )}
                >
                  {fmtNaira(v)}
                </span>
              )}
              <span
                className={cn(
                  "mt-1.5 block text-[11px] font-extrabold tracking-[1px]",
                  dark ? "text-mint" : "text-fog",
                )}
              >
                {tileLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* this month, line by line */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line bg-haze px-5 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog">
          {cur ? monthLabel(cur.month).toUpperCase() : "THIS MONTH"} · HOW THE
          PROFIT IS WORKED OUT
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-[13.5px] font-semibold text-bark sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Revenue collected", cur?.revenue, ""],
              ["minus Expenditures", cur?.expenses, "text-fog"],
              ["minus Salaries", cur?.salary, "text-fog"],
              ["= Profit", cur?.profit, "font-extrabold text-ink"],
              ["Loan buy-down", cur?.buyDown, "text-blue-600"],
              ["Kept as profit", cur?.kept, "font-extrabold text-brand-600"],
            ] as const
          ).map(([k, v, extra]) => (
            <div key={k} className="flex flex-col">
              <span className="text-[11px] font-extrabold tracking-[1px] text-fog">
                {k.toUpperCase()}
              </span>
              <span className={cn("tabular-nums", extra)}>
                {overviewLoading ? "…" : fmtNaira(v ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* the months */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line bg-haze px-5 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog">
          LAST 12 MONTHS
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {[
                  "MONTH",
                  "REVENUE",
                  "EXPENDITURES",
                  "SALARIES",
                  "PROFIT",
                  "BUY-DOWN",
                  "KEPT",
                ].map((h) => (
                  <th key={h} className={thClasses}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-line last:border-0">
                  <td className={cn(tdClasses, "font-extrabold text-ink")}>
                    {monthLabel(m.month)}
                  </td>
                  <td className={tdClasses}>{fmtNaira(m.revenue)}</td>
                  <td className={cn(tdClasses, "text-fog")}>
                    {fmtNaira(m.expenses)}
                  </td>
                  <td className={cn(tdClasses, "text-fog")}>
                    {fmtNaira(m.salary)}
                  </td>
                  <td
                    className={cn(
                      tdClasses,
                      "font-extrabold",
                      m.profit < 0 ? "text-red-600" : "text-ink",
                    )}
                  >
                    {fmtNaira(m.profit)}
                  </td>
                  <td className={cn(tdClasses, "text-blue-600")}>
                    {m.buyDown ? fmtNaira(m.buyDown) : "-"}
                  </td>
                  <td
                    className={cn(
                      tdClasses,
                      "font-extrabold",
                      m.kept < 0 ? "text-red-600" : "text-brand-600",
                    )}
                  >
                    {fmtNaira(m.kept)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* the ledger, by kind */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
                kind === k
                  ? "cta-gradient text-forest-deep"
                  : "bg-transparent text-fog hover:text-bark",
              )}
            >
              {KIND_META[k].plural}
            </button>
          ))}
        </div>
        <span className="text-[12.5px] font-semibold text-fog">
          {KIND_META[kind].hint}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-haze">
                {[
                  "S/N",
                  "DATE",
                  kind === "salary" ? "MONTH" : "LABEL",
                  "AMOUNT",
                  "DETAIL",
                  "BY",
                  "",
                ].map((h, i) => (
                  <th key={`${h}-${i}`} className={thClasses}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e._id} className="border-b border-line last:border-0">
                  <td className={cn(tdClasses, "text-fog")}>
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  <td className={cn(tdClasses, "font-extrabold text-ink")}>
                    {fmtDate(e.date)}
                  </td>
                  <td className={tdClasses}>
                    {kind === "salary" ? monthLabel(e.month) : e.label || "-"}
                  </td>
                  <td className={cn(tdClasses, "font-extrabold text-ink")}>
                    {fmtNaira(e.amount)}
                  </td>
                  <td className={cn(tdClasses, "text-fog")}>
                    {[
                      e.fromProfitPercent
                        ? `${e.fromProfitPercent}% of ${monthLabel(e.month)} profit`
                        : "",
                      loanTitle(e) ? `on ${loanTitle(e)}` : "",
                      e.note,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </td>
                  <td className={cn(tdClasses, "text-fog")}>{e.byName || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      aria-label="Remove entry"
                      onClick={() => setDeleteFor(e)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entriesLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}
        {!entriesLoading && entriesError && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="m-0 text-[15px] font-bold text-red-600">
              Could not load the ledger.
            </p>
            <button
              type="button"
              onClick={() => refetchEntries()}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              Try again
            </button>
          </div>
        )}
        {!entriesLoading && !entriesError && entries.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              No {KIND_META[kind].plural.toLowerCase()} recorded yet.
            </p>
          </div>
        )}
      </div>
      <Pagination
        pagination={pagination}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />

      {/* add entry */}
      <Modal
        title={`Add ${KIND_META[addKind].label.toLowerCase()}`}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>What is it?</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAddKind(k)}
                  className={cn(
                    "cursor-pointer rounded-[10px] border px-2 py-2.5 text-[12.5px] font-extrabold transition-colors",
                    addKind === k
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500",
                  )}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>
            <span className="text-[12px] font-semibold text-fog">
              {KIND_META[addKind].hint}.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fn-amount" className={labelClasses}>
                Amount (₦) <span className="text-brand-500">*</span>
              </label>
              <input
                id="fn-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClasses}
              />
            </div>
            {addKind === "salary" ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fn-month" className={labelClasses}>
                  Month <span className="text-brand-500">*</span>
                </label>
                <input
                  id="fn-month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className={inputClasses}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fn-date" className={labelClasses}>
                  Date
                </label>
                <input
                  id="fn-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClasses}
                />
              </div>
            )}
          </div>
          {addKind !== "salary" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fn-label" className={labelClasses}>
                {addKind === "investment"
                  ? "From whom"
                  : addKind === "loan"
                    ? "Lender"
                    : addKind === "other_debt"
                      ? "Owed to / for what"
                      : "Label"}
              </label>
              <input
                id="fn-label"
                type="text"
                maxLength={120}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputClasses}
                autoComplete="off"
              />
            </div>
          )}
          {addKind === "repayment" && loans.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fn-loan" className={labelClasses}>
                Which loan (optional)
              </label>
              <select
                id="fn-loan"
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                className={inputClasses}
              >
                <option value="">General debt</option>
                {loans.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.label || "Loan"} · {fmtNaira(l.amount)} ·{" "}
                    {fmtDate(l.date)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fn-note" className={labelClasses}>
              Note
            </label>
            <input
              id="fn-note"
              type="text"
              maxLength={500}
              placeholder="Optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            disabled={!canAdd || createEntry.isPending}
            onClick={() =>
              createEntry.mutate(
                {
                  kind: addKind,
                  amount: amountNum,
                  date: date || undefined,
                  month: addKind === "salary" ? month : undefined,
                  label: label.trim() || undefined,
                  note: note.trim() || undefined,
                  loanId:
                    addKind === "repayment" && loanId ? loanId : undefined,
                },
                {
                  onSuccess: () => {
                    setAddOpen(false);
                    setKind(addKind);
                    setPage(1);
                  },
                },
              )
            }
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createEntry.isPending ? "Saving…" : "Save entry →"}
          </button>
        </div>
      </Modal>

      {/* buy down */}
      <Modal
        title="Buy down the loan from profit"
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <p className="m-0 text-[13px] font-semibold text-fog">
            Pick a month and a share of its profit. The amount is paid
            toward the loan, and what is left stays as kept profit.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bd-month" className={labelClasses}>
                Month
              </label>
              <input
                id="bd-month"
                type="month"
                value={buyMonth}
                onChange={(e) => setBuyMonth(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bd-percent" className={labelClasses}>
                Share of profit (%)
              </label>
              <input
                id="bd-percent"
                type="number"
                min="1"
                max="100"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          {loans.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bd-loan" className={labelClasses}>
                Which loan (optional)
              </label>
              <select
                id="bd-loan"
                value={buyLoanId}
                onChange={(e) => setBuyLoanId(e.target.value)}
                className={inputClasses}
              >
                <option value="">General debt</option>
                {loans.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.label || "Loan"} · {fmtNaira(l.amount)} ·{" "}
                    {fmtDate(l.date)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="rounded-xl border border-line bg-haze px-4 py-3 text-[13px] font-semibold text-bark">
            {buyRow ? (
              buyRow.profit > 0 ? (
                <>
                  {monthLabel(buyMonth)} profit {fmtNaira(buyRow.profit)}
                  {buyRow.buyDown > 0 &&
                    `, ${fmtNaira(buyRow.buyDown)} already bought down`}
                  . This buy-down:{" "}
                  <strong className="text-ink">{fmtNaira(buyPreview)}</strong>
                  , leaving {fmtNaira(buyRow.kept - buyPreview)} kept.
                </>
              ) : (
                <span className="text-red-600">
                  {monthLabel(buyMonth)} made no profit to buy down from.
                </span>
              )
            ) : (
              "Pick one of the last 12 months."
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bd-note" className={labelClasses}>
              Note
            </label>
            <input
              id="bd-note"
              type="text"
              maxLength={500}
              placeholder="Optional"
              value={buyNote}
              onChange={(e) => setBuyNote(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            disabled={buyPreview <= 0 || buyDown.isPending}
            onClick={() =>
              buyDown.mutate(
                {
                  month: buyMonth,
                  percent: percentNum,
                  loanId: buyLoanId || undefined,
                  note: buyNote.trim() || undefined,
                },
                { onSuccess: () => setBuyOpen(false) },
              )
            }
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buyDown.isPending ? "Saving…" : `Buy down ${fmtNaira(buyPreview)} →`}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteFor !== null}
        title="Remove this entry?"
        message={
          <>
            Remove the{" "}
            <strong>{deleteFor ? KIND_META[deleteFor.kind].label.toLowerCase() : ""}</strong>{" "}
            of <strong>{fmtNaira(deleteFor?.amount ?? 0)}</strong> (
            {deleteFor ? fmtDate(deleteFor.date) : ""})? Totals and the
            months recalculate. This cannot be undone.
          </>
        }
        confirmLabel="Yes, remove"
        loading={deleteEntry.isPending}
        onConfirm={() =>
          deleteFor &&
          deleteEntry.mutate(deleteFor._id, {
            onSuccess: () => setDeleteFor(null),
          })
        }
        onClose={() => setDeleteFor(null)}
      />
    </>
  );
}
