import { useState } from "react";
import { Check, X as XIcon, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
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
import type { RequestStatus } from "@/lib/network/types/partRequest.types";
import type { ApiErrorResponse } from "@/lib/network/types/api.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
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
  const isAdmin = user?.role === "admin";

  // form state
  const [busSearch, setBusSearch] = useState("");
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [narration, setNarration] = useState("");
  const [nextRequestDate, setNextRequestDate] = useState("");
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  // list state
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  const { data: busData } = useGetBuses(
    { search: busSearch, isActive: "true", pageSize: 6 },
    { enabled: busSearch.length > 0 && !selectedBus },
  );
  const { data: itemData } = useGetItems(
    { search: itemSearch, isActive: "true", pageSize: 6 },
    { enabled: itemSearch.length > 0 && !selectedItem },
  );

  const { data, isLoading } = useGetPartRequests({
    page,
    pageSize: 15,
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
    setBusSearch("");
    setSelectedItem(null);
    setItemSearch("");
    setQuantity("1");
    setNarration("");
    setNextRequestDate("");
    setLockMessage(null);
  };

  const submit = (allowOverride: boolean) => {
    if (!selectedBus || !selectedItem || qty < 1) return;
    setLockMessage(null);
    createRequest.mutate(
      {
        busId: selectedBus._id,
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

  const pickerDropdown = <T,>(
    entries: T[],
    render: (entry: T) => { key: string; title: string; subtitle: string },
    onPick: (entry: T) => void,
  ) => (
    <div className="absolute inset-x-0 top-[52px] z-20 overflow-hidden rounded-xl border border-line bg-white shadow-[0_18px_44px_rgba(13,31,21,0.15)]">
      {entries.map((entry) => {
        const r = render(entry);
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => onPick(entry)}
            className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-4 py-3 text-left transition-colors hover:bg-haze"
          >
            <span className="text-[14px] font-extrabold text-ink">
              {r.title}
            </span>
            <span className="text-[12px] font-semibold text-fog">
              {r.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );

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
                Bus <span className="text-brand-500">*</span>
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
                <div className="relative">
                  <input
                    id="rq-bus"
                    type="text"
                    placeholder="Search bus number"
                    value={busSearch}
                    onChange={(e) => setBusSearch(e.target.value)}
                    className={inputClasses}
                    autoComplete="off"
                  />
                  {busSearch &&
                    (busData?.data ?? []).length > 0 &&
                    pickerDropdown(
                      busData?.data ?? [],
                      (bus) => ({
                        key: bus._id,
                        title: bus.number,
                        subtitle: bus.driverName || "",
                      }),
                      setSelectedBus,
                    )}
                </div>
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
                <div className="relative">
                  <input
                    id="rq-item"
                    type="text"
                    placeholder="Search stock items"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className={inputClasses}
                    autoComplete="off"
                  />
                  {itemSearch &&
                    (itemData?.data ?? []).length > 0 &&
                    pickerDropdown(
                      itemData?.data ?? [],
                      (item) => ({
                        key: item._id,
                        title: item.name,
                        subtitle: `${item.quantityOnHand} ${item.unit} · ${fmtNaira(item.unitCost)}`,
                      }),
                      setSelectedItem,
                    )}
                </div>
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
                  onChange={(e) => setNextRequestDate(e.target.value)}
                  className={inputClasses}
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
                !selectedBus || !selectedItem || qty < 1 || createRequest.isPending
              }
              onClick={() => submit(false)}
              className={cn(
                "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                !selectedBus || !selectedItem || qty < 1 || createRequest.isPending
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
                className={cn(inputClasses, "py-2.5 pl-9 text-[14px]")}
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
                        #{request.requestId} · {request.itemName} × {request.quantity}
                      </span>
                      <span className="ml-2 text-[13px] font-semibold text-fog">
                        for {request.busNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
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
                      <span>locked until {fmtDate(request.nextRequestDate)}</span>
                    )}
                    {request.decisionNote && (
                      <span className="text-sage">
                        decision: {request.decisionNote}
                      </span>
                    )}
                  </div>

                  {isAdmin && request.status === "pending" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-line pt-3">
                      <button
                        type="button"
                        disabled={approve.isPending}
                        onClick={() =>
                          approve.mutate({ id: request._id, payload: {} })
                        }
                        className="cta-gradient flex cursor-pointer items-center gap-1.5 rounded-lg border-none px-4 py-2 text-[13px] font-extrabold text-forest-deep disabled:opacity-50"
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
                              "flex-1 py-2 text-[13px]",
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

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => p - 1)}
                  className="cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
