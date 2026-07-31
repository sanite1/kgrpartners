import { useState } from "react";
import { ArrowLeftRight, Plus, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import SearchSelect from "../components/console/SearchSelect";
import Modal from "../components/console/Modal";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import { useGetBuses } from "@/lib/network/api/bus.api";
import { useGetBatteries } from "@/lib/network/api/battery.api";
import { useGetSwaps, useCreateSwap } from "@/lib/network/api/batterySwap.api";
import type { Bus } from "@/lib/network/types/bus.types";
import type { Battery, BatteryStatus } from "@/lib/network/types/battery.types";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

const STATUS_LABEL: Record<BatteryStatus, string> = {
  active: "Active",
  faulty: "Faulty",
  charging: "Charging",
  fully_charged: "Fully charged",
  not_charged: "Not charged",
  not_in_use: "Not in use",
};

// what the picker shows under each pack: its state, and a loud warning
// when it is already on a bus
const batterySubtitle = (battery: Battery): string => {
  const state = STATUS_LABEL[battery.status] ?? battery.status;
  return battery.busNumber ? `${state} · on ${battery.busNumber}` : state;
};

interface PickerProps {
  id: string;
  placeholder: string;
  selected: Battery | null;
  onSelect: (battery: Battery | null) => void;
}

// searchable battery picker with a locked chip once chosen
const BatteryPicker = ({
  id,
  placeholder,
  selected,
  onSelect,
}: PickerProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data } = useGetBatteries(
    { search, isActive: "true", pageSize: 8 },
    { enabled: open && !selected },
  );
  const results = data?.data ?? [];

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-4 py-3">
        <span className="text-[15px] font-extrabold text-ink">
          {selected.code}
          <span className="ml-2 text-[12.5px] font-semibold text-fog">
            {batterySubtitle(selected)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setSearch("");
          }}
          className="cursor-pointer border-none bg-transparent text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <SearchSelect
      id={id}
      placeholder={placeholder}
      icon
      search={search}
      onSearch={setSearch}
      onOpenChange={setOpen}
      options={results.map((battery) => ({
        key: battery._id,
        title: battery.code,
        subtitle: batterySubtitle(battery),
      }))}
      onPick={(key) => {
        const battery = results.find((b) => b._id === key);
        if (battery) onSelect(battery);
      }}
      emptyText="No registered battery matches."
    />
  );
};

export default function Swaps() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // record modal
  const [open, setOpen] = useState(false);
  const [busSearch, setBusSearch] = useState("");
  const [busOpen, setBusOpen] = useState(false);
  const [bus, setBus] = useState<Bus | null>(null);
  const [initial, setInitial] = useState<Battery | null>(null);
  const [supplied, setSupplied] = useState<Battery | null>(null);
  const [trips, setTrips] = useState("0");
  const [note, setNote] = useState("");

  const { data, isLoading } = useGetSwaps({
    page,
    pageSize,
    search: search || undefined,
  });
  const swaps = data?.data ?? [];

  const { data: busData } = useGetBuses(
    { search: busSearch, isActive: "true", pageSize: 8 },
    { enabled: busOpen && !bus },
  );
  const busResults = busData?.data ?? [];

  // what the fleet believes is on the chosen bus; shown as a hint only,
  // the user always picks the battery themselves
  const { data: onBusData } = useGetBatteries(
    { busId: bus?._id, pageSize: 2 },
    { enabled: !!bus },
  );
  const currentOnBus = bus ? (onBusData?.data?.[0] ?? null) : null;

  const createSwap = useCreateSwap();

  const tripsNum = parseFloat(trips) || 0;
  const validTrips = tripsNum >= 0 && (tripsNum * 2) % 1 === 0;
  const canSave = !!bus && !!initial && !!supplied && validTrips;

  const openModal = () => {
    setBus(null);
    setBusSearch("");
    setInitial(null);
    setSupplied(null);
    setTrips("0");
    setNote("");
    setOpen(true);
  };

  const save = () => {
    if (!canSave || !bus || !initial || !supplied) return;
    createSwap.mutate(
      {
        busId: bus._id,
        initialBatteryId: initial._id,
        suppliedBatteryId: supplied._id,
        tripsAdded: tripsNum,
        note: note || undefined,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <PageMeta title="Swaps | KGR Console" />
      <PageHead
        eyebrow="FLEET POWER"
        title="Battery Swaps"
        subtitle="Which pack came off, which went on, and the trips it added."
        actions={
          <button
            type="button"
            onClick={openModal}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> Record swap
          </button>
        }
      />

      <div className="mb-4 flex justify-end">
        <div className="relative w-full sm:w-[240px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Bus or battery"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      {swaps.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-haze">
                  {[
                    "DATE",
                    "SWAP",
                    "BUS",
                    "BATTERY OFF",
                    "BATTERY ON",
                    "TRIPS ADDED",
                    "BY",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {swaps.map((swap) => (
                  <tr
                    key={swap._id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                      {fmtDate(swap.date)} · {fmtTime(swap.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                      #{swap.swapId}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                      {swap.busNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold text-bark">
                      {swap.initialBatteryCode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-brand-600">
                        <ArrowLeftRight size={13} />
                        {swap.suppliedBatteryCode}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-ink">
                      {swap.tripsAdded || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                      {swap.byName || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}

      {!isLoading && swaps.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            No swaps recorded yet.
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

      {/* record modal */}
      <Modal title="Record swap" open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sw-bus" className={labelClasses}>
              Bus <span className="text-brand-500">*</span>
            </label>
            {bus ? (
              <div className="flex items-center justify-between rounded-[10px] border border-brand-200 bg-haze px-4 py-3">
                <span className="text-[15px] font-extrabold text-ink">
                  {bus.number}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBus(null);
                    setBusSearch("");
                    setInitial(null);
                  }}
                  className="cursor-pointer border-none bg-transparent text-[13px] font-extrabold text-brand-600 hover:text-brand-500"
                >
                  Change
                </button>
              </div>
            ) : (
              <SearchSelect
                id="sw-bus"
                placeholder="Type a bus number, e.g. A 37"
                icon
                search={busSearch}
                onSearch={setBusSearch}
                onOpenChange={setBusOpen}
                options={busResults.map((b) => ({
                  key: b._id,
                  title: b.number,
                  subtitle: b.driverName || "",
                }))}
                onPick={(key) => {
                  const picked = busResults.find((b) => b._id === key);
                  if (picked) setBus(picked);
                }}
                emptyText="No active bus matches."
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sw-initial" className={labelClasses}>
              Initial battery (coming off){" "}
              <span className="text-brand-500">*</span>
            </label>
            <BatteryPicker
              id="sw-initial"
              placeholder="The pack currently on the bus"
              selected={initial}
              onSelect={setInitial}
            />
            {currentOnBus && (
              <span
                className={cn(
                  "text-[12px] font-bold",
                  initial && initial._id !== currentOnBus._id
                    ? "text-solar-700"
                    : "text-fog",
                )}
              >
                {initial && initial._id !== currentOnBus._id
                  ? `Note: the system has ${currentOnBus.code} on ${bus?.number}, not ${initial.code}.`
                  : `The system has ${currentOnBus.code} on ${bus?.number}. Pick the pack you can actually see.`}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sw-supplied" className={labelClasses}>
              Supplied battery (going on){" "}
              <span className="text-brand-500">*</span>
            </label>
            <BatteryPicker
              id="sw-supplied"
              placeholder="The fresh pack"
              selected={supplied}
              onSelect={setSupplied}
            />
            {supplied &&
              (supplied.status === "faulty" ||
                supplied.status === "not_in_use" ||
                !!supplied.bus) && (
                <span className="text-[12px] font-bold text-red-600">
                  {supplied.bus
                    ? `${supplied.code} is recorded on ${supplied.busNumber}; this will be rejected.`
                    : `${supplied.code} is ${STATUS_LABEL[supplied.status].toLowerCase()}; this will be rejected.`}
                </span>
              )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sw-trips" className={labelClasses}>
                Trips added <span className="text-brand-500">*</span>
              </label>
              <input
                id="sw-trips"
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={trips}
                onChange={(e) => setTrips(e.target.value)}
                className={inputClasses}
              />
              {trips.trim() !== "" && !validTrips && (
                <span className="text-[12px] font-bold text-red-600">
                  Trips go in halves (0, 0.5, 1, 1.5…)
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sw-note" className={labelClasses}>
                Note
              </label>
              <input
                id="sw-note"
                type="text"
                placeholder="Optional"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!canSave || createSwap.isPending}
            onClick={save}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createSwap.isPending ? "Saving…" : "Record swap →"}
          </button>
        </div>
      </Modal>
    </>
  );
}
