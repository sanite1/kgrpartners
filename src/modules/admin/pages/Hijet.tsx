import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Skeleton from "../components/console/Skeleton";
import Modal from "../components/console/Modal";
import ConfirmModal from "../components/console/ConfirmModal";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetHijetEntries,
  useGetHijetSummary,
  useCreateHijetEntry,
  useDeleteHijetEntry,
} from "@/lib/network/api/hijet.api";
import type {
  HijetEntry,
  HijetTimeOfDay,
} from "@/lib/network/types/hijet.types";
import type { BatteryLocation } from "@/lib/network/types/battery.types";
import { LOCATION_LABEL, LOCATION_OPTIONS } from "../components/exitform/meta";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { isAdminRole } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

// the three errand vehicles everybody knows; typing another still works
const KNOWN_HIJETS = ["NO GASA HIJET", "AUDU HIJET", "TAHIR HIJET"];

const TIMES: { id: HijetTimeOfDay; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "night", label: "Night" },
];

const TIME_LABEL: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
};

const TRIP_OPTIONS = [1, 1.5, 2, 2.5, 3];

const pickBtn = (active: boolean) =>
  cn(
    "cursor-pointer rounded-[10px] border px-3 py-2.5 text-[13.5px] font-extrabold transition-colors",
    active
      ? "cta-gradient border-transparent text-forest-deep"
      : "border-line bg-white text-bark hover:border-brand-500",
  );

// The Hijet log: the errand vehicles are electric too, and their
// drivers used to take any battery with no record. Every pickup lands
// here, and the entry doubles as a sighting for attendance and the
// idle report, so no pack goes dark just for running deliveries.
export default function Hijet() {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // add-entry modal
  const [addOpen, setAddOpen] = useState(false);
  const [vehicle, setVehicle] = useState("");
  const [typedVehicle, setTypedVehicle] = useState("");
  const [batteryName, setBatteryName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<HijetTimeOfDay | null>(null);
  const [fromLocation, setFromLocation] = useState<BatteryLocation | null>(
    null,
  );
  const [trips, setTrips] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const [deleteFor, setDeleteFor] = useState<HijetEntry | null>(null);

  const { data: summaryData, isLoading: summaryLoading } =
    useGetHijetSummary();
  const today = summaryData?.data?.today;

  const {
    data,
    isLoading,
    isError: listError,
    refetch: refetchList,
  } = useGetHijetEntries({
    page,
    pageSize,
    search: search || undefined,
  });
  const entries = data?.data ?? [];
  const pagination = data?.pagination;

  const createEntry = useCreateHijetEntry();
  const deleteEntry = useDeleteHijetEntry();

  const chosenVehicle = typedVehicle.trim() || vehicle;
  const canSubmit = chosenVehicle.length > 0 && batteryName.trim().length > 1;

  const openAdd = () => {
    setVehicle("");
    setTypedVehicle("");
    setBatteryName("");
    setTimeOfDay(null);
    setFromLocation(null);
    setTrips(null);
    setNote("");
    setAddOpen(true);
  };

  const submit = () =>
    createEntry.mutate(
      {
        vehicleName: chosenVehicle,
        batteryName: batteryName.trim(),
        timeOfDay: timeOfDay ?? undefined,
        fromLocation: fromLocation ?? undefined,
        trips: trips ?? undefined,
        note: note.trim() || undefined,
      },
      { onSuccess: () => setAddOpen(false) },
    );

  return (
    <>
      <PageMeta title="Hijet Battery | KGR Console" />
      <PageHead
        eyebrow="ERRAND FLEET"
        title="Hijet Battery"
        subtitle="Which battery each hijet took, from where, and how far it ran. No more blind spot."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> Add battery
          </button>
        }
      />

      {/* today at a glance */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          {summaryLoading ? (
            <Skeleton className="h-6 w-9 bg-white/15" />
          ) : (
            <span className="block text-[24px] font-extrabold leading-none text-neon">
              {today?.entries ?? 0}
            </span>
          )}
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            PICKUPS TODAY
          </span>
        </div>
        {(
          [
            [today?.batteries ?? 0, "BATTERIES OUT TODAY"],
            [today?.vehicles ?? 0, "HIJETS ACTIVE TODAY"],
            [today?.trips ?? 0, "TRIPS TODAY"],
          ] as const
        ).map(([count, label]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-4">
            {summaryLoading ? (
              <Skeleton className="h-6 w-9" />
            ) : (
              <span className="block text-[24px] font-extrabold leading-none text-ink">
                {count}
              </span>
            )}
            <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4 flex justify-end">
        <div className="relative w-full sm:w-[240px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Battery or hijet"
            value={search}
            maxLength={60}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-haze">
                {[
                  "S/N",
                  "DATE",
                  "HIJET",
                  "BATTERY",
                  "FROM",
                  "TIME",
                  "TRIPS",
                  "LOGGED BY",
                  isAdmin ? "ACTIONS" : "",
                ]
                  .filter(Boolean)
                  .map((h) => (
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
                <tr key={entry._id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold tabular-nums text-fog">
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13.5px] font-extrabold text-ink">
                        {fmtDate(entry.date)}
                      </span>
                      <span className="text-[10.5px] font-semibold text-fog">
                        {fmtTime(entry.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                    {entry.vehicleName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-haze px-2.5 py-1 text-[11.5px] font-extrabold text-brand-600">
                      {entry.batteryName}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-bark">
                    {entry.fromLocation
                      ? (LOCATION_LABEL[entry.fromLocation] ??
                        entry.fromLocation)
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-bark">
                    {entry.timeOfDay ? TIME_LABEL[entry.timeOfDay] : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums text-ink">
                    {entry.trips ?? "-"}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog"
                    title={entry.note || undefined}
                  >
                    {entry.byName || "-"}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        aria-label={`Delete entry for ${entry.batteryName}`}
                        onClick={() => setDeleteFor(entry)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {!isLoading && listError && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="m-0 text-[15px] font-bold text-red-600">
              Could not load the hijet log.
            </p>
            <button
              type="button"
              onClick={() => refetchList()}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !listError && entries.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {search
                ? "Nothing matches this search."
                : "No pickups logged yet. Add the first one."}
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

      {/* one pickup, straight off the sketch */}
      <Modal
        title="Add battery"
        open={addOpen}
        onClose={() => setAddOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Vehicle <span className="text-brand-500">*</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {KNOWN_HIJETS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setVehicle(name);
                    setTypedVehicle("");
                  }}
                  className={cn(
                    pickBtn(chosenVehicle === name),
                    "px-2 text-[12.5px]",
                  )}
                >
                  {name.replace(" HIJET", "")}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type another vehicle"
              value={typedVehicle}
              maxLength={60}
              onChange={(e) => setTypedVehicle(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="hj-battery" className={labelClasses}>
              Battery name <span className="text-brand-500">*</span>
            </label>
            <input
              id="hj-battery"
              type="text"
              placeholder="SUB 16"
              value={batteryName}
              maxLength={60}
              onChange={(e) => setBatteryName(e.target.value.toUpperCase())}
              className={inputClasses}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>Time of day (optional)</span>
            <div className="flex gap-2">
              {TIMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setTimeOfDay(timeOfDay === t.id ? null : t.id)
                  }
                  className={cn(pickBtn(timeOfDay === t.id), "flex-1")}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              From where was the battery carried? (optional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {LOCATION_OPTIONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFromLocation(
                      fromLocation === value
                        ? null
                        : (value as BatteryLocation),
                    )
                  }
                  className={pickBtn(fromLocation === value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>Trips (optional)</span>
            <div className="flex gap-2">
              {TRIP_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrips(trips === t ? null : t)}
                  className={cn(pickBtn(trips === t), "flex-1 px-2")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="hj-note" className={labelClasses}>
              Note
            </label>
            <input
              id="hj-note"
              type="text"
              placeholder="Optional"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            disabled={!canSubmit || createEntry.isPending}
            onClick={submit}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createEntry.isPending ? "Saving…" : "Submit →"}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteFor !== null}
        title="Remove this entry?"
        message={
          <>
            Remove <strong>{deleteFor?.batteryName}</strong> on{" "}
            <strong>{deleteFor?.vehicleName}</strong> (
            {deleteFor ? fmtDate(deleteFor.date) : ""})? This cannot be
            undone.
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
