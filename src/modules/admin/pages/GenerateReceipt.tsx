import { useState } from "react";
import { Link } from "react-router-dom";
import { Printer, Plus, RotateCcw, Search, TriangleAlert } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import BusForm from "../components/buses/BusForm";
import TicketCard from "../components/receipts/TicketCard";
import { useGetBuses } from "@/lib/network/api/bus.api";
import { useGetCurrentTripPrice } from "@/lib/network/api/tripPrice.api";
import { useCreateReceipt } from "@/lib/network/api/receipt.api";
import type { Bus } from "@/lib/network/types/bus.types";
import type { Receipt } from "@/lib/network/types/receipt.types";
import type { ApiErrorResponse } from "@/lib/network/types/api.types";
import { cn, fmtNaira } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

const todayString = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function GenerateReceipt() {
  const [busSearch, setBusSearch] = useState("");
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [trips, setTrips] = useState("1");
  const [checkIn, setCheckIn] = useState(true);
  const [issued, setIssued] = useState<Receipt | null>(null);
  const [dupMessage, setDupMessage] = useState<string | null>(null);
  const [busModalOpen, setBusModalOpen] = useState(false);

  const { data: priceData } = useGetCurrentTripPrice();
  const price = priceData?.data ?? null;

  const { data: busData } = useGetBuses(
    { search: busSearch, isActive: "true", pageSize: 8 },
    { enabled: busSearch.length > 0 && !selectedBus },
  );
  const busResults = busData?.data ?? [];

  const createReceipt = useCreateReceipt();

  const tripsNum = Math.max(0, parseInt(trips, 10) || 0);
  const amount = price ? String(tripsNum * Number(price.amount)) : "0";

  const issue = (allowDuplicate: boolean) => {
    if (!selectedBus || tripsNum < 1) return;
    setDupMessage(null);
    createReceipt.mutate(
      {
        busId: selectedBus._id,
        expectedTrips: tripsNum,
        checkIn,
        allowDuplicate,
      },
      {
        onSuccess: (data) => {
          setIssued(data.data ?? null);
        },
        onError: (error) => {
          if (error.response?.status === 409) {
            const data = error.response.data as ApiErrorResponse;
            setDupMessage(data.message);
          }
        },
      },
    );
  };

  const reset = () => {
    setIssued(null);
    setSelectedBus(null);
    setBusSearch("");
    setTrips("1");
    setCheckIn(true);
    setDupMessage(null);
  };

  return (
    <>
      <PageMeta title="Generate Receipt | KGR Console" />
      <PageHead
        eyebrow="RECEIPTS"
        title="Generate Receipt"
        subtitle="Issue a daily receipt. The ticket on the right is exactly what prints."
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_440px]">
        {/* form */}
        <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)] sm:p-8">
          {!price && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-solar/40 bg-[#FDF6E3] px-4 py-3.5">
              <TriangleAlert size={18} className="mt-0.5 flex-none text-solar-700" />
              <p className="m-0 text-[13px] font-semibold text-solar-700">
                No trip price is configured, so receipts cannot be issued yet.{" "}
                <Link to="/trip-price" className="underline">
                  Set the trip price first.
                </Link>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* bus picker */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gr-bus" className={labelClasses}>
                Bus <span className="text-brand-500">*</span>
              </label>
              {selectedBus ? (
                <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-4 py-3">
                  <span className="text-[16px] font-extrabold text-ink">
                    {selectedBus.number}
                    {selectedBus.driverName && (
                      <span className="ml-2 text-[13px] font-semibold text-fog">
                        {selectedBus.driverName}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBus(null);
                      setBusSearch("");
                    }}
                    className="cursor-pointer border-none bg-transparent text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-[15px] text-fog"
                  />
                  <input
                    id="gr-bus"
                    type="text"
                    placeholder="Type a bus number, e.g. A 37"
                    value={busSearch}
                    onChange={(e) => setBusSearch(e.target.value)}
                    className={cn(inputClasses, "pl-9")}
                    autoComplete="off"
                  />
                  {busSearch && busResults.length > 0 && (
                    <div className="absolute inset-x-0 top-[52px] z-20 overflow-hidden rounded-xl border border-line bg-white shadow-[0_18px_44px_rgba(13,31,21,0.15)]">
                      {busResults.map((bus) => (
                        <button
                          key={bus._id}
                          type="button"
                          onClick={() => setSelectedBus(bus)}
                          className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-4 py-3 text-left transition-colors hover:bg-haze"
                        >
                          <span className="text-[14px] font-extrabold text-ink">
                            {bus.number}
                          </span>
                          <span className="text-[12px] font-semibold text-fog">
                            {bus.driverName || ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {busSearch && busResults.length === 0 && (
                    <div className="absolute inset-x-0 top-[52px] z-20 rounded-xl border border-line bg-white px-4 py-3 text-[13px] font-semibold text-fog shadow-[0_18px_44px_rgba(13,31,21,0.15)]">
                      No active bus matches "{busSearch}".
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setBusModalOpen(true)}
                className="flex w-fit cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
              >
                <Plus size={14} strokeWidth={2.6} /> Register a new bus
              </button>
            </div>

            {/* trips */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gr-trips" className={labelClasses}>
                Expected trips <span className="text-brand-500">*</span>
              </label>
              <input
                id="gr-trips"
                type="number"
                min={1}
                max={50}
                value={trips}
                onChange={(e) => setTrips(e.target.value)}
                className={inputClasses}
              />
              {price && (
                <span className="text-[12px] font-medium text-fog">
                  {tripsNum || 0} × {fmtNaira(price.amount)} ={" "}
                  <strong className="text-ink">{fmtNaira(amount)}</strong>
                </span>
              )}
            </div>

            {/* check in */}
            <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-bold text-ink">
              <input
                type="checkbox"
                checked={checkIn}
                onChange={(e) => setCheckIn(e.target.checked)}
                className="h-4 w-4 accent-[#0FA53A]"
              />
              Check the bus in now
            </label>

            {/* duplicate confirmation */}
            {dupMessage && (
              <div className="rounded-xl border border-solar/40 bg-[#FDF6E3] px-4 py-3.5">
                <p className="m-0 text-[13px] font-semibold text-solar-700">
                  {dupMessage}. Issue another one anyway?
                </p>
                <div className="mt-2.5 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => issue(true)}
                    className="cursor-pointer rounded-lg border-none bg-solar px-4 py-2 text-[13px] font-extrabold text-forest-deep"
                  >
                    Issue anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setDupMessage(null)}
                    className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-bold text-bark"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!issued ? (
              <button
                type="button"
                disabled={
                  !selectedBus ||
                  tripsNum < 1 ||
                  !price ||
                  createReceipt.isPending
                }
                onClick={() => issue(false)}
                className={cn(
                  "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-4 text-[15px] font-extrabold text-forest-deep",
                  !selectedBus || tripsNum < 1 || !price || createReceipt.isPending
                    ? "cursor-not-allowed opacity-50"
                    : "transition-transform hover:scale-[1.02]",
                )}
              >
                {createReceipt.isPending ? "Issuing…" : "Issue receipt →"}
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-6 py-3.5 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
                >
                  <Printer size={16} /> Print ticket
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-6 py-3.5 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
                >
                  <RotateCcw size={15} /> New receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* live ticket */}
        <div className="lg:sticky lg:top-8">
          <TicketCard
            printable
            receipt={issued}
            draft={
              issued
                ? null
                : {
                    busNumber: selectedBus?.number ?? "",
                    expectedTrips: tripsNum,
                    unitPrice: price?.amount ?? "0",
                    expectedAmount: amount,
                    date: todayString(),
                  }
            }
          />
        </div>
      </div>

      <Modal
        title="Register a bus"
        open={busModalOpen}
        onClose={() => setBusModalOpen(false)}
      >
        <BusForm onDone={() => setBusModalOpen(false)} />
      </Modal>
    </>
  );
}
