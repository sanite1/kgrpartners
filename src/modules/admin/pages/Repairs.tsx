import { useState } from "react";
import { Check, Plus, Search, Trash2, X as XIcon } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import StatusPill from "../components/console/StatusPill";
import SearchSelect from "../components/console/SearchSelect";
import Modal from "../components/console/Modal";
import { useGetBuses } from "@/lib/network/api/bus.api";
import { useGetItems } from "@/lib/network/api/inventory.api";
import { useGetBatteries } from "@/lib/network/api/battery.api";
import {
  useGetRepairJobs,
  useCreateRepairJob,
  useAddRepairPart,
  useCompleteRepairJob,
  useCancelRepairJob,
} from "@/lib/network/api/repair.api";
import type { Bus } from "@/lib/network/types/bus.types";
import type { Battery } from "@/lib/network/types/battery.types";
import type { InventoryItem } from "@/lib/network/types/inventory.types";
import type { RepairJob, RepairStatus } from "@/lib/network/types/repair.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove, canManageStock } from "../permissions";
import { cn, fmtNaira, fmtDate } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

type StatusFilter = "all" | RepairStatus;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const statusTone: Record<RepairStatus, "warn" | "success" | "muted"> = {
  open: "warn",
  completed: "success",
  cancelled: "muted",
};

interface DraftPart {
  item: InventoryItem;
  quantity: number;
}

const moneyPattern = /^\d+(\.\d{1,2})?$/;

export default function Repairs() {
  const { user } = useAuthStore();
  const canDecide = canApprove(user?.role);
  const canStock = canManageStock(user?.role);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busSearch, setBusSearch] = useState("");
  const [busOpen, setBusOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [batterySearch, setBatterySearch] = useState("");
  const [batteryOpen, setBatteryOpen] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemOpen, setItemOpen] = useState(false);
  const [itemQty, setItemQty] = useState("1");
  const [draftParts, setDraftParts] = useState<DraftPart[]>([]);

  // list state
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // job actions state
  const [completeFor, setCompleteFor] = useState<RepairJob | null>(null);
  const [laborCost, setLaborCost] = useState("");
  const [completeNote, setCompleteNote] = useState("");
  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [addPartFor, setAddPartFor] = useState<RepairJob | null>(null);
  const [addItemSearch, setAddItemSearch] = useState("");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addQty, setAddQty] = useState("1");

  const { data: busData } = useGetBuses(
    { search: busSearch, isActive: "true", pageSize: 6 },
    { enabled: busOpen && !selectedBus },
  );
  const { data: batteryData } = useGetBatteries(
    { search: batterySearch, isActive: "true", pageSize: 6 },
    { enabled: batteryOpen && !selectedBattery },
  );
  const { data: itemData } = useGetItems(
    { search: itemSearch, isActive: "true", pageSize: 6 },
    { enabled: itemOpen },
  );
  const { data: addItemData } = useGetItems(
    { search: addItemSearch, isActive: "true", pageSize: 6 },
    { enabled: !!addPartFor && addItemOpen },
  );

  const { data, isLoading } = useGetRepairJobs({
    page,
    pageSize,
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });
  const jobs = data?.data ?? [];
  const pagination = data?.pagination;

  const createJob = useCreateRepairJob();
  const addPart = useAddRepairPart();
  const completeJob = useCompleteRepairJob();
  const cancelJob = useCancelRepairJob();

  const draftCost = draftParts.reduce(
    (acc, p) => acc + p.quantity * Number(p.item.unitCost),
    0,
  );

  const addDraftPart = (item: InventoryItem) => {
    const quantity = Math.max(1, parseInt(itemQty, 10) || 1);
    setDraftParts((prev) => {
      const existing = prev.find((p) => p.item._id === item._id);
      if (existing) {
        return prev.map((p) =>
          p.item._id === item._id
            ? { ...p, quantity: p.quantity + quantity }
            : p,
        );
      }
      return [...prev, { item, quantity }];
    });
    setItemSearch("");
    setItemQty("1");
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedBus(null);
    setBusSearch("");
    setSelectedBattery(null);
    setBatterySearch("");
    setDraftParts([]);
    setItemSearch("");
    setItemQty("1");
    // a new job is always open: drop any status filter or search so it
    // appears in the list immediately
    setStatus("all");
    setSearch("");
    setPage(1);
  };

  const canSubmit =
    title.trim().length >= 3 &&
    (selectedBus || selectedBattery) &&
    !createJob.isPending;

  const submit = () => {
    if (!canSubmit) return;
    createJob.mutate(
      {
        title: title.trim(),
        description: description || undefined,
        busId: selectedBus?._id,
        batteryId: selectedBattery?._id,
        parts: draftParts.map((p) => ({
          itemId: p.item._id,
          quantity: p.quantity,
        })),
      },
      { onSuccess: resetForm },
    );
  };

  return (
    <>
      <PageMeta title="Repairs | KGR Console" />
      <PageHead
        eyebrow="WORKSHOP"
        title="Repairs"
        subtitle="Open a job, pull parts from stock, close it with the labor bill."
      />

      <div
        className={cn(
          "grid grid-cols-1 items-start gap-6",
          canStock && "lg:grid-cols-[400px_1fr]",
        )}
      >
        {/* new job form: store work only */}
        {canStock && (
          <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)] lg:sticky lg:top-8">
            <h2 className="mb-4 mt-0 text-[17px] font-extrabold text-ink">
              New repair job
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rj-title" className={labelClasses}>
                  What is wrong? <span className="text-brand-500">*</span>
                </label>
                <input
                  id="rj-title"
                  type="text"
                  placeholder="Rear brake overhaul"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClasses}
                />
              </div>

              {/* bus */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rj-bus" className={labelClasses}>
                  Bus
                </label>
                {selectedBus ? (
                  <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-4 py-3">
                    <span className="text-[15px] font-extrabold text-ink">
                      {selectedBus.number}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBus(null);
                        setBusSearch("");
                      }}
                      className="cursor-pointer border-none bg-transparent text-[13px] font-extrabold text-brand-600"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <SearchSelect
                    id="rj-bus"
                    placeholder="Search bus number"
                    search={busSearch}
                    onSearch={setBusSearch}
                    onOpenChange={setBusOpen}
                    options={(busData?.data ?? []).map((bus) => ({
                      key: bus._id,
                      title: bus.number,
                      subtitle: bus.driverName || "",
                    }))}
                    onPick={(key) => {
                      const bus = (busData?.data ?? []).find(
                        (b) => b._id === key,
                      );
                      if (bus) setSelectedBus(bus);
                    }}
                    emptyText="No active bus matches."
                  />
                )}
              </div>

              {/* battery */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rj-battery" className={labelClasses}>
                  Battery
                </label>
                {selectedBattery ? (
                  <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-4 py-3">
                    <span className="text-[15px] font-extrabold text-ink">
                      {selectedBattery.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBattery(null);
                        setBatterySearch("");
                      }}
                      className="cursor-pointer border-none bg-transparent text-[13px] font-extrabold text-brand-600"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <SearchSelect
                    id="rj-battery"
                    placeholder="Search battery code"
                    search={batterySearch}
                    onSearch={setBatterySearch}
                    onOpenChange={setBatteryOpen}
                    options={(batteryData?.data ?? []).map((battery) => ({
                      key: battery._id,
                      title: battery.code,
                      subtitle: battery.status.replace("_", " "),
                    }))}
                    onPick={(key) => {
                      const battery = (batteryData?.data ?? []).find(
                        (b) => b._id === key,
                      );
                      if (battery) setSelectedBattery(battery);
                    }}
                    emptyText="No battery matches."
                  />
                )}
                <p className="m-0 text-[12px] font-semibold text-fog">
                  Pick a bus, a battery, or both.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="rj-desc" className={labelClasses}>
                  Details
                </label>
                <textarea
                  id="rj-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(inputClasses, "resize-y")}
                />
              </div>

              {/* parts */}
              <div className="flex flex-col gap-1.5">
                <span className={labelClasses}>Parts from stock</span>
                {draftParts.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {draftParts.map((p) => (
                      <div
                        key={p.item._id}
                        className="flex items-center justify-between rounded-[10px] border border-line bg-haze px-3.5 py-2.5"
                      >
                        <span className="text-[13px] font-bold text-ink">
                          {p.item.name} × {p.quantity}
                        </span>
                        <span className="flex items-center gap-2.5">
                          <span className="text-[13px] font-extrabold text-ink">
                            {fmtNaira(p.quantity * Number(p.item.unitCost))}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${p.item.name}`}
                            onClick={() =>
                              setDraftParts((prev) =>
                                prev.filter((d) => d.item._id !== p.item._id),
                              )
                            }
                            className="cursor-pointer border-none bg-transparent text-fog transition-colors hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-[1fr_72px] gap-2">
                  <SearchSelect
                    placeholder="Search stock items"
                    search={itemSearch}
                    onSearch={setItemSearch}
                    onOpenChange={setItemOpen}
                    options={(itemData?.data ?? []).map((item) => ({
                      key: item._id,
                      title: item.name,
                      subtitle: `${item.quantityOnHand} ${item.unit} · ${fmtNaira(item.unitCost)}`,
                    }))}
                    onPick={(key) => {
                      const item = (itemData?.data ?? []).find(
                        (i) => i._id === key,
                      );
                      if (item) addDraftPart(item);
                    }}
                    emptyText="No stock item matches."
                  />
                  <input
                    type="number"
                    min={1}
                    aria-label="Quantity"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                {draftParts.length > 0 && (
                  <p className="m-0 text-[13px] font-semibold text-fog">
                    Parts so far:{" "}
                    <strong className="text-ink">{fmtNaira(draftCost)}</strong>
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!canSubmit}
                onClick={submit}
                className={cn(
                  "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                  !canSubmit
                    ? "cursor-not-allowed opacity-50"
                    : "transition-transform hover:scale-[1.02]",
                )}
              >
                {createJob.isPending ? "Opening…" : "Open repair job →"}
              </button>
            </div>
          </div>
        )}

        {/* jobs list */}
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setStatus(f.id);
                    setPage(1);
                  }}
                  className={cn(
                    "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                    status === f.id
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative sm:w-[220px]">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
              />
              <input
                type="text"
                placeholder="Job, bus or battery"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {jobs.map((job) => {
              const opener = job.openedBy as {
                firstName?: string;
                lastName?: string;
              };
              return (
                <div
                  key={job._id}
                  className="rounded-2xl border border-line bg-white px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-extrabold text-ink">
                        #{job.jobId} · {job.title}
                      </span>
                      {job.busNumber && (
                        <span className="rounded-full bg-haze px-2.5 py-1 text-[11.5px] font-extrabold text-brand-600">
                          {job.busNumber}
                        </span>
                      )}
                      {job.batteryCode && (
                        <span className="rounded-full bg-haze px-2.5 py-1 text-[11.5px] font-extrabold text-solar-700">
                          {job.batteryCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-extrabold text-ink">
                        {fmtNaira(job.totalCost)}
                      </span>
                      <StatusPill
                        tone={statusTone[job.status]}
                        label={job.status}
                      />
                    </div>
                  </div>

                  {job.parts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {job.parts.map((line, i) => (
                        <span
                          key={`${line.item}-${i}`}
                          className="text-[12.5px] font-semibold text-fog"
                        >
                          {line.itemName} × {line.quantity} ={" "}
                          {fmtNaira(line.amount)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-semibold text-fog">
                    <span>
                      {opener?.firstName} {opener?.lastName} ·{" "}
                      {fmtDate(job.createdAt)}
                    </span>
                    <span>
                      parts {fmtNaira(job.partsCost)} · labor{" "}
                      {fmtNaira(job.laborCost)}
                    </span>
                    {job.description && (
                      <span className="text-sage">{job.description}</span>
                    )}
                    {job.closeNote && (
                      <span className="text-sage">note: {job.closeNote}</span>
                    )}
                  </div>

                  {job.status === "open" && (canStock || canDecide) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-line pt-3">
                      {canStock && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddItemSearch("");
                            setAddQty("1");
                            setAddPartFor(job);
                          }}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                        >
                          <Plus size={14} /> Add part
                        </button>
                      )}
                      {canDecide && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setLaborCost("");
                              setCompleteNote("");
                              setCompleteFor(job);
                            }}
                            className="cta-gradient flex cursor-pointer items-center gap-1.5 rounded-lg border-none px-4 py-2 text-[13px] font-extrabold text-forest-deep"
                          >
                            <Check size={14} strokeWidth={3} /> Complete
                          </button>
                          {cancelFor === job._id ? (
                            <div className="flex flex-1 flex-wrap items-center gap-2">
                              <input
                                type="text"
                                autoFocus
                                placeholder="Reason (optional)"
                                value={cancelNote}
                                onChange={(e) => setCancelNote(e.target.value)}
                                className={cn(
                                  inputClasses,
                                  "flex-1 py-2 sm:text-[13px]",
                                )}
                              />
                              <button
                                type="button"
                                disabled={cancelJob.isPending}
                                onClick={() =>
                                  cancelJob.mutate(
                                    {
                                      id: job._id,
                                      payload: {
                                        note: cancelNote || undefined,
                                      },
                                    },
                                    {
                                      onSuccess: () => {
                                        setCancelFor(null);
                                        setCancelNote("");
                                      },
                                    },
                                  )
                                }
                                className="cursor-pointer rounded-lg border-none bg-red-600 px-4 py-2 text-[13px] font-extrabold text-white disabled:opacity-50"
                              >
                                Confirm cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCancelFor(job._id)}
                              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-bold text-bark transition-colors hover:border-red-300 hover:text-red-600"
                            >
                              <XIcon size={14} /> Cancel job
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
              </div>
            )}

            {!isLoading && jobs.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
                <BoltMark width={22} height={29} fill="#B5ECC2" />
                <p className="m-0 text-[15px] font-bold text-bark">
                  No repair jobs match this view.
                </p>
              </div>
            )}

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
          </div>
        </div>
      </div>

      {/* complete modal */}
      <Modal
        title={completeFor ? `Complete #${completeFor.jobId}` : "Complete"}
        open={!!completeFor}
        onClose={() => setCompleteFor(null)}
      >
        <div className="flex flex-col gap-4">
          {completeFor && (
            <p className="m-0 text-[13.5px] font-semibold text-fog">
              Parts used:{" "}
              <strong className="text-ink">
                {fmtNaira(completeFor.partsCost)}
              </strong>
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cj-labor" className={labelClasses}>
              Labor cost (₦)
            </label>
            <input
              id="cj-labor"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cj-note" className={labelClasses}>
              Note
            </label>
            <input
              id="cj-note"
              type="text"
              placeholder="What was done"
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
              className={inputClasses}
            />
          </div>
          {laborCost && !moneyPattern.test(laborCost) && (
            <span className="text-[13px] font-bold text-red-600">
              Labor cost must be a plain amount like 5000
            </span>
          )}
          <button
            type="button"
            disabled={
              completeJob.isPending ||
              (!!laborCost && !moneyPattern.test(laborCost))
            }
            onClick={() => {
              if (!completeFor) return;
              completeJob.mutate(
                {
                  id: completeFor._id,
                  payload: {
                    laborCost: laborCost || undefined,
                    note: completeNote || undefined,
                  },
                },
                { onSuccess: () => setCompleteFor(null) },
              );
            }}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completeJob.isPending ? "Closing…" : "Complete job →"}
          </button>
        </div>
      </Modal>

      {/* add part modal */}
      <Modal
        title={addPartFor ? `Add part to #${addPartFor.jobId}` : "Add part"}
        open={!!addPartFor}
        onClose={() => setAddPartFor(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_72px] items-start gap-2">
            <SearchSelect
              placeholder="Search stock items"
              search={addItemSearch}
              onSearch={setAddItemSearch}
              onOpenChange={setAddItemOpen}
              inline
              options={(addItemData?.data ?? []).map((item) => ({
                key: item._id,
                title: item.name,
                subtitle: `${item.quantityOnHand} ${item.unit} · ${fmtNaira(item.unitCost)}`,
              }))}
              onPick={(key) => {
                if (!addPartFor) return;
                addPart.mutate(
                  {
                    id: addPartFor._id,
                    payload: {
                      itemId: key,
                      quantity: Math.max(1, parseInt(addQty, 10) || 1),
                    },
                  },
                  { onSuccess: () => setAddPartFor(null) },
                );
              }}
              emptyText="No stock item matches."
            />
            <input
              type="number"
              min={1}
              aria-label="Quantity"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              className={inputClasses}
            />
          </div>
          <p className="m-0 text-[12px] font-semibold text-fog">
            Picking an item pulls it from stock immediately.
          </p>
        </div>
      </Modal>
    </>
  );
}
