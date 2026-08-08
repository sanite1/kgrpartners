import { useEffect, useState } from "react";
import { Check, Plus, Search, Trash2, X } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import Pagination from "../components/console/Pagination";
import ConfirmModal from "../components/console/ConfirmModal";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetAttendanceFleet,
  useGetAttendanceLogs,
  useGetAttendanceLog,
  useGetAttendanceCompare,
  useCreateAttendanceLog,
  useDeleteAttendanceLog,
} from "@/lib/network/api/batteryAttendance.api";
import type {
  AttendanceFleetRow,
  AttendanceStatus,
  AttendanceTimeOfDay,
  AttendanceLog,
  AttendanceCompareStatus,
  CompareVerdict,
} from "@/lib/network/types/batteryAttendance.types";
import type { BatteryLocation } from "@/lib/network/types/battery.types";
import { LOCATION_LABEL, LOCATION_OPTIONS } from "../components/exitform/meta";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { isAdminRole } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

const TIMES: { id: AttendanceTimeOfDay; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "night", label: "Night" },
];

const TIME_LABEL: Record<AttendanceTimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
};

// the time of day it probably is right now, Lagos time
const currentTimeOfDay = (): AttendanceTimeOfDay => {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "night";
};

// which closing tab a suggestion came from
const CLOSING_SHEET_LABEL: Record<string, string> = {
  main: "Battery Closing",
  muhd_kamila: "Muh'd & Kamila House",
  main_yard: "Main Yard",
  ubs: "UBS",
};

type RowFilter = "all" | "unmarked" | "seen" | "missing";

const ROW_FILTERS: { id: RowFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unmarked", label: "Unmarked" },
  { id: "seen", label: "Seen" },
  { id: "missing", label: "Missing" },
];

// how each comparison verdict paints its row and badge
const COMPARE_META: Record<
  AttendanceCompareStatus,
  { label: string; badge: string; row: string }
> = {
  match: {
    label: "All agree",
    badge: "bg-brand-50 text-brand-600",
    row: "bg-brand-50/40",
  },
  mismatch: {
    label: "Disagree",
    badge: "bg-red-50 text-red-600",
    row: "bg-red-50/60",
  },
  partial: {
    label: "Some skipped it",
    badge: "bg-[#FDF6E3] text-solar-700",
    row: "bg-[#FDF6E3]/60",
  },
  unmarked: {
    label: "Nobody called it",
    badge: "bg-mist text-bark",
    row: "",
  },
};

// one user's unsent walk of the fleet, kept locally until submitted
interface DraftMark {
  status: AttendanceStatus;
  timeOfDay: AttendanceTimeOfDay;
  location?: BatteryLocation;
  lastSeen?: string;
}

const DRAFT_KEY = "battery-attendance-draft-v1";

const loadDraft = (): Record<string, DraftMark> => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DraftMark>) : {};
  } catch {
    return {};
  }
};

const smallBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600";

const thClasses =
  "whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog";

// Attendance works like the battery exit form now: anyone walks the
// fleet, marks each pack, and submits the whole thing as one numbered
// log. The list shows who logged what; the admin compares a date's
// logs side by side to catch disagreements.
export default function BatteryAttendance() {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);

  const [mode, setMode] = useState<"list" | "new">("list");
  const [tab, setTab] = useState<"logs" | "compare">("logs");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [viewLogId, setViewLogId] = useState<string | null>(null);
  const [deleteFor, setDeleteFor] = useState<AttendanceLog | null>(null);
  const [compareDate, setCompareDate] = useState("");

  // the draft: marks pile up locally and survive a refresh
  const [draft, setDraft] = useState<Record<string, DraftMark>>(loadDraft);
  const [filter, setFilter] = useState<RowFilter>("all");
  const [search, setSearch] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);

  // per-row mark dialog
  const [markFor, setMarkFor] = useState<{
    row: AttendanceFleetRow;
    status: AttendanceStatus;
  } | null>(null);
  const [markTime, setMarkTime] = useState<AttendanceTimeOfDay>("morning");
  const [markLocation, setMarkLocation] =
    useState<BatteryLocation>("main_yard");
  const [lastSeen, setLastSeen] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // storage full or blocked: the draft just will not survive refresh
    }
  }, [draft]);

  const { data: logsData, isLoading: logsLoading } = useGetAttendanceLogs(
    page,
    pageSize,
    { enabled: mode === "list" && tab === "logs" },
  );
  const logs = logsData?.data ?? [];

  const { data: fleetData, isLoading: fleetLoading } = useGetAttendanceFleet({
    enabled: mode === "new",
  });
  const fleetRows = fleetData?.data?.rows ?? [];

  const { data: viewData } = useGetAttendanceLog(viewLogId ?? "");
  const viewLog = viewData?.data;

  const { data: compareData, isLoading: compareLoading } =
    useGetAttendanceCompare(compareDate || undefined, {
      enabled: isAdmin && mode === "list" && tab === "compare",
    });
  const compare = compareData?.data;
  const compareLogs = compare?.logs ?? [];
  const compareRows = compare?.rows ?? [];
  const compareTotals = compare?.totals;

  const createLog = useCreateAttendanceLog();
  const deleteLog = useDeleteAttendanceLog();

  const markedCount = Object.keys(draft).length;
  const seenCount = Object.values(draft).filter(
    (m) => m.status === "seen",
  ).length;
  const missingCount = markedCount - seenCount;
  const unmarkedCount = Math.max(0, fleetRows.length - markedCount);

  const visibleRows = fleetRows.filter((row) => {
    const mark = draft[row.batteryId];
    if (filter === "unmarked" && mark) return false;
    if (filter === "seen" && mark?.status !== "seen") return false;
    if (filter === "missing" && mark?.status !== "missing") return false;
    if (
      search &&
      !row.batteryCode.toUpperCase().includes(search.trim().toUpperCase())
    ) {
      return false;
    }
    return true;
  });

  const openMark = (row: AttendanceFleetRow, status: AttendanceStatus) => {
    const existing = draft[row.batteryId];
    setMarkFor({ row, status });
    setMarkTime(existing?.timeOfDay ?? currentTimeOfDay());
    // suggest where the closing sheets last put it, but the user decides
    setMarkLocation(
      existing?.location ??
        (row.closing?.location as BatteryLocation | undefined) ??
        "main_yard",
    );
    setLastSeen(existing?.lastSeen ?? "");
  };

  const saveMark = () => {
    if (!markFor) return;
    setDraft((d) => ({
      ...d,
      [markFor.row.batteryId]: {
        status: markFor.status,
        timeOfDay: markTime,
        location: markFor.status === "seen" ? markLocation : undefined,
        lastSeen:
          markFor.status === "missing" ? lastSeen.trim() || undefined : undefined,
      },
    }));
    setMarkFor(null);
  };

  const clearMark = (batteryId: string) => {
    setDraft((d) => {
      const next = { ...d };
      delete next[batteryId];
      return next;
    });
  };

  const submitLog = () => {
    createLog.mutate(
      {
        rows: Object.entries(draft).map(([batteryId, m]) => ({
          batteryId,
          status: m.status,
          timeOfDay: m.timeOfDay,
          location: m.location,
          lastSeen: m.lastSeen,
        })),
      },
      {
        onSuccess: () => {
          setDraft({});
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch {
            // nothing to clean
          }
          setSubmitOpen(false);
          setMode("list");
          setTab("logs");
          setPage(1);
        },
      },
    );
  };

  // one log's verdict inside a comparison cell
  const verdictCell = (v: CompareVerdict | null) => {
    if (!v)
      return <span className="text-[13px] font-semibold text-fog">-</span>;
    if (v.status === "seen") {
      return (
        <span className="text-[13px] font-extrabold text-brand-600">
          Seen · {v.location ? LOCATION_LABEL[v.location] : ""}
          <span className="ml-1 text-[11px] font-bold text-fog">
            {TIME_LABEL[v.timeOfDay].toLowerCase()}
          </span>
        </span>
      );
    }
    return (
      <span
        className="text-[13px] font-extrabold text-red-600"
        title={v.lastSeen ? `Last seen: ${v.lastSeen}` : undefined}
      >
        MISSING
      </span>
    );
  };

  return (
    <>
      <PageMeta title="Battery Attendance | KGR Console" />
      <PageHead
        eyebrow="FLEET ROLL-CALL"
        title="Battery Attendance"
        subtitle={
          mode === "new"
            ? "Walk the fleet, mark each pack, then submit the whole log."
            : "Anyone can log a roll call. Every log is stamped with who took it."
        }
        actions={
          mode === "new" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("list")}
                className={cn(smallBtn, "px-4 py-3 text-[14px]")}
              >
                Back to logs
              </button>
              <button
                type="button"
                disabled={markedCount === 0}
                onClick={() => setSubmitOpen(true)}
                className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit ({markedCount} marked)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMode("new")}
              className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={3} /> New attendance
              {markedCount > 0 && ` (draft: ${markedCount})`}
            </button>
          )
        }
      />

      {mode === "list" && (
        <>
          {isAdmin && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
                {(
                  [
                    { id: "logs", label: "Logs" },
                    { id: "compare", label: "Compare" },
                  ] as const
                ).map((t) => (
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
              {tab === "compare" && (
                <input
                  type="date"
                  aria-label="Compare date"
                  value={compareDate || compare?.date || ""}
                  onChange={(e) => setCompareDate(e.target.value)}
                  className={cn(inputClasses, "w-auto py-2.5 sm:text-[14px]")}
                />
              )}
            </div>
          )}

          {tab === "compare" && isAdmin ? (
            <>
              <p className="m-0 mb-4 text-[12.5px] font-semibold text-fog">
                {compareLogs.length === 0
                  ? `No attendance was logged on ${compare?.date ? fmtDate(compare.date) : "this date"}.`
                  : `Comparing ${compareLogs.length} log${compareLogs.length === 1 ? "" : "s"} for ${compare?.date ? fmtDate(compare.date) : ""}: ${compareLogs.map((l) => `#${l.logId} ${l.submittedByName}`).join(", ")}.`}
              </p>

              <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-line bg-white p-4">
                  <span className="block text-[24px] font-extrabold leading-none text-brand-600">
                    {compareTotals?.matched ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    ALL AGREE
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
                    DISAGREE
                  </span>
                </div>
                <div
                  className={cn(
                    "rounded-2xl border p-4",
                    (compareTotals?.partial ?? 0) > 0
                      ? "border-solar/40 bg-[#FDF6E3]"
                      : "border-line bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[24px] font-extrabold leading-none",
                      (compareTotals?.partial ?? 0) > 0
                        ? "text-solar-700"
                        : "text-ink",
                    )}
                  >
                    {compareTotals?.partial ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                    SOME SKIPPED
                  </span>
                </div>
                <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
                  <span className="block text-[24px] font-extrabold leading-none text-neon">
                    {compareTotals?.unmarked ?? 0}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
                    NOBODY CALLED · OF {compareTotals?.fleet ?? 0}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line bg-haze">
                        <th className={thClasses}>BATTERY</th>
                        {compareLogs.map((l) => (
                          <th key={l._id} className={thClasses}>
                            #{l.logId} · {l.submittedByName.toUpperCase()}
                            <span className="ml-1 font-bold text-fog/70">
                              {fmtTime(l.submittedAt)}
                            </span>
                          </th>
                        ))}
                        <th className={thClasses}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareLogs.length > 0 &&
                        compareRows.map((row) => {
                          const meta = COMPARE_META[row.status];
                          return (
                            <tr
                              key={row.batteryId}
                              className={cn(
                                "border-b border-line last:border-0",
                                meta.row,
                              )}
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                                {row.batteryCode}
                                {row.lastSeen && (
                                  <span className="ml-2 text-[11.5px] font-bold text-fog">
                                    seen on {row.lastSeen.busName}
                                  </span>
                                )}
                              </td>
                              {row.verdicts.map((v, i) => (
                                <td
                                  key={compareLogs[i]?._id ?? i}
                                  className="whitespace-nowrap px-4 py-3"
                                >
                                  {verdictCell(v)}
                                </td>
                              ))}
                              <td className="whitespace-nowrap px-4 py-3">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                                    meta.badge,
                                  )}
                                >
                                  {meta.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {compareLoading && (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
                  </div>
                )}

                {!compareLoading && compareLogs.length === 0 && (
                  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                    <BoltMark width={22} height={29} fill="#B5ECC2" />
                    <p className="m-0 text-[15px] font-bold text-bark">
                      Nothing to compare: no logs on this date.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line bg-haze">
                        {[
                          "DATE",
                          "SUBMITTED",
                          "LOG",
                          "LOGGED BY",
                          "SEEN",
                          "MISSING",
                          "UNMARKED",
                          "",
                        ].map((h, i) => (
                          <th key={h + i} className={thClasses}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr
                          key={log._id}
                          onClick={() => setViewLogId(log._id)}
                          className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-haze"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                            {fmtDate(log.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-fog">
                            {fmtDate(log.createdAt)} · {fmtTime(log.createdAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-brand-600">
                            #{log.logId}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold text-bark">
                            {log.submittedByName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-brand-600">
                            {log.totals.seen}
                          </td>
                          <td
                            className={cn(
                              "whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums",
                              log.totals.missing > 0
                                ? "text-red-600"
                                : "text-bark",
                            )}
                          >
                            {log.totals.missing}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-fog">
                            {log.totals.unmarked}
                          </td>
                          <td
                            className="whitespace-nowrap px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isAdmin && (
                              <button
                                type="button"
                                aria-label={`Delete attendance #${log.logId}`}
                                onClick={() => setDeleteFor(log)}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
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

                {logsLoading && (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
                  </div>
                )}

                {!logsLoading && logs.length === 0 && (
                  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                    <BoltMark width={22} height={29} fill="#B5ECC2" />
                    <p className="m-0 text-[15px] font-bold text-bark">
                      No attendance logged yet. Take the first roll call.
                    </p>
                  </div>
                )}
              </div>
              <Pagination
                pagination={logsData?.pagination}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            </>
          )}
        </>
      )}

      {mode === "new" && (
        <>
          {/* the draft so far */}
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
              <span className="block text-[24px] font-extrabold leading-none text-neon">
                {fleetRows.length}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
                FLEET
              </span>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <span className="block text-[24px] font-extrabold leading-none text-brand-600">
                {seenCount}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                SEEN
              </span>
            </div>
            <div
              className={cn(
                "rounded-2xl border p-4",
                missingCount > 0
                  ? "border-red-200 bg-red-50"
                  : "border-line bg-white",
              )}
            >
              <span
                className={cn(
                  "block text-[24px] font-extrabold leading-none",
                  missingCount > 0 ? "text-red-600" : "text-ink",
                )}
              >
                {missingCount}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                MISSING
              </span>
            </div>
            <div
              className={cn(
                "rounded-2xl border p-4",
                unmarkedCount > 0
                  ? "border-solar/40 bg-[#FDF6E3]"
                  : "border-line bg-white",
              )}
            >
              <span
                className={cn(
                  "block text-[24px] font-extrabold leading-none",
                  unmarkedCount > 0 ? "text-solar-700" : "text-ink",
                )}
              >
                {unmarkedCount}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                NOT YET MARKED
              </span>
            </div>
          </div>

          {/* filters and search */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {ROW_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                    filter === f.id
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative sm:w-[190px]">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
              />
              <input
                type="text"
                placeholder="Search battery"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
              />
            </div>
          </div>

          {/* the blank sheet: every pack awaits a verdict */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-haze">
                    {["S/N", "BATTERY", "MARK", "DETAIL", "TIME", ""].map(
                      (h, i) => (
                        <th key={h + i} className={thClasses}>
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, i) => {
                    const mark = draft[row.batteryId];
                    return (
                      <tr
                        key={row.batteryId}
                        className={cn(
                          "border-b border-line last:border-0",
                          mark?.status === "missing" && "bg-red-50/60",
                          !mark && "bg-[#FDF6E3]/40",
                        )}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold tabular-nums text-fog">
                          {i + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                          {row.batteryCode}
                          {row.lastSeen && (
                            <span className="ml-2 text-[11.5px] font-bold text-fog">
                              seen on {row.lastSeen.busName}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {mark ? (
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                                mark.status === "seen"
                                  ? "bg-brand-50 text-brand-600"
                                  : "bg-red-50 text-red-600",
                              )}
                            >
                              {mark.status === "seen" ? "Seen" : "MISSING"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#FDF6E3] px-2.5 py-1 text-[11.5px] font-extrabold text-solar-700">
                              Not marked
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-bark">
                          {mark?.status === "seen" && mark.location
                            ? LOCATION_LABEL[mark.location]
                            : mark?.status === "missing"
                              ? mark.lastSeen
                                ? `Last seen: ${mark.lastSeen}`
                                : "-"
                              : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                          {mark ? TIME_LABEL[mark.timeOfDay] : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openMark(row, "seen")}
                              className={cn(
                                "flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-extrabold transition-colors",
                                mark?.status === "seen"
                                  ? "border-transparent bg-brand-500 text-white"
                                  : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
                              )}
                            >
                              <Check size={12} strokeWidth={3} /> Seen
                            </button>
                            <button
                              type="button"
                              onClick={() => openMark(row, "missing")}
                              className={cn(
                                "cursor-pointer rounded-lg border px-2.5 py-1.5 text-[12px] font-extrabold transition-colors",
                                mark?.status === "missing"
                                  ? "border-transparent bg-red-600 text-white"
                                  : "border-line bg-white text-bark hover:border-red-300 hover:text-red-600",
                              )}
                            >
                              Missing
                            </button>
                            {mark && (
                              <button
                                type="button"
                                title="Clear back to unmarked"
                                onClick={() => clearMark(row.batteryId)}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {fleetLoading && (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
              </div>
            )}

            {!fleetLoading && visibleRows.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <BoltMark width={22} height={29} fill="#B5ECC2" />
                <p className="m-0 text-[15px] font-bold text-bark">
                  {fleetRows.length === 0
                    ? "No batteries registered yet."
                    : "Nothing matches this filter."}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* the mark: the user picks the time of day and the place */}
      <Modal
        title={
          markFor
            ? markFor.status === "seen"
              ? `${markFor.row.batteryCode} seen`
              : `${markFor.row.batteryCode} is missing?`
            : ""
        }
        open={markFor !== null}
        onClose={() => setMarkFor(null)}
      >
        {markFor && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={labelClasses}>
                Time of day <span className="text-brand-500">*</span>
              </span>
              <div className="flex gap-2">
                {TIMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMarkTime(t.id)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-[10px] border px-3 py-3 text-[14px] font-extrabold transition-colors",
                      markTime === t.id
                        ? "cta-gradient border-transparent text-forest-deep"
                        : "border-line bg-white text-bark hover:border-brand-500",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {markFor.status === "seen" ? (
              <div className="flex flex-col gap-1.5">
                <span className={labelClasses}>
                  Where was it seen? <span className="text-brand-500">*</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATION_OPTIONS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMarkLocation(value as BatteryLocation)}
                      className={cn(
                        "cursor-pointer rounded-[10px] border px-3 py-3 text-[14px] font-extrabold transition-colors",
                        markLocation === value
                          ? "cta-gradient border-transparent text-forest-deep"
                          : "border-line bg-white text-bark hover:border-brand-500",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {markFor.row.closing && (
                  <span
                    className={cn(
                      "text-[12px] font-bold",
                      markLocation !== markFor.row.closing.location
                        ? "text-solar-700"
                        : "text-fog",
                    )}
                  >
                    {markLocation !== markFor.row.closing.location
                      ? `Note: the ${CLOSING_SHEET_LABEL[markFor.row.closing.sheet] ?? "closing"} sheet (${fmtDate(markFor.row.closing.date)}) has it at ${LOCATION_LABEL[markFor.row.closing.location]}.`
                      : `The ${CLOSING_SHEET_LABEL[markFor.row.closing.sheet] ?? "closing"} sheet (${fmtDate(markFor.row.closing.date)}) closed it at ${LOCATION_LABEL[markFor.row.closing.location]}. Confirm what you can see.`}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ba-lastseen" className={labelClasses}>
                  Where was it last seen?
                </label>
                <input
                  id="ba-lastseen"
                  type="text"
                  placeholder="UBS yesterday evening"
                  value={lastSeen}
                  onChange={(e) => setLastSeen(e.target.value)}
                  className={inputClasses}
                  autoComplete="off"
                />
                <span className="text-[12px] font-semibold text-fog">
                  Optional, but it is what the search party will use.
                  {markFor.row.closing &&
                    ` The ${CLOSING_SHEET_LABEL[markFor.row.closing.sheet] ?? "closing"} sheet (${fmtDate(markFor.row.closing.date)}) last had it at ${LOCATION_LABEL[markFor.row.closing.location]}.`}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={saveMark}
              className={cn(
                "mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold",
                markFor.status === "seen"
                  ? "cta-gradient text-forest-deep"
                  : "bg-red-600 text-white",
              )}
            >
              {markFor.status === "seen" ? "Mark seen →" : "Mark MISSING"}
            </button>
          </div>
        )}
      </Modal>

      {/* one submitted log, read only */}
      <Modal
        title={viewLog ? `Attendance #${viewLog.logId}` : "Attendance"}
        open={viewLogId !== null}
        onClose={() => setViewLogId(null)}
      >
        {viewLog && (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[13px] font-semibold text-fog">
              {fmtDate(viewLog.date)} · submitted by{" "}
              <strong className="text-ink">{viewLog.submittedByName}</strong> at{" "}
              {fmtTime(viewLog.createdAt)} · {viewLog.totals.seen} seen,{" "}
              {viewLog.totals.missing} missing, {viewLog.totals.unmarked}{" "}
              unmarked.
            </p>
            <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-line">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-haze">
                  <tr className="border-b border-line">
                    {["BATTERY", "STATUS", "TIME", "DETAIL"].map((h) => (
                      <th key={h} className={thClasses}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(viewLog.rows ?? []).map((r) => (
                    <tr
                      key={r.battery}
                      className={cn(
                        "border-b border-line last:border-0",
                        r.status === "missing" && "bg-red-50/60",
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-extrabold text-ink">
                        {r.batteryCode}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                            r.status === "seen"
                              ? "bg-brand-50 text-brand-600"
                              : "bg-red-50 text-red-600",
                          )}
                        >
                          {r.status === "seen" ? "Seen" : "MISSING"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] font-semibold text-fog">
                        {TIME_LABEL[r.timeOfDay]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] font-semibold text-bark">
                        {r.status === "seen" && r.location
                          ? LOCATION_LABEL[r.location]
                          : r.lastSeen
                            ? `Last seen: ${r.lastSeen}`
                            : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={submitOpen}
        title="Submit this attendance?"
        message={
          <>
            You marked <strong>{markedCount}</strong> of{" "}
            <strong>{fleetRows.length}</strong> packs ({seenCount} seen,{" "}
            {missingCount} missing).
            {unmarkedCount > 0 && (
              <>
                {" "}
                <strong>{unmarkedCount} will be saved as unmarked.</strong>
              </>
            )}{" "}
            A submitted log cannot be edited.
          </>
        }
        confirmLabel="Submit log"
        loading={createLog.isPending}
        onConfirm={submitLog}
        onClose={() => setSubmitOpen(false)}
      />

      <ConfirmModal
        open={deleteFor !== null}
        title="Delete this log?"
        message={
          <>
            Delete attendance <strong>#{deleteFor?.logId}</strong> by{" "}
            <strong>{deleteFor?.submittedByName}</strong> (
            {deleteFor ? fmtDate(deleteFor.date) : ""})? This cannot be undone.
          </>
        }
        confirmLabel="Yes, delete"
        loading={deleteLog.isPending}
        onConfirm={() =>
          deleteFor &&
          deleteLog.mutate(deleteFor._id, {
            onSuccess: () => setDeleteFor(null),
          })
        }
        onClose={() => setDeleteFor(null)}
      />
    </>
  );
}
