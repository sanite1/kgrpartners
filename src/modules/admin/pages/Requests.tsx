import { useState } from "react";
import { Check, X as XIcon, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import StatusPill from "../components/console/StatusPill";
import SearchSelect from "../components/console/SearchSelect";
import ConfirmModal from "../components/console/ConfirmModal";
import { useGetBuses } from "@/lib/network/api/bus.api";
import { useGetItems } from "@/lib/network/api/inventory.api";
import {
  useGetPartRequests,
  useCreatePartRequest,
  useApprovePartRequest,
  useDeclinePartRequest,
} from "@/lib/network/api/partRequest.api";
import type { Bus } from "@/lib/network/types/bus.types";
import type { InventoryItem } from "@/lib/network/types/inventory.types";
import type {
  PartRequest,
  RequestStatus,
} from "@/lib/network/types/partRequest.types";
import type { ApiErrorResponse } from "@/lib/network/types/api.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../permissions";
import { cn, fmtNaira, fmtDate } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

type StatusFilter = "all" | RequestStatus;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "declined", label: "Declined" },
];

const statusTone: Record<RequestStatus, "warn" | "success" | "muted"> = {
  pending: "warn",
  approved: "success",
  declined: "muted",
};

export default function Requests() {
  const { user } = useAuthStore();
  const canDecide = canApprove(user?.role);

  // form state
  const [busSearch, setBusSearch] = useState("");
  const [busOpen, setBusOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  // a request can also be for something typed, not a registered bus
  const [typedTarget, setTypedTarget] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemOpen, setItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [narration, setNarration] = useState("");
  const [nextRequestDate, setNextRequestDate] = useState("");
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  // list state
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [approveFor, setApproveFor] = useState<PartRequest | null>(null);
  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  const { data: busData } = useGetBuses(
    { search: busSearch, isActive: "true", pageSize: 6 },
    { enabled: busOpen && !selectedBus },
  );
  const { data: itemData } = useGetItems(
    { search: itemSearch, isActive: "true", pageSize: 6 },
    { enabled: itemOpen && !selectedItem },
  );

  const { data, isLoading } = useGetPartRequests({
    page,
    pageSize,
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });
  const requests = data?.data ?? [];
  const pagination = data?.pagination;

  const createRequest = useCreatePartRequest();
  const approve = useApprovePartRequest();
  const decline = useDeclinePartRequest();

  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  const amount = selectedItem ? qty * Number(selectedItem.unitCost) : 0;

  const resetForm = () => {
    setSelectedBus(null);
    setTypedTarget("");
    setBusSearch("");
    setSelectedItem(null);
    setItemSearch("");
    setQuantity("1");
    setNarration("");
    setNextRequestDate("");
    setLockMessage(null);
    // a new request is always pending: drop any status filter or search
    // so it shows up in the list right away
    setStatus("all");
    setSearch("");
    setPage(1);
  };

  const submit = (allowOverride: boolean) => {
    if ((!selectedBus && !typedTarget) || !selectedItem || qty < 1) return;
    setLockMessage(null);
    createRequest.mutate(
      {
        busId: selectedBus?._id,
        target: selectedBus ? undefined : typedTarget,
        itemId: selectedItem._id,
        quantity: qty,
        narration: narration || undefined,
        nextRequestDate: nextRequestDate || undefined,
        allowOverride,
      },
      {
        onSuccess: resetForm,
        onError: (error) => {
          if (error.response?.status === 409) {
            const data = error.response.data as ApiErrorResponse;
            setLockMessage(data.message);
          }
        },
      },
    );
  };

  return (
    <>
      <PageMeta title="Requests | KGR Console" />
      <PageHead
        eyebrow="INVENTORY"
        title="Part Requests"
        subtitle="Request parts for a bus; approval issues the stock and books the expense."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px_1fr]">
        {/* request form */}
        <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)] lg:sticky lg:top-8">
          <h2 className="mb-4 mt-0 text-[17px] font-extrabold text-ink">
            New request
          </h2>
          <div className="flex flex-col gap-4">
            {/* bus */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rq-bus" className={labelClasses}>
                For <span className="text-brand-500">*</span>
              </label>
              {selectedBus || typedTarget ? (
                <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-4 py-3">
                  <span className="text-[15px] font-extrabold text-ink">
                    {selectedBus?.number ?? typedTarget}
                    {!selectedBus && (
                      <span className="ml-2 text-[11.5px] font-bold text-fog">
                        (typed)
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBus(null);
                      setTypedTarget("");
                      setBusSearch("");
                    }}
                    className="cursor-pointer border-none bg-transparent text-[13px] font-extrabold text-brand-600"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <SearchSelect
                  id="rq-bus"
                  placeholder="Bus number, or type anything (generator...)"
                  search={busSearch}
                  onSearch={setBusSearch}
                  onOpenChange={setBusOpen}
                  options={[
                    ...(busData?.data ?? []).map((bus) => ({
                      key: bus._id,
                      title: bus.number,
                      subtitle: bus.driverName || "",
                    })),
                    // not every request is for a bus: whatever was
                    // typed can be used as-is
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
                  onPick={(key) => {
                    if (key === "__typed__") {
                      setTypedTarget(busSearch.trim());
                      setSelectedBus(null);
                      return;
                    }
                    const bus = (busData?.data ?? []).find(
                      (b) => b._id === key,
                    );
                    if (bus) setSelectedBus(bus);
                  }}
                  emptyText="Keep typing and pick the typed option."
                />
              )}
            </div>

            {/* item */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rq-item" className={labelClasses}>
                Item <span className="text-brand-500">*</span>
              </label>
              {selectedItem ? (
                <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-4 py-3">
                  <span className="text-[15px] font-extrabold text-ink">
                    {selectedItem.name}
                    <span className="ml-2 text-[12px] font-semibold text-fog">
                      {selectedItem.quantityOnHand} {selectedItem.unit} in stock
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      setItemSearch("");
                    }}
                    className="cursor-pointer border-none bg-transparent text-[13px] font-extrabold text-brand-600"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <SearchSelect
                  id="rq-item"
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
                    if (item) setSelectedItem(item);
                  }}
                  emptyText="No stock item matches."
                />
              )}
            </div>

            {/* quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rq-qty" className={labelClasses}>
                  Quantity <span className="text-brand-500">*</span>
                </label>
                <input
                  id="rq-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rq-next" className={labelClasses}>
                  Next request
                </label>
                <input
                  id="rq-next"
                  type="date"
                  value={nextRequestDate}
                  data-placeholder="Optional"
                  onChange={(e) => setNextRequestDate(e.target.value)}
                  className={cn(inputClasses, !nextRequestDate && "date-empty")}
                />
              </div>
            </div>

            {/* narration */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rq-note" className={labelClasses}>
                Narration
              </label>
              <textarea
                id="rq-note"
                rows={3}
                placeholder="What is this for?"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className={cn(inputClasses, "resize-y")}
              />
            </div>

            {selectedItem && qty > 0 && (
              <p className="m-0 text-[13px] font-semibold text-fog">
                {qty} × {fmtNaira(selectedItem.unitCost)} ={" "}
                <strong className="text-ink">{fmtNaira(amount)}</strong>
              </p>
            )}

            {lockMessage && (
              <div className="rounded-xl border border-solar/40 bg-[#FDF6E3] px-4 py-3.5">
                <p className="m-0 text-[13px] font-semibold text-solar-700">
                  {lockMessage}. Submit anyway?
                </p>
                <div className="mt-2.5 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => submit(true)}
                    className="cursor-pointer rounded-lg border-none bg-solar px-4 py-2 text-[13px] font-extrabold text-forest-deep"
                  >
                    Submit anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setLockMessage(null)}
                    className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-bold text-bark"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={
                (!selectedBus && !typedTarget) ||
                !selectedItem ||
                qty < 1 ||
                createRequest.isPending
              }
              onClick={() => submit(false)}
              className={cn(
                "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                (!selectedBus && !typedTarget) ||
                  !selectedItem ||
                  qty < 1 ||
                  createRequest.isPending
                  ? "cursor-not-allowed opacity-50"
                  : "transition-transform hover:scale-[1.02]",
              )}
            >
              {createRequest.isPending ? "Submitting…" : "Submit request →"}
            </button>
          </div>
        </div>

        {/* list */}
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
                placeholder="Bus, item or number"
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
            {requests.map((request) => {
              const requester = request.requestedBy as {
                firstName?: string;
                lastName?: string;
              };
              return (
                <div
                  key={request._id}
                  className="rounded-2xl border border-line bg-white px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[15px] font-extrabold text-ink">
                        #{request.requestId} · {request.itemName} ×{" "}
                        {request.quantity}
                      </span>
                      <span className="ml-2 text-[13px] font-semibold text-fog">
                        for {request.busNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {request.status === "pending" && (
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                            !request.stock || !request.stock.isActive
                              ? "bg-mist text-bark"
                              : request.stock.onHand >= request.quantity
                                ? "bg-brand-50 text-brand-600"
                                : request.stock.onHand > 0
                                  ? "bg-[#FDF6E3] text-solar-700"
                                  : "bg-red-50 text-red-600",
                          )}
                        >
                          {!request.stock || !request.stock.isActive
                            ? "No longer stocked"
                            : request.stock.onHand >= request.quantity
                              ? `In stock: ${request.stock.onHand} ${request.stock.unit}`
                              : request.stock.onHand > 0
                                ? `Only ${request.stock.onHand} of ${request.quantity}`
                                : "Out of stock"}
                        </span>
                      )}
                      {request.status === "pending" &&
                        request.warehouse &&
                        request.warehouse.onHand > 0 && (
                          <span
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-[11.5px] font-extrabold text-blue-600"
                            title={`Matched to "${request.warehouse.name}" in the warehouse`}
                          >
                            Warehouse: {request.warehouse.onHand}{" "}
                            {request.warehouse.unit}
                          </span>
                        )}
                      <span className="text-[15px] font-extrabold text-ink">
                        {fmtNaira(request.amount)}
                      </span>
                      <StatusPill
                        tone={statusTone[request.status]}
                        label={request.status}
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-semibold text-fog">
                    <span>
                      {requester?.firstName} {requester?.lastName} ·{" "}
                      {fmtDate(request.createdAt)}
                    </span>
                    {request.narration && (
                      <span className="text-sage">"{request.narration}"</span>
                    )}
                    {request.nextRequestDate && (
                      <span>
                        locked until {fmtDate(request.nextRequestDate)}
                      </span>
                    )}
                    {request.decisionNote && (
                      <span className="text-sage">
                        decision: {request.decisionNote}
                      </span>
                    )}
                  </div>

                  {canDecide && request.status === "pending" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-line pt-3">
                      <button
                        type="button"
                        disabled={
                          approve.isPending ||
                          !request.stock ||
                          !request.stock.isActive ||
                          request.stock.onHand < request.quantity
                        }
                        title={
                          !request.stock || !request.stock.isActive
                            ? "This item is no longer stocked"
                            : request.stock.onHand < request.quantity
                              ? `Not enough stock: ${request.stock.onHand} of ${request.quantity}`
                              : undefined
                        }
                        onClick={() => setApproveFor(request)}
                        className="cta-gradient flex cursor-pointer items-center gap-1.5 rounded-lg border-none px-4 py-2 text-[13px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check size={14} strokeWidth={3} /> Approve & issue
                      </button>
                      {declineFor === request._id ? (
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Reason (optional)"
                            value={declineNote}
                            onChange={(e) => setDeclineNote(e.target.value)}
                            className={cn(
                              inputClasses,
                              "flex-1 py-2 sm:text-[13px]",
                            )}
                          />
                          <button
                            type="button"
                            disabled={decline.isPending}
                            onClick={() =>
                              decline.mutate(
                                {
                                  id: request._id,
                                  payload: { note: declineNote || undefined },
                                },
                                {
                                  onSuccess: () => {
                                    setDeclineFor(null);
                                    setDeclineNote("");
                                  },
                                },
                              )
                            }
                            className="cursor-pointer rounded-lg border-none bg-red-600 px-4 py-2 text-[13px] font-extrabold text-white disabled:opacity-50"
                          >
                            Confirm decline
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeclineFor(request._id)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-bold text-bark transition-colors hover:border-red-300 hover:text-red-600"
                        >
                          <XIcon size={14} /> Decline
                        </button>
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

            {!isLoading && requests.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
                <BoltMark width={22} height={29} fill="#B5ECC2" />
                <p className="m-0 text-[15px] font-bold text-bark">
                  No requests match this view.
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
      <ConfirmModal
        open={approveFor !== null}
        title="Approve and issue?"
        message={
          <>
            Approve <strong>#{approveFor?.requestId}</strong>:{" "}
            <strong>
              {approveFor?.itemName} × {approveFor?.quantity}
            </strong>{" "}
            for <strong>{approveFor?.busNumber}</strong>? This deducts the
            stock ({approveFor?.stock ? `${approveFor.stock.onHand} on hand` : "count unknown"}
            {approveFor?.warehouse && approveFor.warehouse.onHand > 0
              ? `, warehouse holds ${approveFor.warehouse.onHand} more`
              : ""})
            and books {fmtNaira(approveFor?.amount ?? "0")} as an expenditure.
          </>
        }
        confirmLabel="Yes, approve"
        loading={approve.isPending}
        onConfirm={() =>
          approveFor &&
          approve.mutate(
            { id: approveFor._id, payload: {} },
            { onSuccess: () => setApproveFor(null) },
          )
        }
        onClose={() => setApproveFor(null)}
      />
    </>
  );
}
