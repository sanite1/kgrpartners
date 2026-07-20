import { useState } from "react";
import { useCreateItem, useUpdateItem } from "@/lib/network/api/inventory.api";
import type {
  InventoryItem,
  ItemCategory,
} from "@/lib/network/types/inventory.types";
import { inputClasses, labelClasses, errorClasses } from "../console/form";
import { cn } from "@/lib/utils";

interface ItemFormProps {
  item?: InventoryItem; // present = edit
  onDone: () => void;
}

const ItemForm = ({ item, onDone }: ItemFormProps) => {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<ItemCategory>(
    item?.category ?? "part",
  );
  const [unit, setUnit] = useState(item?.unit ?? "pcs");
  const [unitCost, setUnitCost] = useState(item?.unitCost ?? "");
  const [minLevel, setMinLevel] = useState(String(item?.minLevel ?? 0));
  const [openingQty, setOpeningQty] = useState("0");
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [error, setError] = useState("");

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const isPending = createItem.isPending || updateItem.isPending;

  const handleSubmit = () => {
    if (name.trim().length < 2) {
      setError("Enter the item name");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(unitCost)) {
      setError("Unit cost must be a plain amount like 2500");
      return;
    }
    setError("");
    if (item) {
      updateItem.mutate(
        {
          id: item._id,
          payload: {
            name: name.trim(),
            category,
            unit,
            unitCost,
            minLevel: Number(minLevel) || 0,
            isActive,
          },
        },
        { onSuccess: onDone },
      );
    } else {
      createItem.mutate(
        {
          name: name.trim(),
          category,
          unit,
          unitCost,
          minLevel: Number(minLevel) || 0,
          quantityOnHand: Number(openingQty) || 0,
        },
        { onSuccess: onDone },
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-name" className={labelClasses}>
          Item name <span className="text-brand-500">*</span>
        </label>
        <input
          id="item-name"
          type="text"
          placeholder="Brake pads"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-category" className={labelClasses}>
            Category
          </label>
          <select
            id="item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className={inputClasses}
          >
            <option value="part">Part</option>
            <option value="battery">Battery</option>
            <option value="consumable">Consumable</option>
            <option value="solar">Solar</option>
            <option value="conversion">Conversion kit</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-unit" className={labelClasses}>
            Unit
          </label>
          <input
            id="item-unit"
            type="text"
            placeholder="pcs"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-cost" className={labelClasses}>
            Unit cost (₦) <span className="text-brand-500">*</span>
          </label>
          <input
            id="item-cost"
            type="text"
            inputMode="numeric"
            placeholder="2500"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-min" className={labelClasses}>
            Low-stock alert level
          </label>
          <input
            id="item-min"
            type="number"
            min={0}
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      {!item && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-qty" className={labelClasses}>
            Opening quantity
          </label>
          <input
            id="item-qty"
            type="number"
            min={0}
            value={openingQty}
            onChange={(e) => setOpeningQty(e.target.value)}
            className={inputClasses}
          />
        </div>
      )}

      {item && (
        <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-bold text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-[#0FA53A]"
          />
          Active (can be requested)
        </label>
      )}

      {error && <span className={errorClasses}>{error}</span>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className={cn(
          "cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
          isPending
            ? "cursor-not-allowed opacity-60"
            : "transition-transform hover:scale-[1.02]",
        )}
      >
        {isPending ? "Saving…" : item ? "Save changes" : "Add to stock →"}
      </button>
    </div>
  );
};

export default ItemForm;
