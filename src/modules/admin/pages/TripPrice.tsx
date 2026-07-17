import { useState } from "react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import Skeleton from "../components/console/Skeleton";
import {
  useGetCurrentTripPrice,
  useGetTripPriceHistory,
  useSetTripPrice,
} from "@/lib/network/api/tripPrice.api";
import type { TripPriceSetter } from "@/lib/network/types/tripPrice.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { cn, fmtNaira, fmtDate } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

const setterName = (setBy: TripPriceSetter | string): string =>
  typeof setBy === "string" ? "" : `${setBy.firstName} ${setBy.lastName}`;

export default function TripPrice() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [amount, setAmount] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");
  const [page, setPage] = useState(1);

  const { data: currentData, isLoading: currentLoading } =
    useGetCurrentTripPrice();
  const { data: historyData, isLoading: historyLoading } =
    useGetTripPriceHistory({ page, pageSize: 10 });
  const setTripPrice = useSetTripPrice();

  const current = currentData?.data ?? null;
  const history = historyData?.data ?? [];
  const pagination = historyData?.pagination;

  const handleSubmit = () => {
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      setAmountError("Enter a plain amount like 7500");
      return;
    }
    setAmountError("");
    setTripPrice.mutate(
      {
        amount,
        effectiveFrom: effectiveFrom || undefined,
        note: note || undefined,
      },
      {
        onSuccess: () => {
          setAmount("");
          setEffectiveFrom("");
          setNote("");
          // the newest price sits on page 1 of the history
          setPage(1);
        },
      },
    );
  };

  return (
    <>
      <PageMeta title="Trip Price | KGR Console" />
      <PageHead
        eyebrow="CONFIGURATION"
        title="Trip Price"
        subtitle="The price every receipt is computed from. Changes never rewrite old receipts."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-6">
          {/* current price */}
          <div className="rounded-[20px] bg-forest p-7">
            <span className="flex items-center gap-2.5 text-[12px] font-extrabold tracking-[2px] text-neon">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              IN FORCE
            </span>
            {currentLoading ? (
              <>
                <Skeleton className="mt-5 h-9 w-44 bg-white/15" />
                <Skeleton className="mt-3 h-3.5 w-32 bg-white/10" />
              </>
            ) : current ? (
              <>
                <div className="mt-4 text-[42px] font-extrabold leading-none text-neon">
                  {fmtNaira(current.amount)}
                </div>
                <div className="mt-1.5 text-[14px] font-semibold text-mint-soft">
                  per trip · since {fmtDate(current.effectiveFrom)}
                </div>
                {setterName(current.setBy) && (
                  <div className="mt-3 text-[12px] font-semibold text-mint-faint">
                    Set by {setterName(current.setBy)}
                  </div>
                )}
              </>
            ) : (
              <p className="mb-0 mt-4 text-[15px] font-semibold text-mint-pale">
                No trip price configured yet. Set the first one to start issuing
                receipts.
              </p>
            )}
          </div>

          {/* set price */}
          {isAdmin ? (
            <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
              <h2 className="mb-4 mt-0 text-[17px] font-extrabold text-ink">
                Set a new price
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tp-amount" className={labelClasses}>
                    Amount (₦) <span className="text-brand-500">*</span>
                  </label>
                  <input
                    id="tp-amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="7500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputClasses}
                  />
                  {amountError && (
                    <span className={errorClasses}>{amountError}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tp-from" className={labelClasses}>
                    Effective from
                  </label>
                  <input
                    id="tp-from"
                    type="date"
                    value={effectiveFrom}
                    data-placeholder="Today"
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className={cn(inputClasses, !effectiveFrom && "date-empty")}
                  />
                  <span className="text-[12px] font-medium text-fog">
                    Leave empty to apply immediately.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tp-note" className={labelClasses}>
                    Note
                  </label>
                  <input
                    id="tp-note"
                    type="text"
                    placeholder="Why is the price changing?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <button
                  type="button"
                  disabled={setTripPrice.isPending}
                  onClick={handleSubmit}
                  className={cn(
                    "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                    setTripPrice.isPending
                      ? "cursor-not-allowed opacity-60"
                      : "transition-transform hover:scale-[1.02]",
                  )}
                >
                  {setTripPrice.isPending ? "Saving…" : "Set new price →"}
                </button>
              </div>
            </div>
          ) : (
            <p className="m-0 rounded-[14px] border border-line bg-white px-5 py-4 text-[13px] font-semibold text-fog">
              Only administrators can change the trip price.
            </p>
          )}
        </div>

        {/* history */}
        <div>
          <h2 className="mb-4 mt-0 text-[15px] font-extrabold tracking-[1px] text-fog">
            PRICE CHANGE HISTORY
          </h2>
          <div className="flex flex-col gap-3">
            {history.map((price, i) => (
              <div
                key={price._id}
                className={cn(
                  "rounded-2xl border border-line border-t-4 bg-white p-5 shadow-[0_8px_20px_rgba(13,31,21,0.04)]",
                  i === 0 && page === 1
                    ? "border-t-brand-500"
                    : "border-t-solar",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[22px] font-extrabold text-ink">
                    {fmtNaira(price.amount)}
                    <span className="text-[13px] font-semibold text-fog">
                      {" "}
                      / trip
                    </span>
                  </span>
                  <span className="text-[13px] font-semibold text-fog">
                    effective {fmtDate(price.effectiveFrom)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-semibold text-fog">
                  {setterName(price.setBy) && (
                    <span>Set by {setterName(price.setBy)}</span>
                  )}
                  {price.note && (
                    <span className="text-sage">"{price.note}"</span>
                  )}
                </div>
              </div>
            ))}

            {historyLoading && (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <p className="m-0 rounded-2xl border border-line bg-white px-5 py-8 text-center text-[14px] font-semibold text-fog">
                No price changes recorded yet.
              </p>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-end gap-2">
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
