import { useState } from "react";
import { History, Plus, Search, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import SearchSelect from "../components/console/SearchSelect";
import Skeleton from "../components/console/Skeleton";
import Modal from "../components/console/Modal";
import ConfirmModal from "../components/console/ConfirmModal";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import { useGetBuses } from "@/lib/network/api/bus.api";
import {
  useGetTrackers,
  useGetTrackerSummary,
  useGetTrackerUpdates,
  useCreateTracker,
  useUpdateTracker,
  useDeleteTracker,
} from "@/lib/network/api/tracker.api";
import type {
  Tracker,
  TrackerStatus,
} from "@/lib/network/types/tracker.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { isAdminRole } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

const STATUS_META: Record<
  TrackerStatus,
  { label: string; tile: string; badge: string }
> = {
  online: {
    label: "Active online",
    tile: "ACTIVE ONLINE",
    badge: "bg-brand-50 text-brand-600",
  },
  offline: {
    label: "Inactive offline",
    tile: "INACTIVE OFFLINE",
    badge: "bg-red-50 text-red-600",
  },
  parked: {
    label: "Parked not working",
    tile: "PARKED NOT WORKING",
    badge: "bg-[#FDF6E3] text-solar-700",
  },
};

const STATUS_ORDER: TrackerStatus[] = ["online", "offline", "parked"];

// History for one tracker, inside a modal.
const UpdatesList = ({ tracker }: { tracker: Tracker }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetTrackerUpdates(tracker._id, page);
  const entries = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="flex flex-col gap-2">
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}
      {entries.map((e) => (
        <div
          key={e._id}
          className="rounded-xl border border-line bg-haze px-4 py-3"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                  STATUS_META[e.status].badge,
                )}
              >
                {STATUS_META[e.status].label}
              </span>
              Last seen {e.lastSeenText}
            </span>
            <span className="shrink-0 text-[12px] font-semibold text-fog sm:text-right">
              {fmtDate(e.createdAt)} · {fmtTime(e.createdAt)}
            </span>
          </div>
          <p className="m-0 mt-1 text-[12.5px] font-semibold text-bark">
            {e.location}
            {e.purpose ? ` · ${e.purpose}` : ""}
          </p>
          <p className="m-0 mt-0.5 text-[12.5px] font-semibold text-fog">
            {e.byName}
            {e.note ? ` · ${e.note}` : ""}
          </p>
        </div>
      ))}
      {!isLoading && entries.length === 0 && (
        <p className="m-0 py-6 text-center text-[14px] font-semibold text-fog">
          No updates logged yet.
        </p>
      )}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// The tracker board: every GPS tracker, its latest reading off the
// tracking platform, and who logged it. Updates are typed by hand, so
// the board only ever says what a human read and wrote down.
export default function Trackers() {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);

  const [statusFilter, setStatusFilter] = useState<TrackerStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // add-tracker modal
  const [addOpen, setAddOpen] = useState(false);
  const [busSearch, setBusSearch] = useState("");
  const [busOpen, setBusOpen] = useState(false);

  // update modal
  const [updateFor, setUpdateFor] = useState<Tracker | null>(null);
  const [upStatus, setUpStatus] = useState<TrackerStatus>("online");
  const [lastSeenText, setLastSeenText] = useState("");
  const [location, setLocation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [note, setNote] = useState("");

  const [historyFor, setHistoryFor] = useState<Tracker | null>(null);
  const [deleteFor, setDeleteFor] = useState<Tracker | null>(null);

  const { data: summaryData, isLoading: summaryLoading } =
    useGetTrackerSummary();
  const summary = summaryData?.data;

  const {
    data,
    isLoading,
    isError: listError,
    refetch: refetchList,
  } = useGetTrackers({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });
  const trackers = data?.data ?? [];
  const pagination = data?.pagination;

  const { data: busData } = useGetBuses(
    { search: busSearch, isActive: "true", pageSize: 8 },
    { enabled: addOpen && busOpen },
  );

  const createTracker = useCreateTracker();
  const updateTracker = useUpdateTracker();
  const deleteTracker = useDeleteTracker();

  const openUpdate = (tracker: Tracker) => {
    setUpStatus(tracker.status);
    setLastSeenText("");
    setLocation(tracker.location);
    setPurpose("");
    setNote("");
    setUpdateFor(tracker);
  };

  const canSubmitUpdate =
    lastSeenText.trim().length > 0 && location.trim().length > 0;

  const tileButton = (key: TrackerStatus | "all") => {
    const active = statusFilter === key;
    const count =
      key === "all" ? (summary?.total ?? 0) : (summary?.counts?.[key] ?? 0);
    const label = key === "all" ? "TOTAL TRACKERS" : STATUS_META[key].tile;
    const alarm =
      key !== "all" && key !== "online" && count > 0 && !active
        ? key === "offline"
          ? "border-red-200 bg-red-50"
          : "border-solar/40 bg-[#FDF6E3]"
        : "";
    return (
      <button
        key={key}
        type="button"
        onClick={() => {
          setStatusFilter(key);
          setPage(1);
        }}
        className={cn(
          "cursor-pointer rounded-2xl border p-4 text-left transition-colors",
          active
            ? "border-forest-border bg-forest-deep"
            : cn("border-line bg-white hover:border-brand-500", alarm),
        )}
      >
        {summaryLoading ? (
          <Skeleton className={cn("h-6 w-9", active && "bg-white/15")} />
        ) : (
          <span
            className={cn(
              "block text-[24px] font-extrabold leading-none",
              active
                ? "text-neon"
                : key === "offline" && count > 0
                  ? "text-red-600"
                  : key === "parked" && count > 0
                    ? "text-solar-700"
                    : "text-ink",
            )}
          >
            {count}
          </span>
        )}
        <span
          className={cn(
            "mt-1.5 block text-[11px] font-extrabold tracking-[1px]",
            active ? "text-mint" : "text-fog",
          )}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      <PageMeta title="Tracker Update | KGR Console" />
      <PageHead
        eyebrow="FLEET TRACKING"
        title="Tracker Data Update"
        subtitle="Who is online, who went dark, and why. Read the platform, write it here."
        actions={
          <button
            type="button"
            onClick={() => {
              setBusSearch("");
              setAddOpen(true);
            }}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> Add tracker
          </button>
        }
      />

      {/* the four tiles double as status filters */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(["all", ...STATUS_ORDER] as (TrackerStatus | "all")[]).map(
          tileButton,
        )}
      </div>

      <div className="mb-4 flex justify-end">
        <div className="relative w-full sm:w-[240px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Bus name"
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
                  "TRACKER",
                  "STATUS",
                  "LAST SEEN",
                  "LOCATION",
                  "PURPOSE",
                  "UPDATED BY",
                  "ACTIONS",
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
              {trackers.map((tracker, i) => (
                <tr
                  key={tracker._id}
                  className={cn(
                    "border-b border-line last:border-0",
                    tracker.status === "offline" && "bg-red-50/40",
                    tracker.status === "parked" && "bg-[#FDF6E3]/40",
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold tabular-nums text-fog">
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[14px] font-extrabold tracking-[-0.2px] text-ink">
                    {tracker.busName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                        STATUS_META[tracker.status].badge,
                      )}
                    >
                      {STATUS_META[tracker.status].label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {tracker.lastUpdateAt ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-extrabold text-bark">
                          {tracker.lastSeenText || "-"}
                        </span>
                        <span className="text-[10.5px] font-semibold text-fog">
                          as at {fmtDate(tracker.lastUpdateAt)} ·{" "}
                          {fmtTime(tracker.lastUpdateAt)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[13px] font-semibold text-fog">
                        Never updated
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block max-w-[180px] truncate text-[13px] font-semibold text-bark">
                      {tracker.location || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="block max-w-[200px] truncate text-[12.5px] font-semibold text-fog"
                      title={tracker.note || undefined}
                    >
                      {tracker.purpose || "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                    {tracker.lastUpdateByName || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openUpdate(tracker)}
                        className="cta-gradient cursor-pointer rounded-lg border-none px-3.5 py-1.5 text-[12.5px] font-extrabold text-forest-deep"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        aria-label={`History for ${tracker.busName}`}
                        onClick={() => setHistoryFor(tracker)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                      >
                        <History size={14} />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          aria-label={`Delete tracker for ${tracker.busName}`}
                          onClick={() => setDeleteFor(tracker)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
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
              Could not load the tracker board.
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

        {!isLoading && !listError && trackers.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {statusFilter === "all" && !search
                ? "No trackers on the board yet. Add the first one."
                : "Nothing matches this filter."}
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

      {/* add tracker: pick a bus or use the typed name */}
      <Modal
        title="Add tracker"
        open={addOpen}
        onClose={() => setAddOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tr-bus" className={labelClasses}>
              Bus <span className="text-brand-500">*</span>
            </label>
            <SearchSelect
              id="tr-bus"
              placeholder="Search or type a bus"
              icon
              inline
              search={busSearch}
              onSearch={setBusSearch}
              onOpenChange={setBusOpen}
              options={[
                ...(busData?.data ?? []).map((b) => ({
                  key: b._id,
                  title: b.number,
                  subtitle: b.driverName || "",
                })),
                ...(busSearch.trim()
                  ? [
                      {
                        key: "__typed__",
                        title: `Use "${busSearch.trim()}"`,
                        subtitle: "not a registered bus, use as typed",
                      },
                    ]
                  : []),
              ]}
              onPick={(key) =>
                createTracker.mutate(
                  key === "__typed__"
                    ? { busName: busSearch.trim() }
                    : { busId: key },
                  { onSuccess: () => setAddOpen(false) },
                )
              }
              emptyText="Keep typing and pick the typed option."
            />
            <span className="text-[12px] font-semibold text-fog">
              Picking adds the tracker to the board immediately.
            </span>
          </div>
        </div>
      </Modal>

      {/* one reading off the tracking platform */}
      <Modal
        title={updateFor ? `Update ${updateFor.busName}` : "Update"}
        open={updateFor !== null}
        onClose={() => setUpdateFor(null)}
      >
        {updateFor && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={labelClasses}>
                Status <span className="text-brand-500">*</span>
              </span>
              <div className="flex gap-2">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUpStatus(s)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-[10px] border px-2 py-3 text-[13px] font-extrabold transition-colors",
                      upStatus === s
                        ? "cta-gradient border-transparent text-forest-deep"
                        : "border-line bg-white text-bark hover:border-brand-500",
                    )}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tr-lastseen" className={labelClasses}>
                  Last seen <span className="text-brand-500">*</span>
                </label>
                <input
                  id="tr-lastseen"
                  type="text"
                  placeholder="10 hrs ago"
                  value={lastSeenText}
                  onChange={(e) => setLastSeenText(e.target.value)}
                  className={inputClasses}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tr-location" className={labelClasses}>
                  Location <span className="text-brand-500">*</span>
                </label>
                <input
                  id="tr-location"
                  type="text"
                  placeholder="Yard, on the road, police station"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClasses}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tr-purpose" className={labelClasses}>
                Purpose
              </label>
              <input
                id="tr-purpose"
                type="text"
                placeholder="12 volt issue, need to check"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={inputClasses}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tr-note" className={labelClasses}>
                Note
              </label>
              <textarea
                id="tr-note"
                rows={2}
                placeholder="Optional"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={cn(inputClasses, "resize-y")}
              />
            </div>
            <button
              type="button"
              disabled={!canSubmitUpdate || updateTracker.isPending}
              onClick={() =>
                updateTracker.mutate(
                  {
                    id: updateFor._id,
                    payload: {
                      status: upStatus,
                      lastSeenText: lastSeenText.trim(),
                      location: location.trim(),
                      purpose: purpose.trim() || undefined,
                      note: note.trim() || undefined,
                    },
                  },
                  { onSuccess: () => setUpdateFor(null) },
                )
              }
              className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateTracker.isPending ? "Saving…" : "Submit update →"}
            </button>
          </div>
        )}
      </Modal>

      {/* history */}
      <Modal
        title={historyFor ? `${historyFor.busName} history` : "History"}
        open={historyFor !== null}
        onClose={() => setHistoryFor(null)}
      >
        {historyFor && <UpdatesList tracker={historyFor} />}
      </Modal>

      <ConfirmModal
        open={deleteFor !== null}
        title="Delete this tracker?"
        message={
          <>
            Delete the tracker for <strong>{deleteFor?.busName}</strong> and
            all its update history? This cannot be undone.
          </>
        }
        confirmLabel="Yes, delete"
        loading={deleteTracker.isPending}
        onConfirm={() =>
          deleteFor &&
          deleteTracker.mutate(deleteFor._id, {
            onSuccess: () => setDeleteFor(null),
          })
        }
        onClose={() => setDeleteFor(null)}
      />
    </>
  );
}
