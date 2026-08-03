import { useState } from "react";
import { Plus, Pencil, Trash2, RefreshCcw } from "lucide-react";
import BoltMark from "@/components/shared/BoltMark";
import Modal from "../console/Modal";
import ConfirmModal from "../console/ConfirmModal";
import {
  useGetPriceList,
  useCreatePriceItem,
  useUpdatePriceItem,
  useDeletePriceItem,
  useUpdatePriceSettings,
} from "@/lib/network/api/priceList.api";
import type { PriceListItem } from "@/lib/network/types/priceList.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../../permissions";
import { cn, fmtNaira, fmtDate } from "@/lib/utils";
import { inputClasses, labelClasses, errorClasses } from "../console/form";

const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// The "KGR items prices in dollars" sheet: dollar prices and weights
// stay put; updating the single exchange rate reprices every total.
export default function PriceListSection() {
  const { user } = useAuthStore();
  const isManager = canApprove(user?.role);

  const { data, isLoading } = useGetPriceList();
  const list = data?.data;
  const items = list?.items ?? [];
  const rate = list?.rate ?? 0;

  // item modal (add or edit)
  const [itemModal, setItemModal] = useState<null | { item?: PriceListItem }>(
    null,
  );
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [usd, setUsd] = useState("");
  const [error, setError] = useState("");

  // rate modal
  const [rateOpen, setRateOpen] = useState(false);
  const [rateInput, setRateInput] = useState("");

  // notes modal
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [deleteFor, setDeleteFor] = useState<PriceListItem | null>(null);

  const createItem = useCreatePriceItem();
  const updateItem = useUpdatePriceItem();
  const deleteItem = useDeletePriceItem();
  const updateSettings = useUpdatePriceSettings();

  const openItem = (item?: PriceListItem) => {
    setName(item?.name ?? "");
    setWeight(item?.weight ?? "");
    setUsd(item ? String(item.usd) : "");
    setError("");
    setItemModal({ item });
  };

  const saveItem = () => {
    if (name.trim().length < 1) {
      setError("Type the item name");
      return;
    }
    const usdNum = Number(usd);
    if (!(usdNum >= 0) || usd.trim() === "") {
      setError("Enter the dollar price");
      return;
    }
    setError("");
    const payload = { name: name.trim(), weight: weight.trim(), usd: usdNum };
    if (itemModal?.item) {
      updateItem.mutate(
        { id: itemModal.item._id, payload },
        { onSuccess: () => setItemModal(null) },
      );
    } else {
      createItem.mutate(payload, { onSuccess: () => setItemModal(null) });
    }
  };

  const saveRate = () => {
    const next = Number(rateInput);
    if (!(next >= 1)) return;
    updateSettings.mutate(
      { rate: next },
      { onSuccess: () => setRateOpen(false) },
    );
  };

  const totalUsd = items.reduce((sum, i) => sum + i.usd, 0);
  const saving = createItem.isPending || updateItem.isPending;

  return (
    <>
      {/* actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[13.5px] font-semibold text-fog">
          Dollar prices stay put; update the rate and every total reprices.
        </p>
        {isManager && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setRateInput(String(rate || ""));
                setRateOpen(true);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              <RefreshCcw size={14} /> Update rate
            </button>
            <button
              type="button"
              onClick={() => openItem()}
              className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-4 py-2.5 text-[13.5px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
            >
              <Plus size={15} strokeWidth={3} /> Add item
            </button>
          </div>
        )}
      </div>

      {/* the sheet's header numbers */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          <span className="block text-[22px] font-extrabold leading-none text-neon">
            ₦{rate.toLocaleString("en-NG")}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            NAIRA PER DOLLAR
          </span>
          {list?.rateUpdatedAt && (
            <span className="mt-1 block text-[10.5px] font-semibold text-mint/70">
              {list.rateUpdatedByName} · {fmtDate(list.rateUpdatedAt)}
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[22px] font-extrabold leading-none text-ink">
            {items.length}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            ITEMS
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[22px] font-extrabold leading-none text-ink">
            {fmtUsd(totalUsd)}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            TOTAL · USD
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[22px] font-extrabold leading-none text-brand-600">
            {fmtNaira(totalUsd * rate)}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            TOTAL · NAIRA
          </span>
        </div>
      </div>

      {/* the sheet */}
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["S/N", "ITEM", "KG/CBM", "USD $", "RATE", "TOTAL"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                    >
                      {h}
                    </th>
                  ),
                )}
                {isManager && <th className="px-4 py-3.5" />}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={item._id}
                  className="border-b border-line transition-colors last:border-b-0 hover:bg-haze"
                >
                  <td className="px-4 py-3.5 text-[13px] font-bold tabular-nums text-fog">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] font-extrabold text-ink">
                    {item.name}
                  </td>
                  <td className="px-4 py-3.5 text-[13.5px] font-semibold text-bark">
                    {item.weight || "-"}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] font-bold tabular-nums text-bark">
                    {fmtUsd(item.usd)}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold tabular-nums text-fog">
                    {rate.toLocaleString("en-NG")}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] font-extrabold text-ink">
                    {fmtNaira(item.usd * rate)}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Edit item"
                          onClick={() => openItem(item)}
                          className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Remove item"
                          disabled={deleteItem.isPending}
                          onClick={() => setDeleteFor(item)}
                          className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex justify-center px-6 py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              The price list is empty. Add the first item.
            </p>
          </div>
        )}
      </div>

      {/* the red shipping lines from the paper */}
      {list?.notes && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/60 p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-extrabold tracking-[1.5px] text-red-600">
              SHIPPING
            </span>
            {isManager && (
              <button
                type="button"
                onClick={() => {
                  setNotesInput(list.notes);
                  setNotesOpen(true);
                }}
                className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-extrabold text-red-600 hover:text-red-500"
              >
                Edit
              </button>
            )}
          </div>
          {list.notes.split("\n").map((line, i) => (
            <p
              key={i}
              className="m-0 text-[13.5px] font-extrabold leading-relaxed text-red-600"
            >
              {line}
            </p>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteFor !== null}
        title="Remove item?"
        message={
          <>
            Remove <strong>{deleteFor?.name}</strong> from the price list?
            This cannot be undone.
          </>
        }
        loading={deleteItem.isPending}
        onConfirm={() =>
          deleteFor &&
          deleteItem.mutate(deleteFor._id, {
            onSuccess: () => setDeleteFor(null),
          })
        }
        onClose={() => setDeleteFor(null)}
      />

      {/* add or edit item */}
      <Modal
        title={itemModal?.item ? `Edit ${itemModal.item.name}` : "Add an item"}
        open={itemModal !== null}
        onClose={() => setItemModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pl-name" className={labelClasses}>
              Item name <span className="text-brand-500">*</span>
            </label>
            <input
              id="pl-name"
              type="text"
              placeholder="Electric Motor 8kw"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pl-weight" className={labelClasses}>
                KG / CBM
              </label>
              <input
                id="pl-weight"
                type="text"
                placeholder="21.5KG"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={inputClasses}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pl-usd" className={labelClasses}>
                Price (USD $) <span className="text-brand-500">*</span>
              </label>
              <input
                id="pl-usd"
                type="number"
                min={0}
                step="0.01"
                placeholder="247"
                value={usd}
                onChange={(e) => setUsd(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          {usd.trim() !== "" && rate > 0 && (
            <p className="m-0 text-[13px] font-semibold text-fog">
              At today's rate: {fmtNaira((Number(usd) || 0) * rate)}
            </p>
          )}
          {error && <span className={errorClasses}>{error}</span>}
          <button
            type="button"
            disabled={saving}
            onClick={saveItem}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : itemModal?.item ? "Save changes" : "Add →"}
          </button>
        </div>
      </Modal>

      {/* update the rate: the one number that reprices everything */}
      <Modal
        title="Update exchange rate"
        open={rateOpen}
        onClose={() => setRateOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pl-rate" className={labelClasses}>
              Naira per dollar <span className="text-brand-500">*</span>
            </label>
            <input
              id="pl-rate"
              type="number"
              min={1}
              step="0.01"
              placeholder="1407"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className={inputClasses}
            />
          </div>
          <p className="m-0 text-[13px] font-semibold text-fog">
            Every naira total on the list reprices instantly with this rate.
          </p>
          <button
            type="button"
            disabled={updateSettings.isPending || !(Number(rateInput) >= 1)}
            onClick={saveRate}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateSettings.isPending ? "Saving…" : "Update rate →"}
          </button>
        </div>
      </Modal>

      {/* edit the shipping notes */}
      <Modal
        title="Shipping notes"
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <textarea
            rows={5}
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className={cn(inputClasses, "resize-y")}
          />
          <button
            type="button"
            disabled={updateSettings.isPending}
            onClick={() =>
              updateSettings.mutate(
                { notes: notesInput },
                { onSuccess: () => setNotesOpen(false) },
              )
            }
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateSettings.isPending ? "Saving…" : "Save notes"}
          </button>
        </div>
      </Modal>
    </>
  );
}
