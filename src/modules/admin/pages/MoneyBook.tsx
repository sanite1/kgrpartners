import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Repeat,
  Search,
  Trash2,
} from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Skeleton from "../components/console/Skeleton";
import Modal from "../components/console/Modal";
import ConfirmModal from "../components/console/ConfirmModal";
import {
  useGetMoneyBookOverview,
  useGetMoneyBookEntries,
  useGetMoneyBookReports,
  useGetMoneyBookMeta,
  useCreateMoneyBookEntry,
  useUpdateMoneyBookEntry,
  useDeleteMoneyBookEntry,
  useCreateMoneyBookCategory,
  useUpdateMoneyBookCategory,
  useDeleteMoneyBookCategory,
  useCreateMoneyBookAccount,
  useDeleteMoneyBookAccount,
} from "@/lib/network/api/moneyBook.api";
import type {
  MoneyBookEntry,
  MoneyBookCategory,
  MoneyBookType,
  MoneyBookSlice,
} from "@/lib/network/types/moneyBook.types";
import { cn, fmtDate, fmtNaira } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

type Tab = "overview" | "transactions" | "reports" | "categories";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "transactions", label: "Transactions" },
  { id: "reports", label: "Reports" },
  { id: "categories", label: "Categories" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[(m || 1) - 1]} ${y}`;
};
const shortMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[(m || 1) - 1].slice(0, 3)} '${String(y).slice(2)}`;
};
// Lagos calendar days, like the backend's dayString(); toISOString
// would hand back yesterday between midnight and 1am
const lagosIso = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
const todayIso = () => lagosIso(new Date());
const shiftMonth = (ym: string, by: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
};
const shiftDay = (by: number) => {
  const d = new Date();
  d.setDate(d.getDate() + by);
  return lagosIso(d);
};
// ₦1,234,567 reads as ₦1.2m above a bar
const compact = (n: number) => {
  if (n >= 1_000_000)
    return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
};

const PALETTE = [
  "#0FA53A",
  "#2563EB",
  "#F59E0B",
  "#7C3AED",
  "#DC2626",
  "#0891B2",
  "#78716C",
  "#DB2777",
  "#6B7280",
  "#16A34A",
];

// a donut drawn with one conic gradient; no chart library needed
const Donut = ({ slices }: { slices: MoneyBookSlice[] }) => {
  const total = slices.reduce((s, x) => s + x.amount, 0);
  let acc = 0;
  const stops = slices
    .map((s) => {
      const from = acc;
      acc += total > 0 ? (s.amount / total) * 100 : 0;
      return `${s.color} ${from}% ${acc}%`;
    })
    .join(", ");
  return (
    <div
      className="relative h-[150px] w-[150px] shrink-0 rounded-full"
      style={{
        background:
          total > 0 ? `conic-gradient(${stops})` : "var(--color-mist, #E7EFE9)",
      }}
    >
      <div className="absolute inset-[26px] flex items-center justify-center rounded-full bg-white">
        <span className="text-[12px] font-extrabold text-ink">
          {compact(total)}
        </span>
      </div>
    </div>
  );
};

// entries grouped by day, newest day first, with a day total
const groupByDay = (entries: MoneyBookEntry[]) => {
  const map = new Map<string, MoneyBookEntry[]>();
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, rows]) => ({
      date,
      rows,
      expense: rows
        .filter((r) => r.type === "expense")
        .reduce((s, r) => s + Number(r.amount), 0),
      income: rows
        .filter((r) => r.type === "income")
        .reduce((s, r) => s + Number(r.amount), 0),
    }));
};

const dayTitle = (date: string) => {
  if (date === todayIso()) return "Today";
  if (date === shiftDay(-1)) return "Yesterday";
  return fmtDate(date);
};

// The Money Book: the team's own money manager for purchases. Written
// by hand, in categories they own, with budgets, reports and recurring
// entries, modelled on the app the client demonstrated.
export default function MoneyBook() {
  const [tab, setTab] = useState<Tab>("overview");
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MoneyBookType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [reportMode, setReportMode] = useState<"expense" | "income" | "net">(
    "expense",
  );
  const [trendMonths, setTrendMonths] = useState(6);

  const { data: metaData } = useGetMoneyBookMeta();
  const categories = metaData?.data?.categories ?? [];
  const accounts = metaData?.data?.accounts ?? [];

  const { data: overviewData, isLoading: overviewLoading } =
    useGetMoneyBookOverview(month, { enabled: tab === "overview" });
  const overview = overviewData?.data;

  const {
    data: entriesData,
    isLoading: entriesLoading,
    isError: entriesError,
    refetch: refetchEntries,
  } = useGetMoneyBookEntries(
    {
      month,
      search: search || undefined,
      type: typeFilter === "all" ? undefined : typeFilter,
      categoryId: categoryFilter || undefined,
    },
    { enabled: tab === "transactions" },
  );
  const entryTotals = entriesData?.data?.totals;

  const { data: reportsData, isLoading: reportsLoading } =
    useGetMoneyBookReports(month, trendMonths, { enabled: tab === "reports" });
  const reports = reportsData?.data;

  // entry form (add or edit)
  const [entryModal, setEntryModal] = useState<null | {
    item?: MoneyBookEntry;
  }>(null);
  const [fType, setFType] = useState<MoneyBookType>("expense");
  const [fAmount, setFAmount] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fAccount, setFAccount] = useState("");
  const [fDate, setFDate] = useState(todayIso());
  const [fQty, setFQty] = useState("");
  const [fUnit, setFUnit] = useState("");
  const [fUsd, setFUsd] = useState("");
  const [fNote, setFNote] = useState("");
  const [fRecurring, setFRecurring] = useState(false);
  const [deleteFor, setDeleteFor] = useState<MoneyBookEntry | null>(null);

  // category form
  const [catModal, setCatModal] = useState<null | { item?: MoneyBookCategory }>(
    null,
  );
  const [cName, setCName] = useState("");
  const [cColor, setCColor] = useState(PALETTE[0]);
  const [cBudget, setCBudget] = useState("");
  const [deleteCat, setDeleteCat] = useState<MoneyBookCategory | null>(null);
  const [newAccount, setNewAccount] = useState("");
  const [deleteAcc, setDeleteAcc] = useState<{
    _id: string;
    name: string;
  } | null>(null);

  const createEntry = useCreateMoneyBookEntry();
  const updateEntry = useUpdateMoneyBookEntry();
  const deleteEntry = useDeleteMoneyBookEntry();
  const createCategory = useCreateMoneyBookCategory();
  const updateCategory = useUpdateMoneyBookCategory();
  const deleteCategory = useDeleteMoneyBookCategory();
  const createAccount = useCreateMoneyBookAccount();
  const deleteAccount = useDeleteMoneyBookAccount();

  const openEntry = (item?: MoneyBookEntry) => {
    setFType(item?.type ?? "expense");
    setFAmount(item ? String(Number(item.amount)) : "");
    setFTitle(item?.title ?? "");
    setFCategory(item?.category ? String(item.category) : "");
    setFAccount(
      item?.account ? String(item.account) : (accounts[0]?._id ?? ""),
    );
    setFDate(item?.date ?? todayIso());
    setFQty(item?.quantity ? String(item.quantity) : "");
    setFUnit(item?.unitPrice ? String(Number(item.unitPrice)) : "");
    setFUsd(item?.usdAmount ? String(Number(item.usdAmount)) : "");
    setFNote(item?.note ?? "");
    setFRecurring(item?.recurring ?? false);
    setEntryModal({ item });
  };
  const amountNum = Number(fAmount);
  const canSaveEntry = fTitle.trim().length > 0 && amountNum > 0 && !!fDate;
  const saveEntry = () => {
    const payload = {
      type: fType,
      date: fDate,
      title: fTitle.trim(),
      amount: amountNum,
      quantity: fQty ? Number(fQty) : null,
      unitPrice: fUnit ? Number(fUnit) : null,
      usdAmount: fUsd ? Number(fUsd) : null,
      categoryId: fCategory || null,
      accountId: fAccount || null,
      note: fNote.trim(),
      recurring: fRecurring,
    };
    if (entryModal?.item) {
      updateEntry.mutate(
        { id: entryModal.item._id, payload },
        { onSuccess: () => setEntryModal(null) },
      );
    } else {
      createEntry.mutate(payload, { onSuccess: () => setEntryModal(null) });
    }
  };
  // quantity × unit price fills the amount when both are typed
  const applyQtyPrice = (qty: string, unit: string) => {
    const q = Number(qty);
    const u = Number(unit);
    if (q > 0 && u > 0) setFAmount(String(Math.round(q * u * 100) / 100));
  };

  const openCategory = (item?: MoneyBookCategory) => {
    setCName(item?.name ?? "");
    setCColor(item?.color ?? PALETTE[categories.length % PALETTE.length]);
    setCBudget(item?.monthlyBudget ? String(item.monthlyBudget) : "");
    setCatModal({ item });
  };
  const saveCategory = () => {
    const payload = {
      name: cName.trim(),
      color: cColor,
      monthlyBudget: cBudget ? Number(cBudget) : null,
    };
    if (catModal?.item) {
      updateCategory.mutate(
        { id: catModal.item._id, payload },
        { onSuccess: () => setCatModal(null) },
      );
    } else {
      createCategory.mutate(payload, { onSuccess: () => setCatModal(null) });
    }
  };

  const grouped = useMemo(
    () => groupByDay(entriesData?.data?.entries ?? []),
    [entriesData?.data?.entries],
  );
  const recentGrouped = useMemo(
    () => groupByDay(overview?.recent ?? []),
    [overview?.recent],
  );
  const monthlyMax = Math.max(
    1,
    ...(overview?.monthly ?? []).map((m) => m.expense),
  );
  const slices =
    reportMode === "income"
      ? (reports?.incomeByCategory ?? [])
      : (reports?.spendingByCategory ?? []);
  const trend = reports?.trend ?? [];
  const trendMax = Math.max(
    1,
    ...trend.map((t) =>
      reportMode === "net" ? Math.abs(t.net) : Math.max(t.expense, t.income),
    ),
  );

  const monthPicker = (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => setMonth((m) => shiftMonth(m, -1))}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-bark hover:bg-haze"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[150px] text-center text-[13.5px] font-extrabold text-ink">
        {monthLabel(month)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => setMonth((m) => shiftMonth(m, 1))}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-bark hover:bg-haze"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  const entryRow = (e: MoneyBookEntry) => (
    <div
      key={e._id}
      className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-9 w-9 shrink-0 rounded-xl"
          style={{
            background:
              categories.find((c) => c._id === String(e.category))?.color ??
              "#6B7280",
            opacity: 0.85,
          }}
        />
        <div className="min-w-0">
          <span className="block truncate text-[13.5px] font-extrabold text-ink">
            {e.title}
            {e.recurring && (
              <Repeat size={12} className="ml-1.5 inline text-blue-600" />
            )}
          </span>
          <span className="block truncate text-[11.5px] font-semibold text-fog">
            {e.categoryName || "Uncategorised"}
            {e.accountName ? ` · ${e.accountName}` : ""}
            {e.quantity
              ? ` · ${e.quantity} × ${fmtNaira(e.unitPrice ?? 0)}`
              : ""}
            {e.usdAmount ? ` · $${Number(e.usdAmount).toLocaleString()}` : ""}
            {e.note ? ` · ${e.note}` : ""}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "text-[13.5px] font-extrabold tabular-nums",
            e.type === "expense" ? "text-red-600" : "text-brand-600",
          )}
        >
          {e.type === "expense" ? "-" : "+"}
          {fmtNaira(e.amount)}
        </span>
        <button
          type="button"
          aria-label="Edit entry"
          onClick={() => openEntry(e)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          aria-label="Remove entry"
          onClick={() => setDeleteFor(e)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark hover:border-red-300 hover:text-red-600"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  const dayGroups = (groups: ReturnType<typeof groupByDay>) =>
    groups.map((g) => (
      <div
        key={g.date}
        className="overflow-hidden rounded-2xl border border-line bg-white"
      >
        <div className="flex items-center justify-between bg-haze px-4 py-2.5">
          <span className="text-[12.5px] font-extrabold text-ink">
            {dayTitle(g.date)}
            <span className="ml-2 text-[11px] font-semibold text-fog">
              {fmtDate(g.date)}
            </span>
          </span>
          <span className="flex items-center gap-2 text-[12px] font-extrabold tabular-nums">
            {g.income > 0 && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-600">
                +{fmtNaira(g.income)}
              </span>
            )}
            {g.expense > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">
                -{fmtNaira(g.expense)}
              </span>
            )}
          </span>
        </div>
        {g.rows.map(entryRow)}
      </div>
    ));

  return (
    <>
      <PageMeta title="Money Book | KGR Console" />
      <PageHead
        eyebrow="THE TEAM'S OWN LEDGER"
        title="Money Book"
        subtitle="Every purchase written in by the team, in categories you own, with budgets and reports."
        actions={
          <button
            type="button"
            onClick={() => openEntry()}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> Add entry
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
                tab === t.id
                  ? "cta-gradient text-forest-deep"
                  : "bg-transparent text-fog hover:text-bark",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab !== "categories" && tab !== "overview" && monthPicker}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="flex flex-col gap-3 lg:col-span-2">
              <div className="rounded-2xl border border-forest-border bg-forest-deep p-5">
                <span className="block text-[11px] font-extrabold tracking-[1px] text-mint">
                  SPENT · {monthLabel(month).toUpperCase()}
                </span>
                {overviewLoading ? (
                  <Skeleton className="mt-2 h-8 w-40 bg-white/15" />
                ) : (
                  <span className="mt-1 block text-[30px] font-extrabold leading-none text-neon">
                    {fmtNaira(overview?.totals.expense ?? 0)}
                  </span>
                )}
                <span className="mt-2 block text-[12px] font-semibold text-mint/80">
                  {overview?.totals.changePct === null ||
                  overview?.totals.changePct === undefined
                    ? `no spend recorded in ${monthLabel(shiftMonth(month, -1))}`
                    : `${overview.totals.changePct > 0 ? "+" : ""}${overview.totals.changePct}% vs ${monthLabel(shiftMonth(month, -1))} (${fmtNaira(overview.totals.lastMonthExpense)})`}
                </span>
                <div className="mt-4 flex h-[92px] items-end gap-1.5 sm:gap-2">
                  {(overview?.monthly ?? []).map((m) => {
                    const active = m.month === month;
                    return (
                      <button
                        key={m.month}
                        type="button"
                        onClick={() => setMonth(m.month)}
                        title={`${monthLabel(m.month)}: ${fmtNaira(m.expense)}`}
                        className="flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1 border-none bg-transparent p-0"
                      >
                        <span
                          className={cn(
                            "w-full max-w-[28px] rounded-t-sm transition-colors",
                            active ? "bg-neon" : "bg-neon/30 hover:bg-neon/60",
                          )}
                          style={{
                            height: `${Math.max(4, (m.expense / monthlyMax) * 100)}%`,
                          }}
                        />
                        <span
                          className={cn(
                            "whitespace-nowrap text-[9px] font-bold sm:text-[10px]",
                            active ? "text-neon" : "text-mint/60",
                          )}
                        >
                          {shortMonth(m.month).slice(0, 3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-center">{monthPicker}</div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-line bg-white p-4">
                <span className="block text-[11px] font-extrabold tracking-[1px] text-fog">
                  INCOME
                </span>
                <span className="mt-1 block text-[20px] font-extrabold tabular-nums text-brand-600">
                  {fmtNaira(overview?.totals.income ?? 0)}
                </span>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4">
                <span className="block text-[11px] font-extrabold tracking-[1px] text-fog">
                  EXPENSE · {overview?.totals.count ?? 0} ENTRIES
                </span>
                <span className="mt-1 block text-[20px] font-extrabold tabular-nums text-red-600">
                  {fmtNaira(overview?.totals.expense ?? 0)}
                </span>
              </div>
              <div
                className={cn(
                  "rounded-2xl border p-4",
                  (overview?.totals.net ?? 0) < 0
                    ? "border-red-200 bg-red-50"
                    : "border-line bg-white",
                )}
              >
                <span className="block text-[11px] font-extrabold tracking-[1px] text-fog">
                  NET
                </span>
                <span
                  className={cn(
                    "mt-1 block text-[20px] font-extrabold tabular-nums",
                    (overview?.totals.net ?? 0) < 0
                      ? "text-red-600"
                      : "text-ink",
                  )}
                >
                  {fmtNaira(overview?.totals.net ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* category budgets */}
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[14px] font-extrabold text-ink">
              Category budgets
            </span>
            <button
              type="button"
              onClick={() => setTab("categories")}
              className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
            >
              See all
            </button>
          </div>
          {(overview?.budgets ?? []).length === 0 ? (
            <p className="m-0 mb-5 rounded-2xl border border-dashed border-line bg-white px-4 py-4 text-[13px] font-semibold text-fog">
              No budgets set yet. Give a category a monthly budget on the
              Categories tab and it will show here with how much is used.
            </p>
          ) : (
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(overview?.budgets ?? []).map((b) => {
                const pct =
                  b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
                return (
                  <div
                    key={b.categoryId}
                    className="rounded-2xl border border-line bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink">
                        <span
                          className="h-3 w-3 rounded-sm"
                          style={{ background: b.color }}
                        />
                        {b.name}
                      </span>
                      <span
                        className={cn(
                          "text-[13px] font-extrabold tabular-nums",
                          pct > 100
                            ? "text-red-600"
                            : pct > 80
                              ? "text-solar-700"
                              : "text-fog",
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
                    <span className="mt-1 block text-[12px] font-semibold text-fog">
                      {fmtNaira(b.spent)} of {fmtNaira(b.budget)}
                    </span>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pct > 100 ? "bg-red-500" : "cta-gradient",
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-extrabold text-ink">
              Recent entries
            </span>
            <button
              type="button"
              onClick={() => setTab("transactions")}
              className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
            >
              See all
            </button>
          </div>
          {overviewLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
            </div>
          ) : recentGrouped.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
              <BoltMark width={22} height={29} fill="#B5ECC2" />
              <p className="m-0 text-[15px] font-bold text-bark">
                Nothing written for {monthLabel(month)} yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {dayGroups(recentGrouped)}
            </div>
          )}
        </>
      )}

      {/* TRANSACTIONS */}
      {tab === "transactions" && (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["expense", "Expenses"],
                  ["income", "Income"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTypeFilter(id)}
                  className={cn(
                    "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                    typeFilter === id
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
                  )}
                >
                  {label}
                </button>
              ))}
              <select
                aria-label="Category filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={cn(inputClasses, "w-auto py-2 sm:text-[13px]")}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative sm:w-[240px]">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
              />
              <input
                type="text"
                placeholder="Search entries"
                value={search}
                maxLength={80}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
              />
            </div>
          </div>
          <p className="m-0 mb-3 text-[12.5px] font-semibold text-fog">
            {entryTotals?.count ?? 0} entries · spent{" "}
            <strong className="text-red-600">
              {fmtNaira(entryTotals?.expense ?? 0)}
            </strong>
            {(entryTotals?.income ?? 0) > 0 && (
              <>
                {" "}
                · income{" "}
                <strong className="text-brand-600">
                  {fmtNaira(entryTotals?.income ?? 0)}
                </strong>
              </>
            )}
          </p>
          {entriesLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
            </div>
          ) : entriesError ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
              <p className="m-0 text-[15px] font-bold text-red-600">
                Could not load the entries.
              </p>
              <button
                type="button"
                onClick={() => refetchEntries()}
                className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink hover:border-brand-500"
              >
                Try again
              </button>
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
              <BoltMark width={22} height={29} fill="#B5ECC2" />
              <p className="m-0 text-[15px] font-bold text-bark">
                No entries for {monthLabel(month)}
                {search || typeFilter !== "all" || categoryFilter
                  ? " matching these filters."
                  : " yet."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">{dayGroups(grouped)}</div>
          )}
        </>
      )}

      {/* REPORTS */}
      {tab === "reports" && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
              {(
                [
                  ["expense", "Spending"],
                  ["income", "Income"],
                  ["net", "Net"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setReportMode(id)}
                  className={cn(
                    "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
                    reportMode === id
                      ? "cta-gradient text-forest-deep"
                      : "bg-transparent text-fog hover:text-bark",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
              {[6, 12, 24].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTrendMonths(n)}
                  className={cn(
                    "cursor-pointer rounded-lg border-none px-3 py-2 text-[12.5px] font-extrabold transition-colors",
                    trendMonths === n
                      ? "bg-forest-deep text-neon"
                      : "bg-transparent text-fog hover:text-bark",
                  )}
                >
                  {n} months
                </button>
              ))}
            </div>
          </div>

          {reportMode !== "net" && (
            <div className="mb-5 rounded-2xl border border-line bg-white p-5">
              <span className="block text-[14px] font-extrabold text-ink">
                {reportMode === "expense" ? "Spending" : "Income"} by category
              </span>
              <span className="block text-[12px] font-semibold text-fog">
                {monthLabel(month)} · total{" "}
                {fmtNaira(slices.reduce((s, x) => s + x.amount, 0))}
              </span>
              {reportsLoading ? (
                <Skeleton className="mt-4 h-[150px] w-[150px] rounded-full" />
              ) : slices.length === 0 ? (
                <p className="m-0 mt-4 text-[13px] font-semibold text-fog">
                  Nothing in this month yet.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <Donut slices={slices} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {slices.map((s) => (
                      <div
                        key={s.categoryId ?? "none"}
                        className="flex items-center justify-between gap-3 text-[13px] font-semibold"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-ink">
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm"
                            style={{ background: s.color }}
                          />
                          <span className="truncate">{s.name}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3 tabular-nums">
                          <span className="text-fog">{s.pct}%</span>
                          <span className="font-extrabold text-ink">
                            {fmtNaira(s.amount)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-line bg-white p-5">
            <span className="block text-[14px] font-extrabold text-ink">
              {reportMode === "expense"
                ? "Spending"
                : reportMode === "income"
                  ? "Income"
                  : "Net"}{" "}
              trend
            </span>
            <span className="block text-[12px] font-semibold text-fog">
              Last {trendMonths} months, ending {monthLabel(month)}
            </span>
            <div className="mt-5 flex h-[170px] items-end gap-1.5 sm:gap-3">
              {trend.map((t) => {
                const value =
                  reportMode === "expense"
                    ? t.expense
                    : reportMode === "income"
                      ? t.income
                      : t.net;
                const pct = (Math.abs(value) / trendMax) * 100;
                return (
                  <div
                    key={t.month}
                    className="flex flex-1 flex-col items-center gap-1"
                    title={`${monthLabel(t.month)}: spent ${fmtNaira(t.expense)}, income ${fmtNaira(t.income)}, net ${fmtNaira(t.net)}`}
                  >
                    <span
                      className={cn(
                        "whitespace-nowrap text-[9.5px] font-extrabold tabular-nums sm:text-[11px]",
                        value < 0 ? "text-red-600" : "text-brand-600",
                        trend.length > 8 && "hidden sm:block",
                      )}
                    >
                      {value < 0 ? "-" : ""}
                      {compact(Math.abs(value))}
                    </span>
                    <div className="flex h-[110px] w-full items-end justify-center">
                      <div
                        className={cn(
                          "w-[70%] max-w-[36px] rounded-t-md",
                          value < 0
                            ? "bg-red-500"
                            : reportMode === "income"
                              ? "bg-blue-500"
                              : "cta-gradient",
                        )}
                        style={{ height: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "whitespace-nowrap font-bold text-fog",
                        trend.length > 8
                          ? "text-[9px] sm:text-[10.5px]"
                          : "text-[11px]",
                      )}
                    >
                      {shortMonth(t.month)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* CATEGORIES */}
      {tab === "categories" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[14px] font-extrabold text-ink">
                Categories and monthly budgets
              </span>
              <button
                type="button"
                onClick={() => openCategory()}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[12.5px] font-extrabold text-ink hover:border-brand-500"
              >
                <Plus size={13} strokeWidth={3} /> New category
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {categories.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0"
                >
                  <span className="flex items-center gap-3 text-[13.5px] font-extrabold text-ink">
                    <span
                      className="h-4 w-4 rounded-md"
                      style={{ background: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold text-fog">
                      {c.monthlyBudget
                        ? `budget ${fmtNaira(c.monthlyBudget)} / month`
                        : "no budget"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => openCategory(c)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${c.name}`}
                      onClick={() => setDeleteCat(c)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="m-0 px-4 py-8 text-center text-[13px] font-semibold text-fog">
                  No categories yet.
                </p>
              )}
            </div>
          </div>
          <div>
            <span className="mb-3 block text-[14px] font-extrabold text-ink">
              Accounts
            </span>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {accounts.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between border-t border-line px-4 py-3 first:border-t-0"
                >
                  <span className="text-[13.5px] font-extrabold text-ink">
                    {a.name}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${a.name}`}
                    onClick={() => setDeleteAcc(a)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 border-t border-line p-3">
                <input
                  type="text"
                  placeholder="New account (e.g. POS)"
                  value={newAccount}
                  maxLength={60}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className={cn(inputClasses, "py-2 sm:text-[13px]")}
                />
                <button
                  type="button"
                  disabled={!newAccount.trim() || createAccount.isPending}
                  onClick={() =>
                    createAccount.mutate(newAccount.trim(), {
                      onSuccess: () => setNewAccount(""),
                    })
                  }
                  className="cta-gradient cursor-pointer rounded-lg border-none px-3 py-2 text-[12.5px] font-extrabold text-forest-deep disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* entry form */}
      <Modal
        title={entryModal?.item ? "Edit entry" : "Add entry"}
        open={entryModal !== null}
        onClose={() => setEntryModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFType(t)}
                className={cn(
                  "flex-1 cursor-pointer rounded-[10px] border px-3 py-2.5 text-[13.5px] font-extrabold transition-colors",
                  fType === t
                    ? t === "expense"
                      ? "border-transparent bg-red-600 text-white"
                      : "cta-gradient border-transparent text-forest-deep"
                    : "border-line bg-white text-bark hover:border-brand-500",
                )}
              >
                {t === "expense" ? "Expense" : "Income"}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mb-amount" className={labelClasses}>
              Amount (₦) <span className="text-brand-500">*</span>
            </label>
            <input
              id="mb-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={fAmount}
              onChange={(e) => setFAmount(e.target.value)}
              className={cn(inputClasses, "text-[20px] font-extrabold")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mb-title" className={labelClasses}>
              Item <span className="text-brand-500">*</span>
            </label>
            <input
              id="mb-title"
              type="text"
              maxLength={160}
              placeholder="Daly BMS 250A"
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>Category</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setFCategory(fCategory === c._id ? "" : c._id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-extrabold transition-colors",
                    fCategory === c._id
                      ? "border-transparent bg-forest-deep text-neon"
                      : "border-line bg-white text-bark hover:border-brand-500",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: c.color }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mb-account" className={labelClasses}>
                Account
              </label>
              <select
                id="mb-account"
                value={fAccount}
                onChange={(e) => setFAccount(e.target.value)}
                className={inputClasses}
              >
                <option value="">None</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mb-date" className={labelClasses}>
                Date <span className="text-brand-500">*</span>
              </label>
              <input
                id="mb-date"
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(
              [
                ["Today", todayIso()],
                ["Yesterday", shiftDay(-1)],
              ] as const
            ).map(([label, value]) => (
              <button
                key={label}
                type="button"
                onClick={() => setFDate(value)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-extrabold",
                  fDate === value
                    ? "border-transparent bg-forest-deep text-neon"
                    : "border-line bg-white text-bark hover:border-brand-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mb-qty" className={labelClasses}>
                Qty
              </label>
              <input
                id="mb-qty"
                type="number"
                min="0"
                value={fQty}
                onChange={(e) => {
                  setFQty(e.target.value);
                  applyQtyPrice(e.target.value, fUnit);
                }}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mb-unit" className={labelClasses}>
                Unit price ₦
              </label>
              <input
                id="mb-unit"
                type="number"
                min="0"
                step="0.01"
                value={fUnit}
                onChange={(e) => {
                  setFUnit(e.target.value);
                  applyQtyPrice(fQty, e.target.value);
                }}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mb-usd" className={labelClasses}>
                Dollar $
              </label>
              <input
                id="mb-usd"
                type="number"
                min="0"
                step="0.01"
                value={fUsd}
                onChange={(e) => setFUsd(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mb-note" className={labelClasses}>
              Merchant / note
            </label>
            <input
              id="mb-note"
              type="text"
              maxLength={500}
              placeholder="Optional"
              value={fNote}
              onChange={(e) => setFNote(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-bold text-ink">
            <input
              type="checkbox"
              checked={fRecurring}
              onChange={(e) => setFRecurring(e.target.checked)}
              className="h-4 w-4 accent-[#0FA53A]"
            />
            <Repeat size={14} className="text-blue-600" /> Repeat every month
            <span className="text-[12px] font-semibold text-fog">
              (written in on the same day each month)
            </span>
          </label>
          <button
            type="button"
            disabled={
              !canSaveEntry || createEntry.isPending || updateEntry.isPending
            }
            onClick={saveEntry}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createEntry.isPending || updateEntry.isPending
              ? "Saving…"
              : entryModal?.item
                ? "Save changes"
                : "Save entry →"}
          </button>
        </div>
      </Modal>

      {/* category form */}
      <Modal
        title={catModal?.item ? `Edit ${catModal.item.name}` : "New category"}
        open={catModal !== null}
        onClose={() => setCatModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mc-name" className={labelClasses}>
              Name <span className="text-brand-500">*</span>
            </label>
            <input
              id="mc-name"
              type="text"
              maxLength={60}
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>Colour</span>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label={`Colour ${p}`}
                  onClick={() => setCColor(p)}
                  className={cn(
                    "h-8 w-8 cursor-pointer rounded-lg border-2",
                    cColor === p ? "border-ink" : "border-transparent",
                  )}
                  style={{ background: p }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mc-budget" className={labelClasses}>
              Monthly budget (₦), optional
            </label>
            <input
              id="mc-budget"
              type="number"
              min="0"
              step="1"
              value={cBudget}
              onChange={(e) => setCBudget(e.target.value)}
              className={inputClasses}
            />
          </div>
          <button
            type="button"
            disabled={
              !cName.trim() ||
              createCategory.isPending ||
              updateCategory.isPending
            }
            onClick={saveCategory}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {catModal?.item ? "Save changes" : "Add category →"}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteFor !== null}
        title="Remove this entry?"
        message={
          <>
            Remove <strong>{deleteFor?.title}</strong> (
            {fmtNaira(deleteFor?.amount ?? 0)},{" "}
            {deleteFor ? fmtDate(deleteFor.date) : ""})?
            {deleteFor?.recurring &&
              " Future monthly copies stop; past ones stay."}{" "}
            This cannot be undone.
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
      <ConfirmModal
        open={deleteCat !== null}
        title="Remove this category?"
        message={
          <>
            Remove <strong>{deleteCat?.name}</strong>? Its entries stay but
            become uncategorised.
          </>
        }
        confirmLabel="Yes, remove"
        loading={deleteCategory.isPending}
        onConfirm={() =>
          deleteCat &&
          deleteCategory.mutate(deleteCat._id, {
            onSuccess: () => setDeleteCat(null),
          })
        }
        onClose={() => setDeleteCat(null)}
      />
      <ConfirmModal
        open={deleteAcc !== null}
        title="Remove this account?"
        message={
          <>
            Remove <strong>{deleteAcc?.name}</strong>? Entries keep their
            history but lose the account link.
          </>
        }
        confirmLabel="Yes, remove"
        loading={deleteAccount.isPending}
        onConfirm={() =>
          deleteAcc &&
          deleteAccount.mutate(deleteAcc._id, {
            onSuccess: () => setDeleteAcc(null),
          })
        }
        onClose={() => setDeleteAcc(null)}
      />
    </>
  );
}
