import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import StatusPill from "../components/console/StatusPill";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetChecklist,
  useGetChecklistDays,
  useCreateChecklistEntry,
  useDeleteChecklistEntry,
} from "@/lib/network/api/checklist.api";
import type {
  ChecklistKind,
  ChecklistSession,
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

const smallBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600";

export default function Checklist() {
  const { user } = useAuthStore();
  const isManager = canApprove(user?.role);
  const isAdmin = isAdminRole(user?.role);
  const isSecurity = user?.role === "security";

  // security lives on their list, staff on theirs; only managers and
  // admins get the toggle to compare the two
  const [kind, setKind] = useState<ChecklistKind>(
    isSecurity ? "security" : "admin",
  );
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

  const { data, isLoading } = useGetChecklist(kind, viewDate || undefined);
  const sheet = data?.data;
  const entries = sheet?.entries ?? [];
  const totals = sheet?.totals;

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
  const canWrite = isAdmin || (isSecurity ? kind === "security" : kind === "admin");

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
            {!historyOpen && canWrite && (
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
                        setKind(day.kind);
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
                {(["security", "admin"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setKind(value)}
                    className={cn(
                      "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
                      kind === value
                        ? "cta-gradient text-forest-deep"
                        : "bg-transparent text-fog hover:text-bark",
                    )}
                  >
                    {KIND_LABEL[value]}
                  </button>
                ))}
              </div>
            )}
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
                            tone={entry.session === "morning" ? "success" : "muted"}
                            label={entry.session === "morning" ? "Morning" : "Evening"}
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
                              onClick={() => deleteEntry.mutate(entry._id)}
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
    </>
  );
}
