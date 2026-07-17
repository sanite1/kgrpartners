import { useState } from "react";
import { Plus, Pencil, ArrowUpDown, History, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import Modal from "../components/console/Modal";
import ItemForm from "../components/inventory/ItemForm";
import {
  useGetItems,
  useAdjustStock,
  useGetMovements,
} from "@/lib/network/api/inventory.api";
import type {
  InventoryItem,
  StockMovementType,
} from "@/lib/network/types/inventory.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canManageStock } from "../permissions";
import { cn, fmtNaira, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

type CategoryFilter = "all" | "part" | "battery" | "consumable" | "low";

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "part", label: "Parts" },
  { id: "battery", label: "Batteries" },
  { id: "consumable", label: "Consumables" },
  { id: "low", label: "Low stock" },
];

const categoryTone: Record<string, "success" | "warn" | "muted"> = {
  battery: "success",
  part: "muted",
  consumable: "warn",
};

const MovementsList = ({ itemId }: { itemId: string }) => {
  const { data, isLoading } = useGetMovements(itemId);
  const movements = data?.data ?? [];
  if (isLoading)
    return (
      <div className="flex justify-center py-8">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      </div>
    );
  if (movements.length === 0)
    return (
      <p className="m-0 py-6 text-center text-[14px] font-semibold text-fog">
        No movements yet.
      </p>
    );
  return (
    <div className="flex flex-col">
      {movements.map((m) => {
        const by = m.by as { firstName?: string; lastName?: string };
        return (
          <div
            key={m._id}
            className="flex items-center justify-between border-b border-line py-3 last:border-b-0"
          >
            <div>
              <span
                className={cn(
                  "text-[13px] font-extrabold",
                  m.type === "in"
                    ? "text-brand-600"
                    : m.type === "out"
                      ? "text-red-600"
                      : "text-solar-700",
                )}
              >
                {m.type === "in" ? "+" : m.type === "out" ? "-" : "="}
                {m.quantity}
              </span>
              <span className="ml-2 text-[13px] font-semibold text-bark">
                {m.note || m.type}
              </span>
            </div>
            <div className="text-right text-[12px] font-semibold text-fog">
              <div>balance {m.balanceAfter}</div>
              <div>
                {fmtDate(m.createdAt)} · {by?.firstName} {by?.lastName}
              </div>
              <div>{fmtTime(m.createdAt)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function Inventory() {
  const { user } = useAuthStore();
  const canStock = canManageStock(user?.role);

  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemModal, setItemModal] = useState<null | { item?: InventoryItem }>(
    null,
  );
  const [adjustFor, setAdjustFor] = useState<InventoryItem | null>(null);
  const [movementsFor, setMovementsFor] = useState<InventoryItem | null>(null);

  // adjust form state
  const [adjType, setAdjType] = useState<StockMovementType>("in");
  const [adjQty, setAdjQty] = useState("1");
  const [adjNote, setAdjNote] = useState("");

  const { data, isLoading } = useGetItems({
    page,
    pageSize: 20,
    category: filter === "all" || filter === "low" ? undefined : filter,
    lowStock: filter === "low" ? "true" : undefined,
    search: search || undefined,
  });
  const items = data?.data ?? [];
  const pagination = data?.pagination;

  const adjustStock = useAdjustStock();

  const submitAdjust = () => {
    if (!adjustFor) return;
    adjustStock.mutate(
      {
        id: adjustFor._id,
        payload: {
          type: adjType,
          quantity: Math.max(0, Number(adjQty) || 0),
          note: adjNote || undefined,
        },
      },
      {
        onSuccess: () => {
          setAdjustFor(null);
          setAdjQty("1");
          setAdjNote("");
          setAdjType("in");
        },
      },
    );
  };

  return (
    <>
      <PageMeta title="Inventory | KGR Console" />
      <PageHead
        eyebrow="INVENTORY"
        title="Stock"
        subtitle="Parts, batteries and consumables, with every movement on record."
        actions={
          canStock ? (
            <button
              type="button"
              onClick={() => setItemModal({})}
              className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={2.6} /> Add item
            </button>
          ) : undefined
        }
      />

      {/* filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
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
        <div className="relative sm:w-[240px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Search items"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {[
                  "ITEM",
                  "CATEGORY",
                  "IN STOCK",
                  "UNIT COST",
                  "STOCK VALUE",
                  "STATUS",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const low = item.quantityOnHand <= item.minLevel;
                return (
                  <tr
                    key={item._id}
                    className="border-b border-line transition-colors last:border-b-0 hover:bg-haze"
                  >
                    <td className="px-4 py-4 text-[14px] font-extrabold text-ink">
                      {item.name}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill
                        tone={categoryTone[item.category] ?? "muted"}
                        label={item.category}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "text-[14px] font-extrabold",
                          low ? "text-red-600" : "text-ink",
                        )}
                      >
                        {item.quantityOnHand} {item.unit}
                      </span>
                      {low && (
                        <span className="ml-2 text-[11px] font-extrabold text-red-600">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[14px] font-semibold text-bark">
                      {fmtNaira(item.unitCost)}
                    </td>
                    <td className="px-4 py-4 text-[14px] font-extrabold text-ink">
                      {fmtNaira(item.quantityOnHand * Number(item.unitCost))}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill
                        tone={item.isActive ? "success" : "muted"}
                        label={item.isActive ? "Active" : "Retired"}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Movement history"
                          onClick={() => setMovementsFor(item)}
                          className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                        >
                          <History size={14} />
                        </button>
                        {canStock && (
                          <>
                            <button
                              type="button"
                              title="Adjust stock"
                              onClick={() => setAdjustFor(item)}
                              className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                            >
                              <ArrowUpDown size={14} />
                            </button>
                            <button
                              type="button"
                              title="Edit item"
                              onClick={() => setItemModal({ item })}
                              className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                            >
                              <Pencil size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {search || filter !== "all"
                ? "Nothing in stock matches this view."
                : "Stock is empty. Add the first item."}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center px-6 py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {pagination && pagination.totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
            <span className="text-[13px] font-semibold text-fog">
              {pagination.totalItems} item
              {pagination.totalItems === 1 ? "" : "s"} · page {pagination.page}{" "}
              of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {/* add/edit item */}
      <Modal
        title={itemModal?.item ? `Edit ${itemModal.item.name}` : "Add an item"}
        open={itemModal !== null}
        onClose={() => setItemModal(null)}
      >
        {itemModal && (
          <ItemForm item={itemModal.item} onDone={() => setItemModal(null)} />
        )}
      </Modal>

      {/* adjust stock */}
      <Modal
        title={adjustFor ? `Adjust ${adjustFor.name}` : ""}
        open={adjustFor !== null}
        onClose={() => setAdjustFor(null)}
      >
        {adjustFor && (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-[13px] font-semibold text-fog">
              Currently {adjustFor.quantityOnHand} {adjustFor.unit} in stock.
            </p>
            <div className="flex gap-2">
              {(
                [
                  ["in", "Stock in"],
                  ["out", "Stock out"],
                  ["adjust", "Set exact"],
                ] as [StockMovementType, string][]
              ).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAdjType(t)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-lg border px-3 py-2.5 text-[13px] font-bold transition-colors",
                    adjType === t
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adj-qty" className={labelClasses}>
                {adjType === "adjust" ? "New exact quantity" : "Quantity"}
              </label>
              <input
                id="adj-qty"
                type="number"
                min={0}
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adj-note" className={labelClasses}>
                Note
              </label>
              <input
                id="adj-note"
                type="text"
                placeholder="Delivery, damage, stocktake..."
                value={adjNote}
                onChange={(e) => setAdjNote(e.target.value)}
                className={inputClasses}
              />
            </div>
            <button
              type="button"
              disabled={adjustStock.isPending}
              onClick={submitAdjust}
              className={cn(
                "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                adjustStock.isPending
                  ? "cursor-not-allowed opacity-60"
                  : "transition-transform hover:scale-[1.02]",
              )}
            >
              {adjustStock.isPending ? "Saving…" : "Apply →"}
            </button>
          </div>
        )}
      </Modal>

      {/* movements */}
      <Modal
        title={movementsFor ? `${movementsFor.name} history` : ""}
        open={movementsFor !== null}
        onClose={() => setMovementsFor(null)}
      >
        {movementsFor && <MovementsList itemId={movementsFor._id} />}
      </Modal>
    </>
  );
}
