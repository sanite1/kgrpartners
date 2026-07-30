import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import { useCreateGatePass } from "@/lib/network/api/gatePass.api";
import { cn } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

interface ItemRow {
  description: string;
  quantity: string;
  purpose: string;
  location: string;
}

const emptyItem = (): ItemRow => ({
  description: "",
  quantity: "1",
  purpose: "",
  location: "",
});

const cellInput =
  "w-full rounded-lg border border-line bg-white px-2.5 py-2 text-base font-bold text-bark transition-colors focus:border-brand-500 focus:outline-none sm:text-[13px]";

// The paper "Exit and Return Form" as a page: header details, numbered
// item rows, then straight to management for approval.
export default function GatePassNewPage() {
  const navigate = useNavigate();

  const [department, setDepartment] = useState("");
  const [exitAt, setExitAt] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [error, setError] = useState("");

  const createPass = useCreateGatePass();

  const setItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)),
    );

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (i: number) =>
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i),
    );

  // "2026-07-24T18:15" reads better as "24/07/2026, 18:15" on the pass
  const formatExit = (raw: string): string => {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const submit = () => {
    if (!department) {
      setError("Pick your department");
      return;
    }
    if (!exitAt) {
      setError("Pick the planned date and time of exit");
      return;
    }
    const filled = items.filter((item) => item.description.trim());
    if (filled.length === 0) {
      setError("Add at least one item");
      return;
    }
    const badQty = filled.findIndex(
      (item) => !(parseInt(item.quantity, 10) >= 1),
    );
    if (badQty !== -1) {
      setError(`Item ${badQty + 1}: quantity must be at least 1`);
      return;
    }
    setError("");
    createPass.mutate(
      {
        department,
        exitAt: formatExit(exitAt),
        items: filled.map((item) => ({
          description: item.description.trim(),
          quantity: parseInt(item.quantity, 10),
          purpose: item.purpose.trim() || undefined,
          location: item.location.trim() || undefined,
        })),
      },
      { onSuccess: () => navigate("/gate-pass") },
    );
  };

  return (
    <>
      <PageMeta title="New Gate Pass | KGR Console" />
      <PageHead
        eyebrow="EXIT AND RETURN"
        title="New Gate Pass"
        subtitle="List what is leaving company grounds. Management approves, then security releases."
        actions={
          <button
            type="button"
            onClick={() => navigate("/gate-pass")}
            className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
          >
            <ArrowLeft size={15} /> Back
          </button>
        }
      />

      <div className="mx-auto max-w-[860px] rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)] sm:p-8">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gp-dept" className={labelClasses}>
                Department <span className="text-brand-500">*</span>
              </label>
              <select
                id="gp-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputClasses}
              >
                <option value="">Select department</option>
                <option value="Workshop">Workshop</option>
                <option value="Main Yard">Main Yard</option>
                <option value="Muhd House">Muhd House</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gp-exit" className={labelClasses}>
                Date and time of exit <span className="text-brand-500">*</span>
              </label>
              <input
                id="gp-exit"
                type="datetime-local"
                value={exitAt}
                onChange={(e) => setExitAt(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className={labelClasses}>Item details</span>

            {items.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-line bg-haze/60 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-[12px] font-extrabold tabular-nums text-fog">
                    {i + 1}
                  </span>
                  <input
                    aria-label={`Item ${i + 1} description`}
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      setItem(i, { description: e.target.value })
                    }
                    className={cn(cellInput, "flex-1")}
                  />
                  <button
                    type="button"
                    aria-label={`Remove item ${i + 1}`}
                    disabled={items.length === 1}
                    onClick={() => removeItem(i)}
                    className="flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                      QUANTITY
                    </span>
                    <input
                      aria-label={`Item ${i + 1} quantity`}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => setItem(i, { quantity: e.target.value })}
                      className={cellInput}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                      PURPOSE OF EXIT
                    </span>
                    <input
                      aria-label={`Item ${i + 1} purpose`}
                      type="text"
                      placeholder="Repair, delivery..."
                      value={item.purpose}
                      onChange={(e) => setItem(i, { purpose: e.target.value })}
                      className={cellInput}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                      LOCATION
                    </span>
                    <input
                      aria-label={`Item ${i + 1} location`}
                      type="text"
                      placeholder="Where it is going"
                      value={item.location}
                      onChange={(e) => setItem(i, { location: e.target.value })}
                      className={cellInput}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <Plus size={14} /> Add item
            </button>
          </div>

          {error && <span className={errorClasses}>{error}</span>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={createPass.isPending}
              onClick={submit}
              className={cn(
                "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                createPass.isPending
                  ? "cursor-not-allowed opacity-60"
                  : "transition-transform hover:scale-[1.02]",
              )}
            >
              {createPass.isPending ? "Sending…" : "Send for approval →"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/gate-pass")}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-6 py-3.5 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
