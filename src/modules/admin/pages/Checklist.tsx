import { useState } from "react";
import { History, Pencil, Plus, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import StatusPill from "../components/console/StatusPill";
import Pagination from "../components/console/Pagination";
import ConfirmModal from "../components/console/ConfirmModal";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetChecklist,
  useGetChecklistCompare,
  useGetChecklistReceiptsCompare,
  useUpdateChecklistEntry,
  useGetChecklistDays,
  useCreateChecklistEntry,
  useDeleteChecklistEntry,
} from "@/lib/network/api/checklist.api";
import type {
  ChecklistEntry,
  ChecklistKind,
  ChecklistSession,
  CompareStatus,
  ReceiptsCompareStatus,
  ReceiptsCompareSide,
  ChecklistEdit,
} from "@/lib/network/types/checklist.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove, isAdminRole } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

const TRIP_OPTIONS = [1, 1.5, 2, 2.5, 3];

// the "admin" kind is the STAFF checklist on screen; the stored value
// stays "admin" so existing records are untouched
const KIND_LABEL: Record<ChecklistKind, string> = {
  security: "Security checklist",
  admin: "Staff checklist",
};

// managers get a third view laying the two lists side by side, and a
// fourth laying both against the day's receipts
type ChecklistTab = ChecklistKind | "compare" | "receipts";

const TAB_LABEL: Record<ChecklistTab, string> = {
  ...KIND_LABEL,
  compare: "Compare",
  receipts: "vs Receipts",
};

// how each checklist-vs-receipts verdict paints its row and badge
const RECEIPTS_META: Record<
  ReceiptsCompareStatus,
  { label: string; badge: string; row: string }
> = {
  match: {
    label: "Match",
    badge: "bg-brand-50 text-brand-600",
    row: "bg-brand-50/40",
  },
  underpaid: {
    label: "Underpaid",
    badge: "bg-red-50 text-red-600",
    row: "bg-red-50/60",
  },
  no_receipt: {
    label: "No receipt",
    badge: "bg-red-50 text-red-600",
    row: "bg-red-50/60",
  },
  not_on_checklist: {
    label: "Not on checklist",
    badge: "bg-red-50 text-red-600",
    row: "bg-red-50/40",
  },
  battery_differs: {
    label: "Battery differs",
    badge: "bg-[#FDF6E3] text-solar-700",
    row: "bg-[#FDF6E3]/60",
  },
  fewer_trips: {
    label: "Fewer trips",
    badge: "bg-[#FDF6E3] text-solar-700",
    row: "bg-[#FDF6E3]/40",
  },
};

const SESSION_SHORT: Record<string, string> = { morning: "M", evening: "E" };

// what the admin picked to correct, from either comparison tab
interface EditTarget {
  entryId: string;
  busName: string;
  session: string;
  listLabel: string;
  batteryName: string;
  trips: number;
}

// one checklist side inside a receipts-comparison cell
const ReceiptsSideCell = ({
  side,
  busName,
  listLabel,
  isAdmin,
  onEdit,
  onHistory,
}: {
  side: ReceiptsCompareSide | null;
  busName: string;
  listLabel: string;
  isAdmin?: boolean;
  onEdit?: (target: EditTarget) => void;
  onHistory?: (title: string, edits: ChecklistEdit[]) => void;
}) => {
  if (!side) {
    return <span className="text-[13px] font-semibold text-fog">-</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "text-[13px] font-extrabold",
          side.batteryOk ? "text-ink" : "text-red-600",
        )}
      >
        {side.batteries.join(" / ")}
      </span>
      <span
        className={cn(
          "text-[12px] font-bold",
          side.tripsVerdict === "more"
            ? "text-red-600"
            : side.tripsVerdict === "fewer"
              ? "text-solar-700"
              : "text-fog",
        )}
      >
        {side.trips} trip{side.trips === 1 ? "" : "s"} ·{" "}
        {side.sessions.map((x) => SESSION_SHORT[x] ?? x).join("+")}
        {side.addedByNames.length > 0 && ` · ${side.addedByNames.join(", ")}`}
      </span>
      {isAdmin && (
        <div className="mt-0.5 flex flex-wrap gap-1">
          {(side.entries ?? []).map((entry) => (
            <span
              key={entry._id}
              className="flex items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-bold text-bark"
            >
              {SESSION_SHORT[entry.session] ?? entry.session} ·{" "}
              {entry.batteryName} · {entry.trips}
              <button
                type="button"
                aria-label={`Edit ${busName} ${entry.session}`}
                onClick={() =>
                  onEdit?.({
                    entryId: entry._id,
                    busName,
                    session: entry.session,
                    listLabel,
                    batteryName: entry.batteryName,
                    trips: entry.trips,
                  })
                }
                className="cursor-pointer border-none bg-transparent p-0 text-fog hover:text-brand-600"
              >
                <Pencil size={11} />
              </button>
              {(entry.edits?.length ?? 0) > 0 && (
                <button
                  type="button"
                  aria-label="Edit history"
                  onClick={() =>
                    onHistory?.(
                      `${busName} · ${entry.session} · ${listLabel}`,
                      entry.edits,
                    )
                  }
                  className="cursor-pointer border-none bg-transparent p-0 text-blue-600 hover:text-blue-500"
                >
                  <History size={11} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// same normalization the backend matches with: case, spaces and
// punctuation do not count as differences
const canon = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// how each verdict paints its row and badge
const STATUS_META: Record<
  CompareStatus,
  { label: string; badge: string; row: string }
> = {
  match: {
    label: "Match",
    badge: "bg-brand-50 text-brand-600",
    row: "bg-brand-50/40",
  },
  mismatch: {
    label: "Mismatch",
    badge: "bg-red-50 text-red-600",
    row: "bg-red-50/60",
  },
  security_only: {
    label: "Security only",
    badge: "bg-[#FDF6E3] text-solar-700",
    row: "bg-[#FDF6E3]/60",
  },
  staff_only: {
    label: "Staff only",
    badge: "bg-[#FDF6E3] text-solar-700",
    row: "bg-[#FDF6E3]/60",
  },
};

const smallBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600";

export default function Checklist() {
  const { user } = useAuthStore();
  const isManager = canApprove(user?.role);
  const isAdmin = isAdminRole(user?.role);
  const isSecurity = user?.role === "security";

  // security lives on their list, staff on theirs; only managers and
  // admins get the toggle plus the side by side comparison
  const [tab, setTab] = useState<ChecklistTab>(
    isSecurity ? "security" : "admin",
  );
  const isCompareTab = tab === "compare" || tab === "receipts";
  const kind: ChecklistKind = isCompareTab ? "admin" : tab;
  const [viewDate, setViewDate] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // clear-bus modal
  const [addOpen, setAddOpen] = useState(false);
  const [busName, setBusName] = useState("");
  const [session, setSession] = useState<ChecklistSession>("morning");
  const [batteryName, setBatteryName] = useState("");
  const [trips, setTrips] = useState<number>(2);
  const [error, setError] = useState("");
  const [deleteFor, setDeleteFor] = useState<ChecklistEntry | null>(null);

  // admin correction flow, launched from Compare or vs Receipts
  const [editFor, setEditFor] = useState<EditTarget | null>(null);
  const [editBattery, setEditBattery] = useState("");
  const [editTrips, setEditTrips] = useState<number>(2);
  const [editNote, setEditNote] = useState("");
  const [historyView, setHistoryView] = useState<{
    title: string;
    edits: ChecklistEdit[];
  } | null>(null);
  const updateEntry = useUpdateChecklistEntry();
  const openEdit = (target: EditTarget) => {
    setEditBattery(target.batteryName);
    setEditTrips(target.trips);
    setEditNote("");
    setEditFor(target);
  };

  const { data, isLoading } = useGetChecklist(kind, viewDate || undefined, {
    enabled: !isCompareTab,
  });
  const sheet = data?.data;
  const entries = sheet?.entries ?? [];
  const totals = sheet?.totals;

  const { data: compareData, isLoading: compareLoading } =
    useGetChecklistCompare(viewDate || undefined, {
      enabled: isManager && tab === "compare",
    });
  const compare = compareData?.data;
  const compareRows = compare?.rows ?? [];
  const compareTotals = compare?.totals;

  const {
    data: receiptsData,
    isLoading: receiptsLoading,
    isError: receiptsError,
    refetch: refetchReceipts,
  } = useGetChecklistReceiptsCompare(viewDate || undefined, {
    enabled: isManager && tab === "receipts",
  });
  const receiptsCompare = receiptsData?.data;
  const receiptRows = receiptsCompare?.rows ?? [];
  const receiptTotals = receiptsCompare?.totals;

  const { data: daysData, isLoading: daysLoading } = useGetChecklistDays(
    page,
    pageSize,
    { enabled: isManager && historyOpen },
  );
  const days = daysData?.data ?? [];

  const createEntry = useCreateChecklistEntry();
  const deleteEntry = useDeleteChecklistEntry();

  // no viewDate means the live sheet; any picked date shows the way back
  const isToday = !viewDate;
  // who may write the list on screen; the backend enforces it either way
  const canWrite =
    isAdmin || (isSecurity ? kind === "security" : kind === "admin");

  const openAdd = () => {
    setBusName("");
    setSession("morning");
    setBatteryName("");
    setTrips(2);
    setError("");
    setAddOpen(true);
  };

  const save = () => {
    if (busName.trim().length < 1) {
      setError("Type the bus name");
      return;
    }
    if (batteryName.trim().length < 1) {
      setError("Type the battery name");
      return;
    }
    setError("");
    createEntry.mutate(
      {
        kind,
        busName: busName.trim(),
        session,
        batteryName: batteryName.trim(),
        trips,
      },
      { onSuccess: () => setAddOpen(false) },
    );
  };

  return (
    <>
      <PageMeta title="Checklist | KGR Console" />
      <PageHead
        eyebrow="GATE CLEARANCE"
        title="Checklist"
        subtitle="Every bus cleared before it goes out, morning and evening, counted twice."
        actions={
          <div className="flex gap-2">
            {isManager && (
              <button
                type="button"
                onClick={() => setHistoryOpen((o) => !o)}
                className={cn(
                  smallBtn,
                  "px-4 py-3 text-[14px]",
                  historyOpen && "border-brand-500 text-brand-600",
                )}
              >
                {historyOpen ? "Back to sheet" : "History"}
              </button>
            )}
            {!historyOpen && !isCompareTab && canWrite && (
              <button
                type="button"
                onClick={openAdd}
                className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
              >
                <Plus size={16} strokeWidth={3} /> Clear bus
              </button>
            )}
          </div>
        }
      />

      {/* HISTORY (managers) */}
      {isManager && historyOpen ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-haze">
                    {[
                      "DATE",
                      "LIST",
                      "BUSES",
                      "MORNING TRIPS",
                      "EVENING TRIPS",
                      "TOTAL TRIPS",
                    ].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr
                      key={day.date + day.kind}
                      onClick={() => {
                        setTab(day.kind);
                        setViewDate(day.date);
                        setHistoryOpen(false);
                      }}
                      className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-haze"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                        {fmtDate(day.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusPill
                          tone={day.kind === "security" ? "warn" : "success"}
                          label={day.kind === "security" ? "Security" : "Staff"}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                        {day.buses}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                        {day.morningTrips}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                        {day.eveningTrips}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums text-brand-600">
                        {day.totalTrips}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {daysLoading && (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
              </div>
            )}
            {!daysLoading && days.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <BoltMark width={22} height={29} fill="#B5ECC2" />
                <p className="m-0 text-[15px] font-bold text-bark">
                  No checklists yet.
                </p>
              </div>
            )}
          </div>
          <Pagination
            pagination={daysData?.pagination}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </>
      ) : (
        <>
          {/* which list, which day */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {!isManager ? (
              // one list per person below management: security see
              // theirs, staff see theirs
              <span className="rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-extrabold text-ink">
                {KIND_LABEL[kind]}
              </span>
            ) : (
              <div className="flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
                {(["security", "admin", "compare", "receipts"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value)}
                    className={cn(
                      "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
                      tab === value
                        ? "cta-gradient text-forest-deep"
                        : "bg-transparent text-fog hover:text-bark",
                    )}
                  >
                    {TAB_LABEL[value]}
                  </button>
                ))}
              </div>
            )}
            <span className="text-[14px] font-extrabold text-ink">
              {(() => {
                const shown =
                  tab === "compare"
                    ? compare?.date
                    : tab === "receipts"
                      ? receiptsCompare?.date
                      : sheet?.date;
                return shown ? fmtDate(shown) : "";
              })()}
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setViewDate("")}
                  className="ml-2.5 cursor-pointer border-none bg-transparent p-0 text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
                >
                  Back to today
                </button>
              )}
            </span>
          </div>

          {tab === "receipts" ? (
            <>
              <p className="m-0 mb-4 text-[12.5px] font-semibold text-fog">
                Every bus the gate logged or a receipt was issued for, side by
                side with what was paid for. Red means money or a bus went
                unaccounted; amber means the battery or trip count needs a
                look (the evening session may simply not be logged yet).
              </p>
              {/* the verdict, counted */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {(
                  [
                    ["MATCH", receiptTotals?.matched ?? 0, "good"],
                    ["UNDERPAID", receiptTotals?.underpaid ?? 0, "red"],
                    ["NO RECEIPT", receiptTotals?.noReceipt ?? 0, "red"],
                    [
                      "NOT ON CHECKLIST",
                      receiptTotals?.notOnChecklist ?? 0,
                      "red",
                    ],
                    [
                      "BATTERY DIFFERS",
                      receiptTotals?.batteryDiffers ?? 0,
                      "amber",
                    ],
                    ["FEWER TRIPS", receiptTotals?.fewerTrips ?? 0, "amber"],
                  ] as const
                ).map(([label, count, tone]) => {
                  const hot = count > 0 && tone !== "good";
                  return (
                    <div
                      key={label}
                      className={cn(
                        "rounded-2xl border p-4",
                        hot && tone === "red"
                          ? "border-red-200 bg-red-50"
                          : hot
                            ? "border-solar/40 bg-[#FDF6E3]"
                            : "border-line bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "block text-[24px] font-extrabold leading-none",
                          tone === "good"
                            ? "text-brand-600"
                            : hot && tone === "red"
                              ? "text-red-600"
                              : hot
                                ? "text-solar-700"
                                : "text-ink",
                        )}
                      >
                        {count}
                      </span>
                      <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="m-0 mb-4 text-[12.5px] font-semibold text-fog">
                Receipts paid for{" "}
                <strong className="text-ink">
                  {receiptTotals?.receiptTrips ?? 0}
                </strong>{" "}
                trips · security logged{" "}
                <strong className="text-ink">
                  {receiptTotals?.securityTrips ?? 0}
                </strong>{" "}
                · staff logged{" "}
                <strong className="text-ink">
                  {receiptTotals?.staffTrips ?? 0}
                </strong>
              </p>

              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line bg-haze">
                        {["BUS", "SECURITY", "STAFF", "RECEIPT", "STATUS"].map(
                          (h) => (
                            <th
                              key={h}
                              className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {receiptRows.map((row) => {
                        const meta = RECEIPTS_META[row.status];
                        return (
                          <tr
                            key={row.busName}
                            className={cn(
                              "border-b border-line last:border-0",
                              meta.row,
                            )}
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                              {row.busName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <ReceiptsSideCell
                                side={row.security}
                                busName={row.busName}
                                listLabel="Security"
                                isAdmin={isAdmin}
                                onEdit={openEdit}
                                onHistory={(title, edits) =>
                                  setHistoryView({ title, edits })
                                }
                              />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <ReceiptsSideCell
                                side={row.staff}
                                busName={row.busName}
                                listLabel="Staff"
                                isAdmin={isAdmin}
                                onEdit={openEdit}
                                onHistory={(title, edits) =>
                                  setHistoryView({ title, edits })
                                }
                              />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {row.receipt ? (
                                <div className="flex flex-col gap-0.5">
                                  {row.receipt.bills.map((b) => (
                                    <span
                                      key={b.billId}
                                      className="text-[13px] font-semibold text-bark"
                                    >
                                      <span className="font-extrabold text-ink">
                                        #{b.billId}
                                      </span>{" "}
                                      · {b.batteryName || "-"} · {b.trips} trip
                                      {b.trips === 1 ? "" : "s"}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[13px] font-extrabold text-red-600">
                                  none
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={cn(
                                    "whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                                    meta.badge,
                                  )}
                                >
                                  {meta.label}
                                </span>
                                {row.note && (
                                  <span className="max-w-[260px] text-[11.5px] font-semibold text-fog">
                                    {row.note}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {receiptsLoading && (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
                  </div>
                )}
                {!receiptsLoading && receiptsError && (
                  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                    <p className="m-0 text-[15px] font-bold text-red-600">
                      Could not load the comparison.
                    </p>
                    <button
                      type="button"
                      onClick={() => refetchReceipts()}
                      className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
                    >
                      Try again
                    </button>
                  </div>
                )}
                {!receiptsLoading && !receiptsError && receiptRows.length === 0 && (
                  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                    <BoltMark width={22} height={29} fill="#B5ECC2" />
                    <p className="m-0 text-[15px] font-bold text-bark">
                      No checklist entries or receipts for this day yet.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : tab === "compare" ? (
            <>
              {/* the verdict, counted */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-2xl border border-line bg-white p-4">
                  <span className="block text-[24px] font-extrabold leading-none text-brand-600">
                    {compareTotals?.matched ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    MATCHED
                  </span>
                </div>
                <div
                  className={cn(
                    "rounded-2xl border p-4",
                    (compareTotals?.mismatched ?? 0) > 0
                      ? "border-red-200 bg-red-50"
                      : "border-line bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[24px] font-extrabold leading-none",
                      (compareTotals?.mismatched ?? 0) > 0
                        ? "text-red-600"
                        : "text-ink",
                    )}
                  >
                    {compareTotals?.mismatched ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    MISMATCHES
                  </span>
                </div>
                <div
                  className={cn(
                    "rounded-2xl border p-4",
                    (compareTotals?.securityOnly ?? 0) > 0
                      ? "border-solar/40 bg-[#FDF6E3]"
                      : "border-line bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[24px] font-extrabold leading-none",
                      (compareTotals?.securityOnly ?? 0) > 0
                        ? "text-solar-700"
                        : "text-ink",
                    )}
                  >
                    {compareTotals?.securityOnly ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    SECURITY ONLY
                  </span>
                </div>
                <div
                  className={cn(
                    "rounded-2xl border p-4",
                    (compareTotals?.staffOnly ?? 0) > 0
                      ? "border-solar/40 bg-[#FDF6E3]"
                      : "border-line bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[24px] font-extrabold leading-none",
                      (compareTotals?.staffOnly ?? 0) > 0
                        ? "text-solar-700"
                        : "text-ink",
                    )}
                  >
                    {compareTotals?.staffOnly ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    STAFF ONLY
                  </span>
                </div>
                <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
                  <span
                    className={cn(
                      "block text-[24px] font-extrabold leading-none",
                      compareTotals &&
                        compareTotals.securityTrips !== compareTotals.staffTrips
                        ? "text-red-400"
                        : "text-neon",
                    )}
                  >
                    {compareTotals?.securityTrips ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
                    TRIPS · SECURITY
                  </span>
                </div>
                <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
                  <span
                    className={cn(
                      "block text-[24px] font-extrabold leading-none",
                      compareTotals &&
                        compareTotals.securityTrips !== compareTotals.staffTrips
                        ? "text-red-400"
                        : "text-neon",
                    )}
                  >
                    {compareTotals?.staffTrips ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
                    TRIPS · STAFF
                  </span>
                </div>
              </div>

              {/* the two papers, side by side */}
              {compareRows.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-line bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line bg-haze">
                          {[
                            "BUS",
                            "SESSION",
                            "SECURITY · BATTERY",
                            "SECURITY · TRIPS",
                            "SECURITY · BY",
                            "STAFF · BATTERY",
                            "STAFF · TRIPS",
                            "STAFF · BY",
                            "STATUS",
                          ].map((h) => (
                            <th
                              key={h}
                              className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {compareRows.map((row) => {
                          const meta = STATUS_META[row.status];
                          const batteryDiff =
                            row.security &&
                            row.staff &&
                            canon(row.security.batteryName) !==
                              canon(row.staff.batteryName);
                          const tripsDiff =
                            row.security &&
                            row.staff &&
                            row.security.trips !== row.staff.trips;
                          return (
                            <tr
                              key={row.busName + row.session}
                              className={cn(
                                "border-b border-line last:border-0",
                                meta.row,
                              )}
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                                {row.busName}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <StatusPill
                                  tone={
                                    row.session === "morning"
                                      ? "success"
                                      : "muted"
                                  }
                                  label={
                                    row.session === "morning"
                                      ? "Morning"
                                      : "Evening"
                                  }
                                />
                              </td>
                              <td
                                className={cn(
                                  "whitespace-nowrap px-4 py-3 text-[13.5px] font-bold",
                                  batteryDiff ? "text-red-600" : "text-bark",
                                )}
                              >
                                {row.security?.batteryName ?? "-"}
                                {isAdmin && row.security && (
                                  <button
                                    type="button"
                                    aria-label={`Edit security entry for ${row.busName}`}
                                    onClick={() =>
                                      openEdit({
                                        entryId: row.security!._id,
                                        busName: row.busName,
                                        session: row.session,
                                        listLabel: "Security",
                                        batteryName: row.security!.batteryName,
                                        trips: row.security!.trips,
                                      })
                                    }
                                    className="ml-1.5 cursor-pointer border-none bg-transparent p-0 align-middle text-fog hover:text-brand-600"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                                {(row.security?.edits?.length ?? 0) > 0 && (
                                  <button
                                    type="button"
                                    aria-label="Edit history"
                                    onClick={() =>
                                      setHistoryView({
                                        title: `${row.busName} · ${row.session} · Security`,
                                        edits: row.security!.edits,
                                      })
                                    }
                                    className="ml-1 cursor-pointer border-none bg-transparent p-0 align-middle text-blue-600 hover:text-blue-500"
                                  >
                                    <History size={12} />
                                  </button>
                                )}
                              </td>
                              <td
                                className={cn(
                                  "whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums",
                                  tripsDiff ? "text-red-600" : "text-ink",
                                )}
                              >
                                {row.security?.trips ?? "-"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                                {row.security?.addedByName || "-"}
                              </td>
                              <td
                                className={cn(
                                  "whitespace-nowrap px-4 py-3 text-[13.5px] font-bold",
                                  batteryDiff ? "text-red-600" : "text-bark",
                                )}
                              >
                                {row.staff?.batteryName ?? "-"}
                                {isAdmin && row.staff && (
                                  <button
                                    type="button"
                                    aria-label={`Edit staff entry for ${row.busName}`}
                                    onClick={() =>
                                      openEdit({
                                        entryId: row.staff!._id,
                                        busName: row.busName,
                                        session: row.session,
                                        listLabel: "Staff",
                                        batteryName: row.staff!.batteryName,
                                        trips: row.staff!.trips,
                                      })
                                    }
                                    className="ml-1.5 cursor-pointer border-none bg-transparent p-0 align-middle text-fog hover:text-brand-600"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                                {(row.staff?.edits?.length ?? 0) > 0 && (
                                  <button
                                    type="button"
                                    aria-label="Edit history"
                                    onClick={() =>
                                      setHistoryView({
                                        title: `${row.busName} · ${row.session} · Staff`,
                                        edits: row.staff!.edits,
                                      })
                                    }
                                    className="ml-1 cursor-pointer border-none bg-transparent p-0 align-middle text-blue-600 hover:text-blue-500"
                                  >
                                    <History size={12} />
                                  </button>
                                )}
                              </td>
                              <td
                                className={cn(
                                  "whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums",
                                  tripsDiff ? "text-red-600" : "text-ink",
                                )}
                              >
                                {row.staff?.trips ?? "-"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                                {row.staff?.addedByName || "-"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                                    meta.badge,
                                  )}
                                >
                                  {row.status === "mismatch"
                                    ? `Mismatch (${[
                                        batteryDiff && "battery",
                                        tripsDiff && "trips",
                                      ]
                                        .filter(Boolean)
                                        .join(", ")})`
                                    : meta.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {compareLoading && (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
                </div>
              )}

              {!compareLoading && compareRows.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
                  <BoltMark width={22} height={29} fill="#B5ECC2" />
                  <p className="m-0 text-[15px] font-bold text-bark">
                    Nothing to compare on this day yet.
                  </p>
                  <p className="m-0 text-[13px] font-semibold text-fog">
                    Rows appear here once either list clears a bus.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* the paper's footer, computed live */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-2xl border border-line bg-white p-4">
                  <span className="block text-[24px] font-extrabold leading-none text-ink">
                    {totals?.morningTrips ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    MORNING TRIPS
                  </span>
                </div>
                <div className="rounded-2xl border border-line bg-white p-4">
                  <span className="block text-[24px] font-extrabold leading-none text-ink">
                    {totals?.eveningTrips ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    EVENING TRIPS
                  </span>
                </div>
                <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
                  <span className="block text-[24px] font-extrabold leading-none text-neon">
                    {totals?.totalTrips ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
                    TOTAL TRIPS
                  </span>
                </div>
                <div className="rounded-2xl border border-line bg-haze p-4">
                  <span className="block text-[24px] font-extrabold leading-none text-ink">
                    {totals?.morningBuses ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    BUSES · MORNING
                  </span>
                </div>
                <div className="rounded-2xl border border-line bg-haze p-4">
                  <span className="block text-[24px] font-extrabold leading-none text-ink">
                    {totals?.eveningBuses ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    BUSES · EVENING
                  </span>
                </div>
              </div>

              {/* the sheet */}
              {entries.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-line bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line bg-haze">
                          {[
                            "S/N",
                            "BUS",
                            "SESSION",
                            "BATTERY",
                            "TRIPS",
                            "CLEARED BY",
                            "TIME",
                            "",
                          ].map((h) => (
                            <th
                              key={h}
                              className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry, i) => (
                          <tr
                            key={entry._id}
                            className="border-b border-line last:border-0"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold tabular-nums text-fog">
                              {i + 1}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                              {entry.busName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <StatusPill
                                tone={
                                  entry.session === "morning"
                                    ? "success"
                                    : "muted"
                                }
                                label={
                                  entry.session === "morning"
                                    ? "Morning"
                                    : "Evening"
                                }
                              />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold text-bark">
                              {entry.batteryName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums text-ink">
                              {entry.trips}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                              {entry.addedByName || "—"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-fog">
                              {fmtTime(entry.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {(isAdmin ||
                                (isToday && entry.addedBy === user?._id)) && (
                                <button
                                  type="button"
                                  aria-label={`Remove ${entry.busName}`}
                                  disabled={deleteEntry.isPending}
                                  onClick={() => setDeleteFor(entry)}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
                </div>
              )}

              {!isLoading && entries.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
                  <BoltMark width={22} height={29} fill="#B5ECC2" />
                  <p className="m-0 text-[15px] font-bold text-bark">
                    Nothing on this sheet yet.
                  </p>
                  {isToday && canWrite && (
                    <p className="m-0 text-[13px] font-semibold text-fog">
                      Tap "Clear bus" as each bus goes out.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      <ConfirmModal
        open={deleteFor !== null}
        title="Remove bus?"
        message={
          <>
            Remove <strong>{deleteFor?.busName}</strong> (
            {deleteFor?.session === "morning" ? "morning" : "evening"}) from
            this checklist? This cannot be undone.
          </>
        }
        loading={deleteEntry.isPending}
        onConfirm={() =>
          deleteFor &&
          deleteEntry.mutate(deleteFor._id, {
            onSuccess: () => setDeleteFor(null),
          })
        }
        onClose={() => setDeleteFor(null)}
      />

      {/* clear-bus modal: bus, session, battery, trips */}
      <Modal title="Clear bus" open={addOpen} onClose={() => setAddOpen(false)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cl-bus" className={labelClasses}>
              Bus name <span className="text-brand-500">*</span>
            </label>
            <input
              id="cl-bus"
              type="text"
              placeholder="A1"
              value={busName}
              onChange={(e) => setBusName(e.target.value.toUpperCase())}
              className={inputClasses}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Session <span className="text-brand-500">*</span>
            </span>
            <div className="flex gap-2">
              {(["morning", "evening"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSession(value)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-[10px] border px-3 py-3 text-[14px] font-extrabold capitalize transition-colors",
                    session === value
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cl-battery" className={labelClasses}>
              Battery name <span className="text-brand-500">*</span>
            </label>
            <input
              id="cl-battery"
              type="text"
              placeholder="SUB 16"
              value={batteryName}
              onChange={(e) => setBatteryName(e.target.value.toUpperCase())}
              className={inputClasses}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Trips <span className="text-brand-500">*</span>
            </span>
            <div className="flex gap-2">
              {TRIP_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrips(t)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-[10px] border px-3 py-3 text-[15px] font-extrabold transition-colors",
                    trips === t
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && <span className={errorClasses}>{error}</span>}

          <button
            type="button"
            disabled={createEntry.isPending}
            onClick={save}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createEntry.isPending ? "Saving…" : "Clear bus →"}
          </button>
        </div>
      </Modal>
      {/* the admin's pen: correct an entry, history keeps the original */}
      <Modal
        title={
          editFor
            ? `Correct ${editFor.busName} · ${editFor.session} · ${editFor.listLabel}`
            : "Correct entry"
        }
        open={editFor !== null}
        onClose={() => setEditFor(null)}
      >
        {editFor && (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-[13px] font-semibold text-fog">
              The original stays in the entry's history with your name and
              the time, so nothing is ever silently rewritten.
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ce-battery" className={labelClasses}>
                Battery <span className="text-brand-500">*</span>
              </label>
              <input
                id="ce-battery"
                type="text"
                maxLength={60}
                value={editBattery}
                onChange={(e) => setEditBattery(e.target.value.toUpperCase())}
                className={inputClasses}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={labelClasses}>
                Trips <span className="text-brand-500">*</span>
              </span>
              <div className="flex gap-2">
                {TRIP_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditTrips(t)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-[10px] border px-2 py-2.5 text-[13.5px] font-extrabold transition-colors",
                      editTrips === t
                        ? "cta-gradient border-transparent text-forest-deep"
                        : "border-line bg-white text-bark hover:border-brand-500",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ce-note" className={labelClasses}>
                Why the correction?
              </label>
              <input
                id="ce-note"
                type="text"
                maxLength={300}
                placeholder="Receipt shows 3 trips"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className={inputClasses}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              disabled={
                updateEntry.isPending ||
                editBattery.trim().length === 0 ||
                (editBattery.trim() === editFor.batteryName &&
                  editTrips === editFor.trips)
              }
              onClick={() =>
                updateEntry.mutate(
                  {
                    id: editFor.entryId,
                    payload: {
                      batteryName:
                        editBattery.trim() !== editFor.batteryName
                          ? editBattery.trim()
                          : undefined,
                      trips:
                        editTrips !== editFor.trips ? editTrips : undefined,
                      note: editNote.trim() || undefined,
                    },
                  },
                  { onSuccess: () => setEditFor(null) },
                )
              }
              className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateEntry.isPending ? "Saving…" : "Save correction →"}
            </button>
          </div>
        )}
      </Modal>

      {/* what the entry said before each correction */}
      <Modal
        title={historyView ? `Edit history · ${historyView.title}` : "History"}
        open={historyView !== null}
        onClose={() => setHistoryView(null)}
      >
        {historyView && (
          <div className="flex flex-col gap-2">
            {historyView.edits.map((edit, i) => (
              <div
                key={i}
                className="rounded-xl border border-line bg-haze px-4 py-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="text-[13.5px] font-extrabold text-ink">
                    {edit.from.batteryName} · {edit.from.trips} trip
                    {edit.from.trips === 1 ? "" : "s"} →{" "}
                    <span className="text-brand-600">
                      {edit.to.batteryName} · {edit.to.trips} trip
                      {edit.to.trips === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-fog sm:text-right">
                    {fmtDate(edit.at)} · {fmtTime(edit.at)}
                  </span>
                </div>
                <p className="m-0 mt-0.5 text-[12.5px] font-semibold text-fog">
                  {edit.byName}
                  {edit.note ? ` · ${edit.note}` : ""}
                </p>
              </div>
            ))}
            <p className="m-0 pt-1 text-[12px] font-semibold text-fog">
              The first line's left side is what the gate originally wrote.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
