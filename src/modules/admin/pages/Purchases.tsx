import { useState } from "react";
import {
  Check,
  CircleCheckBig,
  MapPin,
  Plus,
  Search,
  Ship,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import Drawer from "../components/console/Drawer";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetPurchases,
  useCreatePurchase,
  useUpdatePurchase,
  useSetPurchaseStatus,
} from "@/lib/network/api/purchase.api";
import type {
  PurchaseOrder,
  PurchaseStatus,
} from "@/lib/network/types/purchase.types";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

const STAGES: PurchaseStatus[] = [
  "purchased",
  "shipping",
  "arrived",
  "delivered",
];

const STAGE_META: Record<
  PurchaseStatus,
  { label: string; icon: LucideIcon; hint: string }
> = {
  purchased: {
    label: "Purchased",
    icon: ShoppingCart,
    hint: "Paid for, with the supplier",
  },
  shipping: { label: "Shipping", icon: Ship, hint: "On its way to Nigeria" },
  arrived: { label: "Arrived", icon: MapPin, hint: "In the country" },
  delivered: {
    label: "Delivered",
    icon: CircleCheckBig,
    hint: "In our hands",
  },
};

// the horizontal journey line on every order card
const Stepper = ({ status }: { status: PurchaseStatus }) => {
  const current = STAGES.indexOf(status);
  return (
    <div className="flex items-start">
      {STAGES.map((stage, i) => {
        const Icon = STAGE_META[stage].icon;
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={stage}
            className={cn("flex items-start", i > 0 && "flex-1")}
          >
            {i > 0 && (
              <div
                className={cn(
                  "mt-[17px] h-[3px] flex-1 rounded-full",
                  i <= current ? "bg-brand-500" : "bg-line",
                )}
              />
            )}
            <div className="flex w-[64px] flex-none flex-col items-center gap-1.5 sm:w-[84px]">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-brand-500 bg-brand-500 text-white",
                  active &&
                    "border-brand-500 bg-brand-50 text-brand-600 shadow-[0_0_0_4px_rgba(15,165,58,0.15)]",
                  !done && !active && "border-line bg-white text-fog",
                )}
              >
                {done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
              </span>
              <span
                className={cn(
                  "text-center text-[10px] font-extrabold uppercase tracking-[0.5px] sm:text-[10.5px]",
                  active ? "text-brand-600" : done ? "text-ink" : "text-fog",
                )}
              >
                {STAGE_META[stage].label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function Purchases() {
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // new order modal
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [supplier, setSupplier] = useState("");
  const [quantity, setQuantity] = useState("");
  const [tracking, setTracking] = useState("");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // drawer
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [moveNote, setMoveNote] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editExpected, setEditExpected] = useState("");

  const { data, isLoading } = useGetPurchases({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });
  const orders = data?.data ?? [];
  const counts = data?.counts;
  const total =
    (counts?.purchased ?? 0) +
    (counts?.shipping ?? 0) +
    (counts?.arrived ?? 0) +
    (counts?.delivered ?? 0);

  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const setStatus = useSetPurchaseStatus();

  const openAdd = () => {
    setTitle("");
    setSupplier("");
    setQuantity("");
    setTracking("");
    setExpected("");
    setNotes("");
    setError("");
    setAddOpen(true);
  };

  const openOrder = (order: PurchaseOrder) => {
    setSelected(order);
    setMoveNote("");
    setEditTracking(order.trackingNumber);
    setEditExpected(order.expectedArrival);
  };

  const saveNew = () => {
    if (title.trim().length < 2) {
      setError("Describe what was bought");
      return;
    }
    const qty = quantity.trim() === "" ? undefined : parseInt(quantity, 10);
    if (qty !== undefined && !(qty >= 1)) {
      setError("Quantity must be at least 1");
      return;
    }
    setError("");
    createPurchase.mutate(
      {
        title: title.trim(),
        supplier: supplier.trim() || undefined,
        quantity: qty,
        trackingNumber: tracking.trim() || undefined,
        expectedArrival: expected || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: () => setAddOpen(false) },
    );
  };

  const refreshSelected = (res: { data?: PurchaseOrder }) =>
    setSelected(res.data ?? null);

  const nextStage: PurchaseStatus | null = selected
    ? (STAGES[STAGES.indexOf(selected.status) + 1] ?? null)
    : null;

  return (
    <>
      <PageMeta title="Purchases | KGR Console" />
      <PageHead
        eyebrow="BOUGHT ABROAD"
        title="Purchases"
        subtitle="Every foreign order and exactly where it is on the journey home."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> New order
          </button>
        }
      />

      {/* stage board */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
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
          <span
            className={cn(
              "block text-[24px] font-extrabold leading-none",
              statusFilter === "all" ? "text-neon" : "text-ink",
            )}
          >
            {total}
          </span>
          <span
            className={cn(
              "mt-1.5 block text-[11px] font-extrabold tracking-[1px]",
              statusFilter === "all" ? "text-mint" : "text-fog",
            )}
          >
            ALL ORDERS
          </span>
        </button>
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => {
              setStatusFilter(stage);
              setPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-2xl border p-4 text-left transition-colors",
              statusFilter === stage
                ? "border-forest-border bg-forest-deep"
                : "border-line bg-white hover:border-brand-500",
            )}
          >
            <span
              className={cn(
                "block text-[24px] font-extrabold leading-none",
                statusFilter === stage ? "text-neon" : "text-ink",
              )}
            >
              {counts?.[stage] ?? 0}
            </span>
            <span
              className={cn(
                "mt-1.5 block text-[11px] font-extrabold uppercase tracking-[1px]",
                statusFilter === stage ? "text-mint" : "text-fog",
              )}
            >
              {STAGE_META[stage].label}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex justify-end">
        <div className="relative w-full sm:w-[260px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Order, supplier or tracking no"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      {/* order cards with the journey stepper */}
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <button
            key={order._id}
            type="button"
            onClick={() => openOrder(order)}
            className="cursor-pointer rounded-2xl border border-line bg-white p-5 text-left transition-colors hover:border-brand-500"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 truncate text-[16px] font-extrabold tracking-[-0.2px] text-ink">
                  {order.title}
                  {order.quantity ? (
                    <span className="ml-2 rounded-full bg-haze px-2 py-0.5 text-[11.5px] font-bold text-bark">
                      qty {order.quantity}
                    </span>
                  ) : null}
                </p>
                <p className="m-0 mt-0.5 text-[12.5px] font-semibold text-fog">
                  #{order.orderId}
                  {order.supplier && <> · {order.supplier}</>}
                  {order.trackingNumber && <> · {order.trackingNumber}</>}
                  {order.expectedArrival && (
                    <> · expected {fmtDate(order.expectedArrival)}</>
                  )}
                </p>
              </div>
              <span className="text-[12px] font-semibold text-fog">
                {fmtDate(order.createdAt)}
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[320px]">
                <Stepper status={order.status} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            No orders in this view.
          </p>
        </div>
      )}

      <Pagination
        pagination={data?.pagination}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />

      {/* order drawer: timeline + tracking details + stage moves */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Order #${selected.orderId}` : ""}
        subtitle={selected?.title}
        footer={
          selected && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Note for this move (optional)"
                value={moveNote}
                onChange={(e) => setMoveNote(e.target.value)}
                className={cn(inputClasses, "sm:text-[13.5px]")}
              />
              <div className="flex flex-wrap gap-2">
                {nextStage && (
                  <button
                    type="button"
                    disabled={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate(
                        {
                          id: selected._id,
                          payload: {
                            status: nextStage,
                            note: moveNote || undefined,
                          },
                        },
                        { onSuccess: refreshSelected },
                      )
                    }
                    className="cta-gradient flex-1 cursor-pointer rounded-lg border-none px-4 py-2.5 text-[13.5px] font-extrabold text-forest-deep disabled:opacity-50"
                  >
                    Mark {STAGE_META[nextStage].label.toLowerCase()} →
                  </button>
                )}
                <select
                  aria-label="Correct the stage"
                  value=""
                  disabled={setStatus.isPending}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setStatus.mutate(
                      {
                        id: selected._id,
                        payload: {
                          status: e.target.value as PurchaseStatus,
                          note: moveNote || undefined,
                        },
                      },
                      { onSuccess: refreshSelected },
                    );
                  }}
                  className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2.5 text-base font-bold text-bark outline-none transition-colors hover:border-brand-500 sm:text-[13px]"
                >
                  <option value="">Correct stage…</option>
                  {STAGES.filter((s) => s !== selected.status).map((s) => (
                    <option key={s} value={s}>
                      {STAGE_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        }
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-line bg-haze p-4">
              <Stepper status={selected.status} />
              <p className="m-0 mt-3 text-center text-[12.5px] font-semibold text-fog">
                {STAGE_META[selected.status].hint}
              </p>
            </div>

            {/* tracking details, editable as info trickles in */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-extrabold tracking-[1px] text-brand-600">
                TRACKING DETAILS
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                    TRACKING NUMBER
                  </span>
                  <input
                    type="text"
                    placeholder="Not yet given"
                    value={editTracking}
                    onChange={(e) => setEditTracking(e.target.value)}
                    className={cn(inputClasses, "py-2.5 sm:text-[13.5px]")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                    EXPECTED ARRIVAL
                  </span>
                  <input
                    type="date"
                    value={editExpected}
                    onChange={(e) => setEditExpected(e.target.value)}
                    className={cn(inputClasses, "py-2.5 sm:text-[13.5px]")}
                  />
                </div>
              </div>
              {(editTracking !== selected.trackingNumber ||
                editExpected !== selected.expectedArrival) && (
                <button
                  type="button"
                  disabled={updatePurchase.isPending}
                  onClick={() =>
                    updatePurchase.mutate(
                      {
                        id: selected._id,
                        payload: {
                          trackingNumber: editTracking,
                          expectedArrival: editExpected,
                        },
                      },
                      { onSuccess: refreshSelected },
                    )
                  }
                  className="w-fit cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-extrabold text-bark transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
                >
                  {updatePurchase.isPending ? "Saving…" : "Save tracking details"}
                </button>
              )}
              {selected.supplier && (
                <p className="m-0 text-[13px] font-semibold text-bark">
                  Supplier: <strong>{selected.supplier}</strong>
                </p>
              )}
              {selected.notes && (
                <p className="m-0 whitespace-pre-line rounded-xl border border-line bg-white p-3.5 text-[13px] font-medium leading-[1.6] text-bark">
                  {selected.notes}
                </p>
              )}
            </div>

            {/* the journey so far */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-extrabold tracking-[1px] text-brand-600">
                JOURNEY
              </span>
              <div className="flex flex-col">
                {[...selected.history].reverse().map((event, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "mt-1 h-3 w-3 flex-none rounded-full",
                          i === 0 ? "bg-brand-500" : "bg-line",
                        )}
                      />
                      {i < arr.length - 1 && (
                        <span className="w-[2px] flex-1 bg-line" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="m-0 text-[13.5px] font-extrabold text-ink">
                        {STAGE_META[event.status].label}
                        <span className="ml-2 text-[12px] font-semibold text-fog">
                          {fmtDate(event.at)} · {fmtTime(event.at)}
                        </span>
                      </p>
                      <p className="m-0 mt-0.5 text-[12.5px] font-semibold text-fog">
                        {event.byName || "—"}
                        {event.note && <> · {event.note}</>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* new order modal */}
      <Modal title="New order" open={addOpen} onClose={() => setAddOpen(false)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="po-title" className={labelClasses}>
              What was bought <span className="text-brand-500">*</span>
            </label>
            <input
              id="po-title"
              type="text"
              placeholder="40 BMS boards"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="po-supplier" className={labelClasses}>
                Supplier
              </label>
              <input
                id="po-supplier"
                type="text"
                placeholder="Who we bought from"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="po-qty" className={labelClasses}>
                Quantity
              </label>
              <input
                id="po-qty"
                type="number"
                min={1}
                placeholder="Optional"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="po-tracking" className={labelClasses}>
                Tracking number
              </label>
              <input
                id="po-tracking"
                type="text"
                placeholder="Add later if unknown"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="po-expected" className={labelClasses}>
                Expected arrival
              </label>
              <input
                id="po-expected"
                type="date"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="po-notes" className={labelClasses}>
              Notes
            </label>
            <textarea
              id="po-notes"
              rows={2}
              placeholder="Anything worth remembering about this order"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={cn(inputClasses, "resize-y")}
            />
          </div>

          {error && <span className={errorClasses}>{error}</span>}

          <button
            type="button"
            disabled={createPurchase.isPending}
            onClick={saveNew}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createPurchase.isPending ? "Saving…" : "Register order →"}
          </button>
        </div>
      </Modal>
    </>
  );
}
