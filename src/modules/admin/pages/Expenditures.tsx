import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import Modal from "../components/console/Modal";
import SearchSelect from "../components/console/SearchSelect";
import Skeleton from "../components/console/Skeleton";
import { useGetBuses } from "@/lib/network/api/bus.api";
import {
  useGetExpenditures,
  useGetExpenditureSummary,
  useGetExpenditureCategories,
  useCreateExpenditure,
  useUpdateExpenditure,
  useDeleteExpenditure,
} from "@/lib/network/api/expenditure.api";
import StatusPill from "../components/console/StatusPill";
import type {
  Expenditure,
  ExpenditureStatus,
} from "@/lib/network/types/expenditure.types";
import type { Bus } from "@/lib/network/types/bus.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../permissions";
import { cn, fmtNaira, fmtDate, todayLagos } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

const NEW_CATEGORY = "__new__";

// the page opens scoped to the running month, so every new month the
// totals start fresh; "All history" lifts the scope with one click
const monthStart = () => `${todayLagos().slice(0, 7)}-01`;

type StatusFilter = "" | ExpenditureStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_META: Record<
  ExpenditureStatus,
  { label: string; tone: "success" | "warn" | "muted" }
> = {
  completed: { label: "Completed", tone: "success" },
  pending: { label: "Pending", tone: "warn" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

// entries generated from a request/repair are managed automatically
const isAuto = (e: Expenditure) => e.source !== "manual";

const SOURCE_LABEL: Record<string, string> = {
  part_request: "Request",
  repair: "Repair",
};

// a soft palette so each category bar reads distinct
const BAR_COLORS = [
  "#0FA53A",
  "#F0B429",
  "#0A7A2C",
  "#B07A0C",
  "#14402C",
  "#7A877E",
];

interface FormState {
  amount: string;
  categoryId: string;
  newCategory: string;
  description: string;
  date: string;
  note: string;
}

const emptyForm = (): FormState => ({
  amount: "",
  categoryId: "",
  newCategory: "",
  description: "",
  date: todayLagos(),
  note: "",
});

export default function Expenditures() {
  const canView = canApprove(useAuthStore((s) => s.user)?.role);

  // filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [busFilter, setBusFilter] = useState<Bus | null>(null);
  const [busFilterSearch, setBusFilterSearch] = useState("");
  const [busFilterOpen, setBusFilterOpen] = useState(false);
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  // the category split shows its heaviest hitters; the rest unfold
  const [allCats, setAllCats] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // record / edit modal
  const [modal, setModal] = useState<null | { item?: Expenditure }>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formBus, setFormBus] = useState<Bus | null>(null);
  const [formBusSearch, setFormBusSearch] = useState("");
  const [formBusOpen, setFormBusOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteFor, setDeleteFor] = useState<Expenditure | null>(null);

  const filters = useMemo(
    () => ({
      busId: busFilter?._id,
      categoryId: categoryFilter || undefined,
      from: from || undefined,
      to: to || undefined,
      search: search || undefined,
      status: statusFilter || undefined,
    }),
    [busFilter, categoryFilter, from, to, search, statusFilter],
  );

  const { data: catData } = useGetExpenditureCategories({ enabled: canView });
  const categories = catData?.data ?? [];

  const { data, isLoading } = useGetExpenditures(
    { ...filters, page, pageSize },
    { enabled: canView },
  );
  const expenditures = data?.data ?? [];
  const pagination = data?.pagination;

  const { data: summaryData, isLoading: summaryLoading } =
    useGetExpenditureSummary(filters, { enabled: canView });
  const summary = summaryData?.data;

  const { data: formBusData } = useGetBuses(
    { search: formBusSearch, isActive: "true", pageSize: 6 },
    { enabled: formBusOpen && !formBus },
  );
  const { data: filterBusData } = useGetBuses(
    { search: busFilterSearch, isActive: "true", pageSize: 6 },
    { enabled: busFilterOpen && !busFilter },
  );

  const createExp = useCreateExpenditure();
  const updateExp = useUpdateExpenditure();
  const deleteExp = useDeleteExpenditure();
  const isPending = createExp.isPending || updateExp.isPending;

  const maxCatTotal = Math.max(
    1,
    ...(summary?.byCategory ?? []).map((c) => Number(c.total)),
  );

  const openCreate = () => {
    setForm(emptyForm());
    setFormBus(null);
    setFormBusSearch("");
    setError("");
    setModal({});
  };

  const openEdit = (item: Expenditure) => {
    setForm({
      amount: item.amount,
      categoryId: item.category,
      newCategory: "",
      description: item.description,
      date: item.date,
      note: item.note,
    });
    setFormBus(
      item.bus && item.busNumber
        ? ({ _id: item.bus, number: item.busNumber } as Bus)
        : null,
    );
    setFormBusSearch("");
    setError("");
    setModal({ item });
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setBusFilter(null);
    setBusFilterSearch("");
    setFrom(monthStart());
    setTo("");
    setStatusFilter("");
    setPage(1);
  };

  const submit = () => {
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) {
      setError("Enter a valid amount like 25000");
      return;
    }
    if (form.description.trim().length < 2) {
      setError("Say what the money was for");
      return;
    }
    const usingNew = form.categoryId === NEW_CATEGORY;
    if (usingNew ? form.newCategory.trim().length < 2 : !form.categoryId) {
      setError("Pick or name a category");
      return;
    }
    setError("");

    if (modal?.item) {
      updateExp.mutate(
        {
          id: modal.item._id,
          payload: {
            amount: form.amount,
            categoryId: usingNew ? undefined : form.categoryId,
            busId: formBus?._id ?? null,
            description: form.description.trim(),
            date: form.date,
            note: form.note,
          },
        },
        { onSuccess: () => setModal(null) },
      );
    } else {
      createExp.mutate(
        {
          amount: form.amount,
          categoryId: usingNew ? undefined : form.categoryId,
          categoryName: usingNew ? form.newCategory.trim() : undefined,
          busId: formBus?._id,
          description: form.description.trim(),
          date: form.date,
          note: form.note || undefined,
        },
        { onSuccess: () => setModal(null) },
      );
    }
  };

  if (!canView) {
    return (
      <>
        <PageMeta title="Expenditures | KGR Console" />
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-white px-6 py-16 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            Only a manager or admin can view expenditures.
          </p>
        </div>
      </>
    );
  }

  // the default month scope is home base, not a "filter"
  const isMonthScope = from === monthStart() && !to;
  const isAllHistory = !from && !to;
  const hasFilter =
    !!search ||
    !!categoryFilter ||
    !!busFilter ||
    !!statusFilter ||
    (!isMonthScope && (!!from || !!to));

  return (
    <>
      <PageMeta title="Expenditures | KGR Console" />
      <PageHead
        eyebrow="MONEY OUT"
        title="Expenditures"
        subtitle="Every naira spent, filed by category and bus."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> Record expenditure
          </button>
        }
      />

      {/* this month is home; all history is one click away */}
      <div className="mb-4 flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
        {(
          [
            ["month", "This month"],
            ["all", "All history"],
          ] as const
        ).map(([value, label]) => {
          const active = value === "month" ? isMonthScope : isAllHistory;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFrom(value === "month" ? monthStart() : "");
                setTo("");
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
                active
                  ? "cta-gradient text-forest-deep"
                  : "bg-transparent text-fog hover:text-bark",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* total + category split; each card keeps its own height */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col rounded-[20px] bg-forest p-6">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
            {isMonthScope && !hasFilter
              ? "SPENT THIS MONTH"
              : hasFilter
                ? "TOTAL (FILTERED)"
                : "TOTAL SPENT · ALL TIME"}
          </span>
          {summaryLoading ? (
            <Skeleton className="mt-4 h-9 w-40 bg-white/15" />
          ) : (
            <>
              <span className="mt-3 text-[34px] font-extrabold leading-none text-neon">
                {fmtNaira(summary?.total)}
              </span>
              <span className="mt-2 text-[12.5px] font-semibold text-mint-soft">
                across {summary?.count ?? 0} entr
                {(summary?.count ?? 0) === 1 ? "y" : "ies"}
              </span>
            </>
          )}
        </div>

        <div className="rounded-[20px] border border-line bg-white p-6">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
            BY CATEGORY
          </span>
          <div className="mt-4 flex flex-col gap-3">
            {summaryLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-5 w-full" />)
            ) : (summary?.byCategory ?? []).length === 0 ? (
              <p className="m-0 text-[13.5px] font-semibold text-fog">
                No spending in this view.
              </p>
            ) : (
              (allCats
                ? (summary?.byCategory ?? [])
                : (summary?.byCategory ?? []).slice(0, 2)
              ).map((c, i) => (
                <div key={c.category} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-extrabold text-ink">
                      {c.category}
                      <span className="ml-1.5 font-semibold text-fog">
                        ({c.count})
                      </span>
                    </span>
                    <span className="font-extrabold text-ink">
                      {fmtNaira(c.total)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-mist">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(3, (Number(c.total) / maxCatTotal) * 100)}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))
            )}
            {!summaryLoading && (summary?.byCategory ?? []).length > 8 && (
              <button
                type="button"
                onClick={() => setAllCats((v) => !v)}
                className="mt-1 w-fit cursor-pointer border-none bg-transparent p-0 text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
              >
                {allCats
                  ? "Show less"
                  : `Show all ${(summary?.byCategory ?? []).length} categories`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* status chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id || "active"}
            type="button"
            onClick={() => {
              setStatusFilter(f.id);
              setPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
              statusFilter === f.id
                ? "cta-gradient border-transparent text-forest-deep"
                : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* filters */}
      <div className="mt-3 flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className={labelClasses}>Search</label>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
            />
            <input
              type="text"
              placeholder="Description, bus or #"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-[180px]">
          <label className={labelClasses}>Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 sm:text-[14px]")}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-[180px]">
          <label className={labelClasses}>Bus</label>
          {busFilter ? (
            <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-3 py-2.5">
              <span className="text-[14px] font-extrabold text-ink">
                {busFilter.number}
              </span>
              <button
                type="button"
                onClick={() => {
                  setBusFilter(null);
                  setBusFilterSearch("");
                  setPage(1);
                }}
                className="cursor-pointer border-none bg-transparent text-[12.5px] font-extrabold text-brand-600"
              >
                Clear
              </button>
            </div>
          ) : (
            <SearchSelect
              placeholder="Any bus"
              search={busFilterSearch}
              onSearch={setBusFilterSearch}
              onOpenChange={setBusFilterOpen}
              options={(filterBusData?.data ?? []).map((b) => ({
                key: b._id,
                title: b.number,
                subtitle: b.driverName || "",
              }))}
              onPick={(key) => {
                const b = (filterBusData?.data ?? []).find(
                  (x) => x._id === key,
                );
                if (b) {
                  setBusFilter(b);
                  setPage(1);
                }
              }}
              emptyText="No bus matches."
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5 sm:w-[150px]">
          <label className={labelClasses}>From</label>
          <input
            type="date"
            value={from}
            data-placeholder="Start"
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className={cn(
              inputClasses,
              "py-2.5 sm:text-[14px]",
              !from && "date-empty",
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:w-[150px]">
          <label className={labelClasses}>To</label>
          <input
            type="date"
            value={to}
            data-placeholder="End"
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className={cn(
              inputClasses,
              "py-2.5 sm:text-[14px]",
              !to && "date-empty",
            )}
          />
        </div>
        {hasFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="cursor-pointer rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-bark transition-colors hover:border-brand-500"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ledger */}
      <div className="mt-4 overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full whitespace-nowrap border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {[
                "DATE",
                "DESCRIPTION",
                "CATEGORY",
                "BUS",
                "STATUS",
                "AMOUNT",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenditures.map((e) => (
              <tr
                key={e._id}
                className={cn(
                  "border-b border-line last:border-b-0",
                  e.status === "cancelled" && "opacity-55",
                )}
              >
                <td className="px-5 py-3.5 text-[13px] font-semibold text-fog">
                  {fmtDate(e.date)}
                </td>
                <td className="max-w-[240px] px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="truncate text-[14px] font-bold text-ink"
                      title={e.description}
                    >
                      {e.description}
                    </span>
                    {isAuto(e) && (
                      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.5px] text-brand-600">
                        Auto · {SOURCE_LABEL[e.source]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full border border-line bg-haze px-2.5 py-1 text-[12px] font-extrabold text-bark">
                    {e.categoryName}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[13.5px] font-semibold text-bark">
                  {e.busNumber || "—"}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={STATUS_META[e.status].tone}
                    label={STATUS_META[e.status].label}
                  />
                </td>
                <td className="px-5 py-3.5 text-[14px] font-extrabold text-ink">
                  {fmtNaira(e.amount)}
                </td>
                <td className="px-5 py-3.5">
                  {isAuto(e) ? (
                    <span className="block text-right text-[11.5px] font-semibold text-fog">
                      managed
                    </span>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Edit"
                        onClick={() => openEdit(e)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => setDeleteFor(e)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}
        {!isLoading && expenditures.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              No expenditures in this view.
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

      {/* record / edit modal */}
      <Modal
        title={
          modal?.item
            ? `Edit #${modal.item.expenditureId}`
            : "Record expenditure"
        }
        open={modal !== null}
        onClose={() => setModal(null)}
      >
        {modal && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ex-amount" className={labelClasses}>
                  Amount (₦) <span className="text-brand-500">*</span>
                </label>
                <input
                  id="ex-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="25000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ex-date" className={labelClasses}>
                  Date <span className="text-brand-500">*</span>
                </label>
                <input
                  id="ex-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex-desc" className={labelClasses}>
                What was it for? <span className="text-brand-500">*</span>
              </label>
              <input
                id="ex-desc"
                type="text"
                placeholder="Tyres, Carpenter, Logistics…"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={inputClasses}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex-cat" className={labelClasses}>
                Category <span className="text-brand-500">*</span>
              </label>
              <select
                id="ex-cat"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className={inputClasses}
              >
                <option value="">Choose a folder</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
                {!modal.item && (
                  <option value={NEW_CATEGORY}>+ New category…</option>
                )}
              </select>
              {form.categoryId === NEW_CATEGORY && (
                <input
                  type="text"
                  placeholder="New category name"
                  value={form.newCategory}
                  onChange={(e) =>
                    setForm({ ...form, newCategory: e.target.value })
                  }
                  className={cn(inputClasses, "mt-1")}
                  autoComplete="off"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClasses}>Bus (optional)</label>
              {formBus ? (
                <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-4 py-3">
                  <span className="text-[15px] font-extrabold text-ink">
                    {formBus.number}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormBus(null);
                      setFormBusSearch("");
                    }}
                    className="cursor-pointer border-none bg-transparent text-[13px] font-extrabold text-brand-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <SearchSelect
                  placeholder="Overhead — no bus"
                  search={formBusSearch}
                  onSearch={setFormBusSearch}
                  onOpenChange={setFormBusOpen}
                  options={(formBusData?.data ?? []).map((b) => ({
                    key: b._id,
                    title: b.number,
                    subtitle: b.driverName || "",
                  }))}
                  onPick={(key) => {
                    const b = (formBusData?.data ?? []).find(
                      (x) => x._id === key,
                    );
                    if (b) setFormBus(b);
                  }}
                  emptyText="No bus matches."
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex-note" className={labelClasses}>
                Note
              </label>
              <textarea
                id="ex-note"
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className={cn(inputClasses, "resize-y")}
              />
            </div>

            {error && <span className={errorClasses}>{error}</span>}

            <button
              type="button"
              disabled={isPending}
              onClick={submit}
              className={cn(
                "cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                isPending
                  ? "cursor-not-allowed opacity-60"
                  : "transition-transform hover:scale-[1.02]",
              )}
            >
              {isPending ? "Saving…" : modal.item ? "Save changes" : "Record →"}
            </button>
          </div>
        )}
      </Modal>

      {/* delete confirm */}
      <Modal
        title="Remove expenditure?"
        open={deleteFor !== null}
        onClose={() => setDeleteFor(null)}
      >
        {deleteFor && (
          <div className="flex flex-col gap-5">
            <p className="m-0 text-[14px] font-medium leading-[1.6] text-bark">
              Remove{" "}
              <strong className="text-ink">
                {fmtNaira(deleteFor.amount)} · {deleteFor.description}
              </strong>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleteExp.isPending}
                onClick={() =>
                  deleteExp.mutate(deleteFor._id, {
                    onSuccess: () => setDeleteFor(null),
                  })
                }
                className="flex-1 cursor-pointer rounded-[10px] border-none bg-red-600 px-6 py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
              >
                {deleteExp.isPending ? "Removing…" : "Yes, remove"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteFor(null)}
                className="flex-1 cursor-pointer rounded-[10px] border border-line bg-white px-6 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
