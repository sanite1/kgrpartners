import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import { useGetBusTrips } from "@/lib/network/api/bus.api";
import { cn, fmtNaira, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

// today in Lagos, YYYY-MM-DD, matching the backend's business day
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

// One bus's whole trip story. Every generated receipt for the bus IS a
// trip record, so everything here comes straight from receipts.
export default function BusDetail() {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const [quick, setQuick] = useState<QuickRange>("month");
  const [from, setFrom] = useState(quickRange("month").from ?? "");
  const [to, setTo] = useState(quickRange("month").to ?? "");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading } = useGetBusTrips(id, {
    page,
    pageSize,
    from: from || undefined,
    to: to || undefined,
  });
  const payload = data?.data;
  const bus = payload?.bus;
  const summary = payload?.summary;
  const receipts = payload?.receipts ?? [];

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
      <PageMeta title={`${bus?.number ?? "Bus"} | KGR Console`} />
      <PageHead
        eyebrow="FLEET"
        title={bus?.number ?? "Bus"}
        subtitle={
          bus
            ? `${bus.driverName ? `Driver: ${bus.driverName}. ` : ""}Every trip below is a generated receipt for this bus.`
            : "Loading the bus record."
        }
        actions={
          <button
            type="button"
            onClick={() => navigate("/buses")}
            className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
          >
            <ArrowLeft size={15} /> All buses
          </button>
        }
      />

      {/* lifetime and period totals, straight from receipts */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-ink">
            {summary?.today.trips ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            TRIPS TODAY
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-ink">
            {summary?.thisMonth.trips ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            TRIPS THIS MONTH
          </span>
        </div>
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          <span className="block text-[24px] font-extrabold leading-none text-neon">
            {summary?.allTime.trips ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            TRIPS ALL TIME
          </span>
        </div>
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          <span className="block text-[24px] font-extrabold leading-none text-neon">
            {summary?.range.trips ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            TRIPS · {periodLabel}
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[17px] font-extrabold leading-none text-ink">
            {fmtNaira(summary?.range.expectedAmount)}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            EXPECTED · {periodLabel}
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[17px] font-extrabold leading-none text-brand-600">
            {fmtNaira(summary?.range.collectedAmount)}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            COLLECTED · {periodLabel}
          </span>
        </div>
      </div>

      {/* which days */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

      {/* the trips, one receipt per row */}
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {[
                  "DATE",
                  "RECEIPT NO",
                  "TRIPS",
                  "BATTERY",
                  "AMOUNT",
                  "STATUS",
                  "ISSUED BY",
                  "TIME",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => {
                const by = r.issuedBy as {
                  firstName?: string;
                  lastName?: string;
                };
                return (
                  <tr
                    key={r._id}
                    className="border-b border-line transition-colors last:border-b-0 hover:bg-haze"
                  >
                    <td className="px-4 py-3.5 text-[13.5px] font-extrabold text-ink">
                      {fmtDate(r.date)}
                    </td>
                    <td className="px-4 py-3.5 text-[13.5px] font-bold tabular-nums text-bark">
                      #{r.billId}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] font-extrabold tabular-nums text-ink">
                      {r.expectedTrips}
                    </td>
                    <td className="px-4 py-3.5 text-[13.5px] font-semibold text-bark">
                      {r.batteryName || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-[13.5px] font-bold text-bark">
                      {fmtNaira(r.expectedAmount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill
                        tone={r.status === "paid" ? "success" : "warn"}
                        label={r.status === "paid" ? "Paid" : "Awaiting"}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-fog">
                      {by?.firstName
                        ? `${by.firstName} ${by.lastName ?? ""}`.trim()
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold tabular-nums text-fog">
                      {fmtTime(r.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && receipts.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              No trips in this period.
            </p>
            <p className="m-0 text-[13px] font-semibold text-fog">
              Trips appear here when a receipt is generated for this bus.
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
    </>
  );
}
