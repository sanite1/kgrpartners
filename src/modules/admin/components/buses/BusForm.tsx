import { useState } from "react";
import { useCreateBus, useUpdateBus } from "@/lib/network/api/bus.api";
import type { Bus } from "@/lib/network/types/bus.types";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../console/form";
import { cn } from "@/lib/utils";

interface BusFormProps {
  bus?: Bus; // present = edit mode
  onDone: () => void;
}

const BusForm = ({ bus, onDone }: BusFormProps) => {
  const [number, setNumber] = useState(bus?.number ?? "");
  const [driverName, setDriverName] = useState(bus?.driverName ?? "");
  const [driverPhone, setDriverPhone] = useState(bus?.driverPhone ?? "");
  const [notes, setNotes] = useState(bus?.notes ?? "");
  const [isActive, setIsActive] = useState(bus?.isActive ?? true);
  const [numberError, setNumberError] = useState("");

  const createBus = useCreateBus();
  const updateBus = useUpdateBus();
  const isPending = createBus.isPending || updateBus.isPending;

  const handleSubmit = () => {
    if (!number.trim()) {
      setNumberError("Enter the bus number, e.g. A 37");
      return;
    }
    setNumberError("");
    const base = { number: number.trim(), driverName, driverPhone, notes };
    if (bus) {
      updateBus.mutate(
        { id: bus._id, payload: { ...base, isActive } },
        { onSuccess: onDone },
      );
    } else {
      createBus.mutate(base, { onSuccess: onDone });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bus-number" className={labelClasses}>
          Bus number <span className="text-brand-500">*</span>
        </label>
        <input
          id="bus-number"
          type="text"
          placeholder="A 37"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className={inputClasses}
        />
        {numberError && <span className={errorClasses}>{numberError}</span>}
        <span className="text-[12px] font-medium text-fog">
          Any format works; it is stored as "A 37".
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bus-driver" className={labelClasses}>
            Driver name
          </label>
          <input
            id="bus-driver"
            type="text"
            placeholder="Optional"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bus-phone" className={labelClasses}>
            Driver phone
          </label>
          <input
            id="bus-phone"
            type="tel"
            placeholder="Optional"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bus-notes" className={labelClasses}>
          Notes
        </label>
        <textarea
          id="bus-notes"
          rows={3}
          placeholder="Anything worth remembering about this bus"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={cn(inputClasses, "resize-y")}
        />
      </div>

      {bus && (
        <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-bold text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-[#0FA53A]"
          />
          Active (can receive receipts)
        </label>
      )}

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
        {isPending
          ? "Saving…"
          : bus
            ? "Save changes"
            : "Register bus →"}
      </button>
    </div>
  );
};

export default BusForm;
