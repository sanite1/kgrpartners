import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import StatusPill from "../components/console/StatusPill";
import Pagination from "../components/console/Pagination";
import ConfirmModal from "../components/console/ConfirmModal";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetAttendance,
  useGetAttendanceDays,
  useMarkAttendance,
  useClearAttendance,
} from "@/lib/network/api/batteryAttendance.api";
import type {
  AttendanceRow,
  AttendanceSession,
  AttendanceStatus,
} from "@/lib/network/types/batteryAttendance.types";
import type { BatteryLocation } from "@/lib/network/types/battery.types";
import { LOCATION_LABEL, LOCATION_OPTIONS } from "../components/exitform/meta";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

const SESSIONS: { id: AttendanceSession; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "night", label: "Night" },
];

const SESSION_LABEL: Record<AttendanceSession, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
};

// the session that is probably being taken right now, Lagos time
const currentSession = (): AttendanceSession => {
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

type RowFilter = "all" | "unmarked" | "seen" | "missing";

const ROW_FILTERS: { id: RowFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unmarked", label: "Unmarked" },
  { id: "seen", label: "Seen" },
  { id: "missing", label: "Missing" },
];

// which closing tab a suggestion came from
const CLOSING_SHEET_LABEL: Record<string, string> = {
  main: "Battery Closing",
  muhd_kamila: "Muh'd & Kamila House",
  main_yard: "Main Yard",
  ubs: "UBS",
};

const smallBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600";

// The paper "Battery Attendance" sheet: the whole registered fleet is
// called three times a day, and every pack is seen somewhere or
// missing. Unmarked packs stay visible - that is the point.
export default function BatteryAttendance() {
  const { user } = useAuthStore();
  const isManager = canApprove(user?.role);

  const [session, setSession] = useState<AttendanceSession>(currentSession());
  const [viewDate, setViewDate] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filter, setFilter] = useState<RowFilter>("all");
  const [search, setSearch] = useState("");

  // marking happens per row: the user picks the time of day and the
  // place themselves; the clock time is still stamped automatically
  const [markFor, setMarkFor] = useState<{
    row: AttendanceRow;
    status: AttendanceStatus;
  } | null>(null);
  const [markSession, setMarkSession] = useState<AttendanceSession>("morning");
  const [markLocation, setMarkLocation] =
    useState<BatteryLocation>("main_yard");
  const [lastSeen, setLastSeen] = useState("");

  // clear-mark confirm
  const [clearFor, setClearFor] = useState<AttendanceRow | null>(null);

  const { data, isLoading } = useGetAttendance(session, viewDate || undefined);
  const sheet = data?.data;
  const rows = sheet?.rows ?? [];
  const totals = sheet?.totals;

  const { data: daysData, isLoading: daysLoading } = useGetAttendanceDays(
    page,
    pageSize,
    { enabled: isManager && historyOpen },
  );
  const days = daysData?.data ?? [];

  const markAttendance = useMarkAttendance();
  const clearAttendance = useClearAttendance();
  const busy = markAttendance.isPending || clearAttendance.isPending;

  // no viewDate means the live register; past days are read-only
  const isToday = !viewDate;

  const visibleRows = rows.filter((row) => {
    if (filter === "unmarked" && row.mark) return false;
    if (filter === "seen" && row.mark?.status !== "seen") return false;
    if (filter === "missing" && row.mark?.status !== "missing") return false;
    if (
      search &&
      !row.batteryCode.toUpperCase().includes(search.trim().toUpperCase())
    ) {
      return false;
    }
    return true;
  });

  const openMark = (row: AttendanceRow, status: AttendanceStatus) => {
    setMarkFor({ row, status });
    setMarkSession(session);
    // suggest where the closing sheets last put it, but the user decides
    setMarkLocation(
      row.mark?.location ?? row.closing?.location ?? "main_yard",
    );
    setLastSeen(row.mark?.lastSeen ?? "");
  };

  const saveMark = () => {
    if (!markFor) return;
    markAttendance.mutate(
      {
        batteryId: markFor.row.batteryId,
        session: markSession,
        status: markFor.status,
        location: markFor.status === "seen" ? markLocation : undefined,
        lastSeen:
          markFor.status === "missing"
            ? lastSeen.trim() || undefined
            : undefined,
      },
      {
        onSuccess: () => {
          setMarkFor(null);
          // land the user on the register they just wrote into
          setSession(markSession);
        },
      },
    );
  };

  return (
    <>
      <PageMeta title="Battery Attendance | KGR Console" />
      <PageHead
        eyebrow="ROLL CALL"
        title="Battery Attendance"
        subtitle="The whole fleet called three times a day: every pack seen somewhere, or missing."
        actions={
          isManager ? (
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              className={cn(
                smallBtn,
                "px-4 py-3 text-[14px]",
                historyOpen && "border-brand-500 text-brand-600",
              )}
            >
              {historyOpen ? "Back to register" : "History"}
            </button>
          ) : undefined
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
                    {["DATE", "SESSION", "SEEN", "MISSING", "MARKED"].map(
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
                  {days.map((day) => (
                    <tr
                      key={day.date + day.session}
                      onClick={() => {
                        setSession(day.session);
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
                          tone="muted"
                          label={SESSION_LABEL[day.session]}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-brand-600">
                        {day.seen}
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums",
                          day.missing > 0 ? "text-red-600" : "text-bark",
                        )}
                      >
                        {day.missing}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                        {day.marked}
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
                  No roll calls yet.
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
          {/* which session register is on screen */}
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
                SESSION
              </span>
              <div className="flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
              {SESSIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSession(s.id)}
                  className={cn(
                    "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
                    session === s.id
                      ? "cta-gradient text-forest-deep"
                      : "bg-transparent text-fog hover:text-bark",
                  )}
                >
                  {s.label}
                </button>
              ))}
              </div>
            </div>
            <span className="text-[14px] font-extrabold text-ink">
              {sheet ? fmtDate(sheet.date) : ""}
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
          <p className="m-0 mb-4 text-[12.5px] font-semibold text-fog">
            You are viewing the {SESSION_LABEL[session].toLowerCase()} register
            for {sheet ? fmtDate(sheet.date) : "today"}. Every battery is
            called once per session.
          </p>

          {/* the register's verdict so far */}
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
              <span className="block text-[24px] font-extrabold leading-none text-neon">
                {totals?.fleet ?? 0}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
                FLEET
              </span>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <span className="block text-[24px] font-extrabold leading-none text-brand-600">
                {totals?.seen ?? 0}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                SEEN
              </span>
            </div>
            <div
              className={cn(
                "rounded-2xl border p-4",
                (totals?.missing ?? 0) > 0
                  ? "border-red-200 bg-red-50"
                  : "border-line bg-white",
              )}
            >
              <span
                className={cn(
                  "block text-[24px] font-extrabold leading-none",
                  (totals?.missing ?? 0) > 0 ? "text-red-600" : "text-ink",
                )}
              >
                {totals?.missing ?? 0}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                MISSING
              </span>
            </div>
            <div
              className={cn(
                "rounded-2xl border p-4",
                (totals?.unmarked ?? 0) > 0
                  ? "border-solar/40 bg-[#FDF6E3]"
                  : "border-line bg-white",
              )}
            >
              <span
                className={cn(
                  "block text-[24px] font-extrabold leading-none",
                  (totals?.unmarked ?? 0) > 0 ? "text-solar-700" : "text-ink",
                )}
              >
                {totals?.unmarked ?? 0}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                NOT YET CALLED
              </span>
            </div>
          </div>

          {/* filters, search and the one-tap seen location */}
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
            <div className="flex items-center gap-2">
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
          </div>

          {/* the register: every pack, every session */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-haze">
                    {[
                      "S/N",
                      "BATTERY",
                      "STATUS",
                      "DETAIL",
                      "TIME",
                      "MARKED BY",
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
                  {visibleRows.map((row, i) => {
                    const mark = row.mark;
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
                          {row.busNumber && (
                            <span className="ml-2 text-[11.5px] font-bold text-fog">
                              on {row.busNumber}
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
                              Not called
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
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-fog">
                          {mark ? fmtTime(mark.updatedAt) : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                          {mark?.markedByName || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {isToday && (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => openMark(row, "seen")}
                                className={cn(
                                  "flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-extrabold transition-colors disabled:opacity-40",
                                  mark?.status === "seen"
                                    ? "border-transparent bg-brand-500 text-white"
                                    : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
                                )}
                              >
                                <Check size={12} strokeWidth={3} /> Seen
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => openMark(row, "missing")}
                                className={cn(
                                  "cursor-pointer rounded-lg border px-2.5 py-1.5 text-[12px] font-extrabold transition-colors disabled:opacity-40",
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
                                  disabled={busy}
                                  onClick={() => setClearFor(row)}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
              </div>
            )}

            {!isLoading && visibleRows.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <BoltMark width={22} height={29} fill="#B5ECC2" />
                <p className="m-0 text-[15px] font-bold text-bark">
                  {rows.length === 0
                    ? "No batteries registered yet."
                    : "Nothing matches this filter."}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* the mark: the user picks the time of day and the place; the
          clock time is stamped automatically either way */}
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
                {SESSIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setMarkSession(s.id)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-[10px] border px-3 py-3 text-[14px] font-extrabold transition-colors",
                      markSession === s.id
                        ? "cta-gradient border-transparent text-forest-deep"
                        : "border-line bg-white text-bark hover:border-brand-500",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <span className="text-[12px] font-semibold text-fog">
                The exact clock time is recorded automatically.
              </span>
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

            {markAttendance.isError && (
              <span className={errorClasses}>Could not save. Try again.</span>
            )}
            <button
              type="button"
              disabled={markAttendance.isPending}
              onClick={saveMark}
              className={cn(
                "mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold disabled:cursor-not-allowed disabled:opacity-50",
                markFor.status === "seen"
                  ? "cta-gradient text-forest-deep"
                  : "bg-red-600 text-white",
              )}
            >
              {markAttendance.isPending
                ? "Saving…"
                : markFor.status === "seen"
                  ? "Mark seen →"
                  : "Mark MISSING"}
            </button>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={clearFor !== null}
        title="Clear this mark?"
        message={
          <>
            Clear <strong>{clearFor?.batteryCode}</strong> back to unmarked for
            this session?
          </>
        }
        confirmLabel="Yes, clear"
        loading={clearAttendance.isPending}
        onConfirm={() =>
          clearFor?.mark &&
          clearAttendance.mutate(clearFor.mark._id, {
            onSuccess: () => setClearFor(null),
          })
        }
        onClose={() => setClearFor(null)}
      />
    </>
  );
}
