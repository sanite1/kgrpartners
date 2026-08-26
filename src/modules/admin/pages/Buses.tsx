import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import Modal from "../components/console/Modal";
import BusForm from "../components/buses/BusForm";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import { useGetBusPerformance } from "@/lib/network/api/bus.api";
import type {
  Bus,
  PerformanceBand,
} from "@/lib/network/types/bus.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../permissions";
import { cn, fmtNaira } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

// today in Lagos, matching the backend's business day
const todayLagos = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(
    new Date(),
  );

type QuickRange = "today" | "week" | "month" | "all" | "custom";

const quickRange = (pick: QuickRange): { from?: string; to?: string } => {
  const today = todayLagos();
  if (pick === "today") return { from: today, to: today };
  if (pick === "week") {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (pick === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
  return {};
};

const QUICK_OPTIONS: { id: QuickRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

type BandFilter = PerformanceBand | "all";

const BAND_FILTERS: { id: BandFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "good", label: "Good (above 3)" },
  { id: "average", label: "Average (3)" },
  { id: "under", label: "Under 3" },
  { id: "idle", label: "Didn't work" },
];

const BAND_META: Record<
  PerformanceBand,
  { label: string; badge: string; row: string }
> = {
  good: { label: "Good", badge: "bg-brand-50 text-brand-600", row: "" },
  average: {
    label: "Average",
    badge: "bg-[#FDF6E3] text-solar-700",
    row: "",
  },
  under: {
    label: "Under 3",
    badge: "bg-red-50 text-red-600",
    row: "bg-red-50/50",
  },
  idle: {
    label: "No trips",
    badge: "bg-[#FDF6E3] text-solar-700",
    row: "bg-[#FDF6E3]/50",
  },
};

type ActiveFilter = "all" | "true" | "false";

export default function Buses() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit = canApprove(user?.role);

  const [quick, setQuick] = useState<QuickRange>("today");
  const [from, setFrom] = useState(quickRange("today").from ?? "");
  const [to, setTo] = useState(quickRange("today").to ?? "");
  const [band, setBand] = useState<BandFilter>("all");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [modal, setModal] = useState<null | { bus?: Bus }>(null);

  const { data, isLoading } = useGetBusPerformance({
    page,
    pageSize,
    search: search || undefined,
    isActive: activeFilter === "all" ? undefined : activeFilter,
    from: from || undefined,
    to: to || undefined,
    band,
  });
  const payload = data?.data;
  const buses = payload?.buses ?? [];
  const summary = payload?.summary;
  const minTrips = summary?.minTripsPerDay ?? 3;

  const pickQuick = (value: QuickRange) => {
    const range = quickRange(value);
    setQuick(value);
    setFrom(range.from ?? "");
    setTo(range.to ?? "");
    setPage(1);
  };

  const periodLabel =
    QUICK_OPTIONS.find((o) => o.id === quick)?.label.toUpperCase() ?? "PERIOD";

  return (
    <>
      <PageMeta title="Buses | KGR Console" />
      <PageHead
        eyebrow="REGISTRY"
        title="Buses"
        subtitle="Every vehicle in the fleet, judged against the daily trip minimum."
        actions={
          <button
            type="button"
            onClick={() => setModal({})}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={2.6} /> Register bus
          </button>
        }
      />

      {/* fleet totals for the chosen period */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          <span className="block text-[24px] font-extrabold leading-none text-neon">
            {summary?.fleetTrips ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            FLEET TRIPS · {periodLabel}
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-ink">
            {summary?.busesWorked ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            BUSES WORKED
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-brand-600">
            {summary?.good ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            GOOD · ABOVE {minTrips}
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-solar-700">
            {summary?.average ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            ON AVERAGE · {minTrips}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-4",
            (summary?.under ?? 0) > 0
              ? "border-red-200 bg-red-50"
              : "border-line bg-white",
          )}
        >
          <span
            className={cn(
              "block text-[24px] font-extrabold leading-none",
              (summary?.under ?? 0) > 0 ? "text-red-600" : "text-ink",
            )}
          >
            {summary?.under ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            UNDER {minTrips} TRIPS
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-4",
            (summary?.idle ?? 0) > 0
              ? "border-solar/40 bg-[#FDF6E3]"
              : "border-line bg-white",
          )}
        >
          <span
            className={cn(
              "block text-[24px] font-extrabold leading-none",
              (summary?.idle ?? 0) > 0 ? "text-solar-700" : "text-ink",
            )}
          >
            {summary?.idle ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            DIDN'T WORK
          </span>
        </div>
      </div>

      {/* which days count */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {QUICK_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => pickQuick(option.id)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                quick === option.id
                  ? "cta-gradient border-transparent text-forest-deep"
                  : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setQuick("custom");
              setPage(1);
            }}
            className={cn(inputClasses, "w-[150px] py-2 sm:text-[13.5px]")}
          />
          <span className="text-[12px] font-extrabold text-fog">TO</span>
          <input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setQuick("custom");
              setPage(1);
            }}
            className={cn(inputClasses, "w-[150px] py-2 sm:text-[13.5px]")}
          />
        </div>
      </div>

      {/* performance bands, activity and search */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {BAND_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setBand(f.id);
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                band === f.id
                  ? "cta-gradient border-transparent text-forest-deep"
                  : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Active filter"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as ActiveFilter);
              setPage(1);
            }}
            className={cn(inputClasses, "w-auto py-2.5 sm:text-[13.5px]")}
          >
            <option value="all">All buses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="relative sm:w-[220px]">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
            />
            <input
              type="text"
              placeholder="Search number or driver"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
            />
          </div>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {[
                  "BUS",
                  "DRIVER",
                  "TRIPS",
                  "DAYS WORKED",
                  "AVG / DAY",
                  "PERFORMANCE",
                  ...(canEdit ? ["MAINTENANCE"] : []),
                  "STATUS",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                  >
                    {h}
                  </th>
                ))}
                {canEdit && <th className="px-4 py-3.5" />}
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => {
                const meta = BAND_META[bus.band];
                return (
                  <tr
                    key={bus._id}
                    onClick={() => navigate(`/buses/${bus._id}`)}
                    className={cn(
                      "cursor-pointer border-b border-line transition-colors last:border-b-0",
                      meta.row || "hover:bg-haze",
                      meta.row && "hover:brightness-[0.98]",
                    )}
                  >
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-2.5 text-[15px] font-extrabold text-ink">
                        <BoltMark width={10} height={13} fill="#0FA53A" />
                        {bus.number}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[14px] font-semibold text-bark">
                      {bus.driverName || (
                        <span className="text-fog">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[14px] font-extrabold tabular-nums text-ink">
                      {bus.trips}
                    </td>
                    <td className="px-4 py-4 text-[13.5px] font-bold tabular-nums text-bark">
                      {bus.daysWorked}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-4 text-[14px] font-extrabold tabular-nums",
                        bus.band === "under"
                          ? "text-red-600"
                          : bus.band === "good"
                            ? "text-brand-600"
                            : bus.band === "average"
                              ? "text-solar-700"
                              : "text-fog",
                      )}
                    >
                      {bus.daysWorked > 0 ? bus.avgTripsPerDay : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                          meta.badge,
                        )}
                      >
                        {meta.label}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-bold tabular-nums text-bark">
                            {fmtNaira(bus.maintenance?.cost ?? 0)}
                          </span>
                          {(bus.maintenance?.openRepairs ?? 0) > 0 && (
                            <span className="w-fit rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-extrabold text-red-600">
                              {bus.maintenance?.openRepairs} open repair
                              {(bus.maintenance?.openRepairs ?? 0) === 1
                                ? ""
                                : "s"}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <StatusPill
                        tone={bus.isActive ? "success" : "muted"}
                        label={bus.isActive ? "Active" : "Inactive"}
                      />
                    </td>
                    {canEdit && (
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          title="Edit bus"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ bus });
                          }}
                          className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && buses.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {search || activeFilter !== "all" || band !== "all"
                ? "No buses match this filter."
                : "No buses registered yet. Add the first one."}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center px-6 py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        <Pagination
          pagination={payload?.pagination}
          page={page}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          className="border-t border-line px-5 pb-4"
        />
      </div>

      <Modal
        title={modal?.bus ? `Edit ${modal.bus.number}` : "Register a bus"}
        open={modal !== null}
        onClose={() => setModal(null)}
      >
        {modal && (
          <BusForm
            bus={modal.bus}
            onDone={() => {
              const wasCreate = !modal.bus;
              setModal(null);
              // reveal a newly registered bus even if a filter or search
              // was hiding it
              if (wasCreate) {
                setActiveFilter("all");
                setBand("all");
                setSearch("");
                setPage(1);
              }
            }}
          />
        )}
      </Modal>
    </>
  );
}
