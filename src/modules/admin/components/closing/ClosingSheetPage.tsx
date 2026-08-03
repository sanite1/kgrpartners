import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../console/PageHead";
import Modal from "../console/Modal";
import Pagination from "../console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../console/paginationConfig";
import {
  useGetClosingReport,
  useGetClosingDays,
  useCreateClosingEntry,
  useMarkClosingWorked,
  useDeleteClosingEntry,
} from "@/lib/network/api/batteryClosing.api";
import ConfirmModal from "../console/ConfirmModal";
import type {
  BatteryClosingEntry,
  ClosingPercent,
  ClosingSheetKey,
} from "@/lib/network/types/batteryClosing.types";
import type { BatteryLocation } from "@/lib/network/types/battery.types";
import { LOCATION_LABEL, LOCATION_OPTIONS } from "../exitform/meta";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove, isAdminRole } from "../../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses, errorClasses } from "../console/form";

const PERCENTS: ClosingPercent[] = [50, 75, 100];

const smallBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600";

interface ClosingSheetPageProps {
  sheet: ClosingSheetKey;
  pageTitle: string; // browser tab
  eyebrow: string;
  title: string;
  subtitle: string;
  countLabel: string; // the dark tile, e.g. "BATTERIES AT YARD"
  // which location tiles this tab shows; omitted = all of them
  locations?: BatteryLocation[];
  defaultLocation?: BatteryLocation;
}

// how many tile columns the summary row needs (3 fixed + locations)
const TILE_COLS: Record<number, string> = {
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
};

// One evening closing sheet among several, each kept at its own place
// by its own people. Same format, separate lists.
export default function ClosingSheetPage({
  sheet,
  pageTitle,
  eyebrow,
  title,
  subtitle,
  countLabel,
  locations,
  defaultLocation = "main_yard",
}: ClosingSheetPageProps) {
  const { user } = useAuthStore();
  const isManager = canApprove(user?.role);
  const isAdmin = isAdminRole(user?.role);

  // managers can flip to a past day; staff always see today
  const [viewDate, setViewDate] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // add modal
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [voltage, setVoltage] = useState("");
  const [percent, setPercent] = useState<ClosingPercent>(100);
  const [location, setLocation] = useState<BatteryLocation>(defaultLocation);
  const [trips, setTrips] = useState("");
  const [error, setError] = useState("");
  const [deleteFor, setDeleteFor] = useState<BatteryClosingEntry | null>(null);

  const { data, isLoading } = useGetClosingReport(sheet, viewDate || undefined);
  const report = data?.data;
  const entries = report?.entries ?? [];
  const totals = report?.totals;

  const { data: daysData, isLoading: daysLoading } = useGetClosingDays(
    sheet,
    page,
    pageSize,
    { enabled: isManager && historyOpen },
  );
  const days = daysData?.data ?? [];

  const createEntry = useCreateClosingEntry(sheet);
  const markWorked = useMarkClosingWorked(sheet);
  const deleteEntry = useDeleteClosingEntry(sheet);

  // no viewDate means the live sheet; any picked date shows the way back
  const isToday = !viewDate;

  // this tab's own location tiles; the general sheet shows every place
  const shownLocations = locations
    ? LOCATION_OPTIONS.filter(([value]) =>
        locations.includes(value as BatteryLocation),
      )
    : LOCATION_OPTIONS;

  const openAdd = () => {
    setName("");
    setVoltage("");
    setPercent(100);
    setLocation(defaultLocation);
    setTrips("");
    setError("");
    setAddOpen(true);
  };

  const save = () => {
    if (name.trim().length < 1) {
      setError("Type the battery name");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(voltage.trim())) {
      setError("Voltage must be a figure like 81.7");
      return;
    }
    const tripsNum = parseFloat(trips);
    const hasTrips = trips.trim() !== "";
    if (hasTrips && (!(tripsNum >= 0) || (tripsNum * 2) % 1 !== 0)) {
      setError("Trips go in halves (0.5, 1, 1.5...)");
      return;
    }
    setError("");
    createEntry.mutate(
      {
        batteryName: name.trim(),
        voltage: voltage.trim(),
        percent,
        location,
        trips: hasTrips ? tripsNum : undefined,
      },
      { onSuccess: () => setAddOpen(false) },
    );
  };

  return (
    <>
      <PageMeta title={pageTitle} />
      <PageHead
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
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
            {!historyOpen && (
              <button
                type="button"
                onClick={openAdd}
                className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
              >
                <Plus size={16} strokeWidth={3} /> Add battery
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
                      "ISSUED BY",
                      "BATTERIES",
                      "FULLY CHARGED",
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
                      key={day.date + day.issuedByName}
                      onClick={() => {
                        setViewDate(day.date);
                        setHistoryOpen(false);
                      }}
                      className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-haze"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                        {fmtDate(day.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-semibold text-bark">
                        {day.issuedByName || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                        {day.count}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-brand-600">
                        {day.fullyCharged}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums text-ink">
                        {day.totalTrips ?? 0}
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
                  No closing reports yet.
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
          {/* which day is on screen */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px] font-extrabold text-ink">
              {report ? fmtDate(report.date) : ""}
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

          {/* footer totals, computed live; tiles fit this tab's place */}
          <div
            className={cn(
              "mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3",
              TILE_COLS[3 + shownLocations.length] ?? "lg:grid-cols-7",
            )}
          >
            <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
              <span className="block text-[24px] font-extrabold leading-none text-neon">
                {totals?.count ?? 0}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
                {countLabel}
              </span>
              <span className="mt-1 block text-[10.5px] font-semibold text-mint/70">
                {totals?.worked ?? 0} worked ·{" "}
                {(totals?.count ?? 0) - (totals?.worked ?? 0)} waiting
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
            <div className="rounded-2xl border border-line bg-white p-4">
              <span className="block text-[24px] font-extrabold leading-none text-ink">
                {totals?.fullyCharged ?? 0}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
                FULLY CHARGED
              </span>
            </div>
            {shownLocations.map(([value, label]) => (
              <div
                key={value}
                className="rounded-2xl border border-line bg-white p-4"
              >
                <span className="block text-[24px] font-extrabold leading-none text-ink">
                  {totals?.byLocation?.[value] ?? 0}
                </span>
                <span className="mt-1.5 block text-[11px] font-extrabold uppercase tracking-[1px] text-fog">
                  {label}
                </span>
              </div>
            ))}
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
                        "BATTERY",
                        "PERCENT",
                        "VOLTAGE",
                        "TRIPS",
                        "LOCATION",
                        "WORKED",
                        "ADDED BY",
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
                          {entry.batteryName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                              entry.percent === 100
                                ? "bg-brand-50 text-brand-600"
                                : entry.percent === 75
                                  ? "bg-[#FDF6E3] text-solar-700"
                                  : "bg-red-50 text-red-600",
                            )}
                          >
                            {entry.percent}%
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                          {entry.voltage}V
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums text-ink">
                          {entry.trips ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-bark">
                          {LOCATION_LABEL[entry.location]}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            type="button"
                            disabled={markWorked.isPending}
                            title={
                              entry.worked
                                ? entry.workedNote || "Worked"
                                : "Tap when this pack goes out"
                            }
                            onClick={() =>
                              markWorked.mutate({
                                id: entry._id,
                                worked: !entry.worked,
                              })
                            }
                            className={cn(
                              "cursor-pointer rounded-full border-none px-2.5 py-1 text-[11.5px] font-extrabold transition-colors disabled:opacity-40",
                              entry.worked
                                ? "bg-brand-50 text-brand-600 hover:bg-brand-100"
                                : "bg-[#FDF6E3] text-solar-700 hover:bg-[#FAEBC8]",
                            )}
                          >
                            {entry.worked ? "Worked ✓" : "Not yet"}
                          </button>
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
                              aria-label={`Remove ${entry.batteryName}`}
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
              {isToday && (
                <p className="m-0 text-[13px] font-semibold text-fog">
                  Tap "Add battery" as each pack comes in.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={deleteFor !== null}
        title="Remove battery?"
        message={
          <>
            Remove <strong>{deleteFor?.batteryName}</strong> from this closing
            sheet? This cannot be undone.
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

      {/* add modal: name -> voltage -> percent -> location -> save */}
      <Modal
        title="Add battery"
        open={addOpen}
        onClose={() => setAddOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bc-name" className={labelClasses}>
              Battery name <span className="text-brand-500">*</span>
            </label>
            <input
              id="bc-name"
              type="text"
              placeholder="SUB 16"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className={inputClasses}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bc-voltage" className={labelClasses}>
              Voltage <span className="text-brand-500">*</span>
            </label>
            <input
              id="bc-voltage"
              type="text"
              inputMode="decimal"
              placeholder="81.7"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Battery percent <span className="text-brand-500">*</span>
            </span>
            <div className="flex gap-2">
              {PERCENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPercent(p)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-[10px] border px-3 py-3 text-[15px] font-extrabold transition-colors",
                    percent === p
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500",
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bc-trips" className={labelClasses}>
              Trips
            </label>
            <input
              id="bc-trips"
              type="number"
              min={0}
              max={100}
              step={0.5}
              placeholder="0"
              value={trips}
              onChange={(e) => setTrips(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bc-location" className={labelClasses}>
              Location <span className="text-brand-500">*</span>
            </label>
            <select
              id="bc-location"
              value={location}
              onChange={(e) => setLocation(e.target.value as BatteryLocation)}
              className={inputClasses}
            >
              {LOCATION_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && <span className={errorClasses}>{error}</span>}

          <button
            type="button"
            disabled={createEntry.isPending}
            onClick={save}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createEntry.isPending ? "Saving…" : "Save →"}
          </button>
        </div>
      </Modal>
    </>
  );
}
