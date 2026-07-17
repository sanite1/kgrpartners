import { useState } from "react";
import { History, Pencil, Plus, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import SearchSelect from "../components/console/SearchSelect";
import Skeleton from "../components/console/Skeleton";
import Modal from "../components/console/Modal";
import { useGetBuses } from "@/lib/network/api/bus.api";
import {
  useGetBatteries,
  useGetBatterySummary,
  useGetBatteryMovements,
  useCreateBattery,
  useUpdateBattery,
  useIssueBattery,
  useCollectBattery,
  useSetBatteryStatus,
} from "@/lib/network/api/battery.api";
import type { Battery, BatteryStatus } from "@/lib/network/types/battery.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canManageStock } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

type PillTone = "success" | "warn" | "muted" | "danger";

const STATUS_META: Record<BatteryStatus, { label: string; tone: PillTone }> = {
  in_store: { label: "In store", tone: "muted" },
  charging: { label: "Charging", tone: "warn" },
  on_bus: { label: "On bus", tone: "success" },
  faulty: { label: "Faulty", tone: "danger" },
  in_repair: { label: "In repair", tone: "warn" },
};

const BOARD: BatteryStatus[] = [
  "in_store",
  "charging",
  "on_bus",
  "faulty",
  "in_repair",
];

const smallBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600";

// Movement history for one battery, inside a modal.
const MovementsList = ({ battery }: { battery: Battery }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetBatteryMovements(battery._id, page);
  const movements = data?.data ?? [];
  const pagination = data?.pagination;

  const ACTION_LABEL: Record<string, string> = {
    issue: "Issued",
    collect: "Collected",
    status: "Status",
  };

  return (
    <div className="flex flex-col gap-2">
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}
      {movements.map((m) => {
        const who = m.by as { firstName?: string; lastName?: string };
        return (
          <div
            key={m._id}
            className="rounded-xl border border-line bg-haze px-4 py-3"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="text-[13.5px] font-extrabold text-ink">
                {ACTION_LABEL[m.action]}: {STATUS_META[m.fromStatus].label} →{" "}
                {STATUS_META[m.toStatus].label}
                {m.busNumber ? ` (${m.busNumber})` : ""}
              </span>
              <span className="shrink-0 text-[12px] font-semibold text-fog sm:text-right">
                {fmtDate(m.createdAt)} · {fmtTime(m.createdAt)}
              </span>
            </div>
            <p className="m-0 mt-0.5 text-[12.5px] font-semibold text-fog">
              {who?.firstName} {who?.lastName}
              {m.note ? ` · ${m.note}` : ""}
            </p>
          </div>
        );
      })}
      {!isLoading && movements.length === 0 && (
        <p className="m-0 py-6 text-center text-[14px] font-semibold text-fog">
          No movements yet.
        </p>
      )}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
            className={cn(
              smallBtn,
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className={cn(
              smallBtn,
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default function Batteries() {
  const { user } = useAuthStore();
  const canStock = canManageStock(user?.role);

  const [statusFilter, setStatusFilter] = useState<BatteryStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // modals
  const [registerOpen, setRegisterOpen] = useState(false);
  const [issueFor, setIssueFor] = useState<Battery | null>(null);
  const [collectFor, setCollectFor] = useState<Battery | null>(null);
  const [editFor, setEditFor] = useState<Battery | null>(null);
  const [historyFor, setHistoryFor] = useState<Battery | null>(null);

  // register form
  const [regCode, setRegCode] = useState("");
  const [regStatus, setRegStatus] = useState<
    "in_store" | "charging" | "faulty"
  >("in_store");
  const [regNotes, setRegNotes] = useState("");

  // issue form
  const [busSearch, setBusSearch] = useState("");
  const [busOpen, setBusOpen] = useState(false);
  const [issueNote, setIssueNote] = useState("");

  // collect form
  const [collectTo, setCollectTo] = useState<
    "in_store" | "charging" | "faulty"
  >("charging");
  const [collectNote, setCollectNote] = useState("");

  // edit form
  const [editCode, setEditCode] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editActive, setEditActive] = useState(true);

  const { data: summaryData, isLoading: summaryLoading } =
    useGetBatterySummary();
  const summary = summaryData?.data;

  const { data, isLoading } = useGetBatteries({
    page,
    pageSize: 18,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
    isActive: "true",
  });
  const batteries = data?.data ?? [];
  const pagination = data?.pagination;

  const { data: busData } = useGetBuses(
    { search: busSearch, isActive: "true", pageSize: 6 },
    { enabled: !!issueFor && busOpen },
  );

  const createBattery = useCreateBattery();
  const updateBattery = useUpdateBattery();
  const issueBattery = useIssueBattery();
  const collectBattery = useCollectBattery();
  const setStatus = useSetBatteryStatus();

  const openEdit = (battery: Battery) => {
    setEditCode(battery.code);
    setEditNotes(battery.notes);
    setEditActive(battery.isActive);
    setEditFor(battery);
  };

  const quickStatus = (
    battery: Battery,
    to: "in_store" | "charging" | "faulty",
  ) => setStatus.mutate({ id: battery._id, payload: { to } });

  return (
    <>
      <PageMeta title="Batteries | KGR Console" />
      <PageHead
        eyebrow="FLEET POWER"
        title="Batteries"
        subtitle="Every pack, where it is, and how it got there."
        actions={
          canStock ? (
            <button
              type="button"
              onClick={() => {
                setRegCode("");
                setRegStatus("in_store");
                setRegNotes("");
                setRegisterOpen(true);
              }}
              className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={3} /> Register battery
            </button>
          ) : undefined
        }
      />

      {/* status board */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer rounded-2xl border p-4 text-left transition-colors",
            statusFilter === "all"
              ? "border-forest-border bg-forest-deep"
              : "border-line bg-white hover:border-brand-500",
          )}
        >
          {summaryLoading ? (
            <Skeleton
              className={cn(
                "h-6 w-9",
                statusFilter === "all" && "bg-white/15",
              )}
            />
          ) : (
            <span
              className={cn(
                "block text-[24px] font-extrabold leading-none",
                statusFilter === "all" ? "text-neon" : "text-ink",
              )}
            >
              {summary?.total ?? 0}
            </span>
          )}
          <span
            className={cn(
              "mt-1.5 block text-[11px] font-extrabold tracking-[1px]",
              statusFilter === "all" ? "text-mint" : "text-fog",
            )}
          >
            ALL PACKS
          </span>
        </button>
        {BOARD.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-2xl border p-4 text-left transition-colors",
              statusFilter === s
                ? "border-forest-border bg-forest-deep"
                : "border-line bg-white hover:border-brand-500",
            )}
          >
            {summaryLoading ? (
              <Skeleton
                className={cn("h-6 w-9", statusFilter === s && "bg-white/15")}
              />
            ) : (
              <span
                className={cn(
                  "block text-[24px] font-extrabold leading-none",
                  statusFilter === s ? "text-neon" : "text-ink",
                )}
              >
                {summary?.counts?.[s] ?? 0}
              </span>
            )}
            <span
              className={cn(
                "mt-1.5 block text-[11px] font-extrabold uppercase tracking-[1px]",
                statusFilter === s ? "text-mint" : "text-fog",
              )}
            >
              {STATUS_META[s].label}
            </span>
          </button>
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
            placeholder="Code or bus number"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      {/* battery cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {batteries.map((battery) => (
          <div
            key={battery._id}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[18px] font-extrabold tracking-[-0.3px] text-ink">
                  {battery.code}
                </span>
                {battery.status === "on_bus" && battery.busNumber && (
                  <span className="ml-2 rounded-full bg-haze px-2.5 py-1 text-[11.5px] font-extrabold text-brand-600">
                    {battery.busNumber}
                  </span>
                )}
              </div>
              <StatusPill
                tone={STATUS_META[battery.status].tone}
                label={STATUS_META[battery.status].label}
              />
            </div>
            {battery.notes && (
              <p className="m-0 mt-1.5 truncate text-[12.5px] font-semibold text-fog">
                {battery.notes}
              </p>
            )}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
              {canStock &&
                (battery.status === "in_store" ||
                  battery.status === "charging") && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setBusSearch("");
                        setIssueNote("");
                        setIssueFor(battery);
                      }}
                      className="cta-gradient cursor-pointer rounded-lg border-none px-3.5 py-1.5 text-[12.5px] font-extrabold text-forest-deep"
                    >
                      Issue to bus
                    </button>
                    <button
                      type="button"
                      disabled={setStatus.isPending}
                      onClick={() =>
                        quickStatus(
                          battery,
                          battery.status === "in_store"
                            ? "charging"
                            : "in_store",
                        )
                      }
                      className={smallBtn}
                    >
                      {battery.status === "in_store"
                        ? "Start charging"
                        : "Back to store"}
                    </button>
                    <button
                      type="button"
                      disabled={setStatus.isPending}
                      onClick={() => quickStatus(battery, "faulty")}
                      className={cn(
                        smallBtn,
                        "hover:border-red-300 hover:text-red-600",
                      )}
                    >
                      Faulty
                    </button>
                  </>
                )}
              {canStock && battery.status === "on_bus" && (
                <button
                  type="button"
                  onClick={() => {
                    setCollectTo("charging");
                    setCollectNote("");
                    setCollectFor(battery);
                  }}
                  className="cta-gradient cursor-pointer rounded-lg border-none px-3.5 py-1.5 text-[12.5px] font-extrabold text-forest-deep"
                >
                  Collect from {battery.busNumber}
                </button>
              )}
              {canStock && battery.status === "faulty" && (
                <>
                  <button
                    type="button"
                    disabled={setStatus.isPending}
                    onClick={() => quickStatus(battery, "in_store")}
                    className={smallBtn}
                  >
                    Back to store
                  </button>
                  <span className="text-[12px] font-semibold text-fog">
                    or open a repair job
                  </span>
                </>
              )}
              {battery.status === "in_repair" && (
                <span className="text-[12px] font-semibold text-fog">
                  Managed by its repair job
                </span>
              )}
              <span className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  aria-label={`History for ${battery.code}`}
                  onClick={() => setHistoryFor(battery)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                >
                  <History size={14} />
                </button>
                {canStock && (
                  <button
                    type="button"
                    aria-label={`Edit ${battery.code}`}
                    onClick={() => openEdit(battery)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}

      {!isLoading && batteries.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            No batteries in this view.
          </p>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
            className={cn(
              smallBtn,
              "px-3.5 py-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className={cn(
              smallBtn,
              "px-3.5 py-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            Next
          </button>
        </div>
      )}

      {/* register modal */}
      <Modal
        title="Register battery"
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bat-code" className={labelClasses}>
              Battery code <span className="text-brand-500">*</span>
            </label>
            <input
              id="bat-code"
              type="text"
              placeholder="BAT-001"
              value={regCode}
              onChange={(e) => setRegCode(e.target.value.toUpperCase())}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bat-status" className={labelClasses}>
              Current state
            </label>
            <select
              id="bat-status"
              value={regStatus}
              onChange={(e) =>
                setRegStatus(
                  e.target.value as "in_store" | "charging" | "faulty",
                )
              }
              className={inputClasses}
            >
              <option value="in_store">In store</option>
              <option value="charging">Charging</option>
              <option value="faulty">Faulty</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bat-notes" className={labelClasses}>
              Notes
            </label>
            <textarea
              id="bat-notes"
              rows={2}
              value={regNotes}
              onChange={(e) => setRegNotes(e.target.value)}
              className={cn(inputClasses, "resize-y")}
            />
          </div>
          <button
            type="button"
            disabled={regCode.trim().length < 2 || createBattery.isPending}
            onClick={() =>
              createBattery.mutate(
                { code: regCode.trim(), status: regStatus, notes: regNotes },
                {
                  onSuccess: () => {
                    setRegisterOpen(false);
                    // show the new pack even if the board was filtered
                    setStatusFilter("all");
                    setSearch("");
                    setPage(1);
                  },
                },
              )
            }
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createBattery.isPending ? "Saving…" : "Register →"}
          </button>
        </div>
      </Modal>

      {/* issue modal */}
      <Modal
        title={issueFor ? `Issue ${issueFor.code}` : "Issue"}
        open={!!issueFor}
        onClose={() => setIssueFor(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-bus" className={labelClasses}>
              Bus <span className="text-brand-500">*</span>
            </label>
            <SearchSelect
              id="issue-bus"
              placeholder="Search bus number"
              search={busSearch}
              onSearch={setBusSearch}
              onOpenChange={setBusOpen}
              inline
              options={(busData?.data ?? []).map((bus) => ({
                key: bus._id,
                title: bus.number,
                subtitle: bus.driverName || "",
              }))}
              onPick={(key) => {
                if (!issueFor) return;
                issueBattery.mutate(
                  {
                    id: issueFor._id,
                    payload: { busId: key, note: issueNote || undefined },
                  },
                  { onSuccess: () => setIssueFor(null) },
                );
              }}
              emptyText="No active bus matches."
            />
            <p className="m-0 text-[12px] font-semibold text-fog">
              Picking a bus issues the battery immediately.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-note" className={labelClasses}>
              Note
            </label>
            <input
              id="issue-note"
              type="text"
              placeholder="Morning swap"
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </Modal>

      {/* collect modal */}
      <Modal
        title={collectFor ? `Collect ${collectFor.code}` : "Collect"}
        open={!!collectFor}
        onClose={() => setCollectFor(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>Where is it going?</span>
            <div className="flex gap-2">
              {(
                [
                  ["charging", "Charging"],
                  ["in_store", "Store"],
                  ["faulty", "Faulty"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCollectTo(value)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-[10px] border px-3 py-2.5 text-[13px] font-extrabold transition-colors",
                    collectTo === value
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="collect-note" className={labelClasses}>
              Note
            </label>
            <input
              id="collect-note"
              type="text"
              placeholder="End of day"
              value={collectNote}
              onChange={(e) => setCollectNote(e.target.value)}
              className={inputClasses}
            />
          </div>
          <button
            type="button"
            disabled={collectBattery.isPending}
            onClick={() => {
              if (!collectFor) return;
              collectBattery.mutate(
                {
                  id: collectFor._id,
                  payload: { to: collectTo, note: collectNote || undefined },
                },
                { onSuccess: () => setCollectFor(null) },
              );
            }}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {collectBattery.isPending ? "Collecting…" : "Collect →"}
          </button>
        </div>
      </Modal>

      {/* edit modal */}
      <Modal
        title={editFor ? `Edit ${editFor.code}` : "Edit"}
        open={!!editFor}
        onClose={() => setEditFor(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-code" className={labelClasses}>
              Battery code
            </label>
            <input
              id="edit-code"
              type="text"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-notes" className={labelClasses}>
              Notes
            </label>
            <textarea
              id="edit-notes"
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className={cn(inputClasses, "resize-y")}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-bold text-ink">
            <input
              type="checkbox"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
              className="h-4 w-4 accent-[#0FA53A]"
            />
            Active (retired packs disappear from the board)
          </label>
          <button
            type="button"
            disabled={editCode.trim().length < 2 || updateBattery.isPending}
            onClick={() => {
              if (!editFor) return;
              updateBattery.mutate(
                {
                  id: editFor._id,
                  payload: {
                    code: editCode.trim(),
                    notes: editNotes,
                    isActive: editActive,
                  },
                },
                { onSuccess: () => setEditFor(null) },
              );
            }}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateBattery.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Modal>

      {/* history modal */}
      <Modal
        title={historyFor ? `${historyFor.code} history` : "History"}
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
      >
        {historyFor && <MovementsList battery={historyFor} />}
      </Modal>
    </>
  );
}
