import { Link } from "react-router-dom";
import { TicketPlus } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import Skeleton from "../components/console/Skeleton";
import {
  useGetReceiptSummary,
  useGetOutstandingSummary,
} from "@/lib/network/api/receipt.api";
import { useGetBuses } from "@/lib/network/api/bus.api";
import { useGetItems } from "@/lib/network/api/inventory.api";
import { useGetBatterySummary } from "@/lib/network/api/battery.api";
import { useGetRepairJobs } from "@/lib/network/api/repair.api";
import { useGetPartRequests } from "@/lib/network/api/partRequest.api";
import type { ReceiptSummarySeriesPoint } from "@/lib/network/types/receipt.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove, canIssue } from "../permissions";
import { cn, fmtNaira } from "@/lib/utils";

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-NG", {
    weekday: "short",
  });

// One white stat cell with a skeleton while its own query loads.
const StatCell = ({
  label,
  value,
  loading,
  warn,
  to,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
  warn?: boolean;
  to?: string;
}) => {
  const inner = (
    <>
      <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-7 w-14" />
      ) : (
        <span
          className={cn(
            "text-[26px] font-extrabold leading-none",
            warn && Number(value) > 0 ? "text-solar-700" : "text-ink",
          )}
        >
          {value}
        </span>
      )}
    </>
  );
  const cls =
    "flex h-[112px] flex-col justify-between rounded-[20px] border border-line bg-white p-5";
  return to ? (
    <Link
      to={to}
      className={cn(cls, "transition-colors hover:border-brand-500")}
    >
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
};

// 7-day bars. Personal mode drops the "expected" bar (a cashier has no
// personal expected figure) and shows collections only.
const TrendChart = ({
  series,
  loading,
  personal,
}: {
  series: ReceiptSummarySeriesPoint[];
  loading: boolean;
  personal?: boolean;
}) => {
  const max = Math.max(
    1,
    ...series.map((s) =>
      Math.max(Number(s.expectedAmount), Number(s.collectedAmount)),
    ),
  );
  return (
    <div className="mt-6 rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-extrabold tracking-[1.5px] text-fog">
          {personal
            ? "LAST 7 DAYS · MY COLLECTIONS"
            : "LAST 7 DAYS · EXPECTED VS COLLECTED"}
        </span>
        {!personal && (
          <span className="flex items-center gap-4 text-[11px] font-bold text-fog">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-card-line" /> expected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="cta-gradient h-2.5 w-2.5 rounded-sm" /> collected
            </span>
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex h-[160px] items-end justify-between gap-2 sm:gap-4">
          {[55, 80, 40, 95, 65, 30, 75].map((height, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-[120px] w-full items-end justify-center">
                <span
                  className="w-[80%] max-w-[56px] animate-pulse rounded-t-md bg-mist"
                  style={{ height: `${height}%` }}
                />
              </div>
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[160px] items-end justify-between gap-2 sm:gap-4">
          {series.map((point) => {
            const expectedPct = Math.round(
              (Number(point.expectedAmount) / max) * 100,
            );
            const collectedPct = Math.round(
              (Number(point.collectedAmount) / max) * 100,
            );
            return (
              <div
                key={point.date}
                className="flex flex-1 flex-col items-center gap-2"
                title={`${point.date}: collected ${fmtNaira(point.collectedAmount)}`}
              >
                <div className="flex h-[120px] w-full items-end justify-center gap-1">
                  {!personal && (
                    <div
                      className="w-[38%] max-w-[26px] rounded-t-md bg-card-line"
                      style={{ height: `${Math.max(2, expectedPct)}%` }}
                    />
                  )}
                  <div
                    className={cn(
                      "cta-gradient rounded-t-md",
                      personal
                        ? "w-[46%] max-w-[34px]"
                        : "w-[38%] max-w-[26px]",
                    )}
                    style={{ height: `${Math.max(2, collectedPct)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-fog">
                  {dayLabel(point.date)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isManager = canApprove(role); // admin + manager: global view
  const isCashier = role === "cashier";
  const isStore = role === "storekeeper";
  const showMoney = isManager || isCashier;
  const showOps = isManager || isStore;

  const { data, isLoading: summaryLoading } = useGetReceiptSummary(undefined, {
    enabled: showMoney,
  });
  const summary = data?.data;

  const { data: outstandingData, isLoading: outstandingLoading } =
    useGetOutstandingSummary({ enabled: isManager });
  const outstanding = outstandingData?.data;

  const { data: busesData, isLoading: busesLoading } = useGetBuses(
    { isActive: "true", pageSize: 1 },
    { enabled: isManager },
  );

  const { data: lowStockData, isLoading: lowStockLoading } = useGetItems(
    { lowStock: "true", isActive: "true", pageSize: 1 },
    { enabled: showOps },
  );
  const { data: batterySummaryData, isLoading: batteriesLoading } =
    useGetBatterySummary({ enabled: showOps });
  const { data: openRepairsData, isLoading: repairsLoading } = useGetRepairJobs(
    { status: "open", pageSize: 1 },
    { enabled: showOps },
  );
  const { data: pendingRequestsData, isLoading: requestsLoading } =
    useGetPartRequests(
      { status: "pending", pageSize: 1 },
      { enabled: isManager || isStore },
    );

  const batteryCounts = batterySummaryData?.data?.counts;
  const series = summary?.series ?? [];

  const opsCells = (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCell
        label="PENDING REQUESTS"
        value={pendingRequestsData?.pagination?.totalItems ?? 0}
        loading={requestsLoading}
        warn
        to="/requests"
      />
      <StatCell
        label="LOW STOCK ITEMS"
        value={lowStockData?.pagination?.totalItems ?? 0}
        loading={lowStockLoading}
        warn
        to="/inventory"
      />
      <StatCell
        label="OPEN REPAIRS"
        value={openRepairsData?.pagination?.totalItems ?? 0}
        loading={repairsLoading}
        to="/repairs"
      />
      <StatCell
        label="BATTERIES ON BUSES"
        value={batterySummaryData?.data?.onBus ?? 0}
        loading={batteriesLoading}
        to="/batteries"
      />
    </div>
  );

  const subtitle = isManager
    ? "The whole yard at a glance. Daily Account has today's ledger."
    : isCashier
      ? "Your day so far. Only your own collections."
      : isStore
        ? "The store and workshop at a glance."
        : "Your workspace. Raise a part request or browse inventory.";

  return (
    <>
      <PageMeta title="Dashboard | KGR Console" />
      <PageHead
        eyebrow="OVERVIEW"
        title={`Welcome back, ${user?.firstName ?? ""}`}
        subtitle={subtitle}
        actions={
          canIssue(role) ? (
            <Link
              to="/generate"
              className="cta-gradient flex items-center gap-2 rounded-[10px] px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02] hover:text-forest-deep"
            >
              <TicketPlus size={16} strokeWidth={2.4} /> Generate receipt
            </Link>
          ) : undefined
        }
      />

      {/* MANAGER / ADMIN: the whole yard */}
      {isManager && (
        <>
          <div className="grid auto-rows-[124px] grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 flex flex-col justify-between rounded-[20px] bg-forest p-5">
              <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
                </span>
                COLLECTED THIS MONTH
              </span>
              {summaryLoading ? (
                <Skeleton className="h-8 w-44 bg-white/15" />
              ) : (
                <span className="text-[32px] font-extrabold leading-none text-neon">
                  {fmtNaira(summary?.monthCollected)}
                </span>
              )}
            </div>

            <div className="flex flex-col justify-between rounded-[20px] bg-solar p-5">
              <span className="text-[11px] font-extrabold tracking-[1.5px] text-forest-deep/70">
                TOTAL OUTSTANDING
              </span>
              {outstandingLoading ? (
                <Skeleton className="h-6 w-28 bg-forest-deep/15" />
              ) : (
                <span className="text-[24px] font-extrabold leading-none text-forest-deep">
                  {fmtNaira(outstanding?.totalAmount)}
                </span>
              )}
            </div>

            <div className="flex flex-col justify-between rounded-[20px] border border-line bg-white p-5">
              <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
                COLLECTED TODAY
              </span>
              {summaryLoading ? (
                <Skeleton className="h-6 w-28" />
              ) : (
                <span className="text-[24px] font-extrabold leading-none text-ink">
                  {fmtNaira(summary?.collectedAmount)}
                </span>
              )}
            </div>

            <StatCell
              label="RECEIPTS THIS MONTH"
              value={summary?.monthIssuedCount ?? 0}
              loading={summaryLoading}
            />
            <StatCell
              label="UNPAID RECEIPTS"
              value={outstanding?.count ?? 0}
              loading={outstandingLoading}
              warn
            />
            <StatCell
              label="ACTIVE BUSES"
              value={busesData?.pagination?.totalItems ?? 0}
              loading={busesLoading}
            />
            <StatCell
              label="BATTERY FLEET"
              value={batterySummaryData?.data?.total ?? 0}
              loading={batteriesLoading}
            />
          </div>

          {/* today's work: who went out and how many trips */}
          <div className="mt-4 grid auto-rows-[124px] grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCell
              label="BUSES WORKING TODAY"
              value={summary?.busesWorkingToday ?? 0}
              loading={summaryLoading}
            />
            <StatCell
              label="BUSES IDLE TODAY"
              value={summary?.busesIdleToday ?? 0}
              loading={summaryLoading}
              warn
            />
            <StatCell
              label="TRIPS TODAY"
              value={summary?.trips ?? 0}
              loading={summaryLoading}
            />
            <StatCell
              label="TRIPS THIS MONTH"
              value={summary?.monthTrips ?? 0}
              loading={summaryLoading}
            />
          </div>

          <div className="mt-4">{opsCells}</div>
          <TrendChart series={series} loading={summaryLoading} />
        </>
      )}

      {/* CASHIER: only their own money */}
      {isCashier && (
        <>
          <div className="grid auto-rows-[124px] grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 flex flex-col justify-between rounded-[20px] bg-forest p-5">
              <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
                </span>
                I COLLECTED TODAY
              </span>
              {summaryLoading ? (
                <Skeleton className="h-8 w-44 bg-white/15" />
              ) : (
                <span className="text-[32px] font-extrabold leading-none text-neon">
                  {fmtNaira(summary?.myCollectedToday)}
                </span>
              )}
            </div>
            <StatCell
              label="MY RECEIPTS TODAY"
              value={summary?.myReceiptsToday ?? 0}
              loading={summaryLoading}
            />
            <StatCell
              label="MY BUSES TODAY"
              value={summary?.myBusesToday ?? 0}
              loading={summaryLoading}
            />
            <StatCell
              label="MY TRIPS TODAY"
              value={summary?.myTripsToday ?? 0}
              loading={summaryLoading}
            />
            <StatCell
              label="MY CHECK-INS TODAY"
              value={summary?.myCheckedInToday ?? 0}
              loading={summaryLoading}
            />
          </div>
          <TrendChart series={series} loading={summaryLoading} personal />
        </>
      )}

      {/* STOREKEEPER: the store and workshop */}
      {isStore && (
        <>
          {opsCells}
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCell
              label="ACTIVE"
              value={batteryCounts?.active ?? 0}
              loading={batteriesLoading}
              to="/batteries"
            />
            <StatCell
              label="CHARGING"
              value={batteryCounts?.charging ?? 0}
              loading={batteriesLoading}
              to="/batteries"
            />
            <StatCell
              label="FULLY CHARGED"
              value={batteryCounts?.fully_charged ?? 0}
              loading={batteriesLoading}
              to="/batteries"
            />
            <StatCell
              label="FAULTY"
              value={batteryCounts?.faulty ?? 0}
              loading={batteriesLoading}
              warn
              to="/batteries"
            />
          </div>
        </>
      )}

      {/* STAFF: minimal workspace */}
      {!isManager && !isCashier && !isStore && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCell
            label="PENDING REQUESTS"
            value={pendingRequestsData?.pagination?.totalItems ?? 0}
            loading={requestsLoading}
            warn
            to="/requests"
          />
          <StatCell
            label="LOW STOCK ITEMS"
            value={lowStockData?.pagination?.totalItems ?? 0}
            loading={lowStockLoading}
            warn
            to="/inventory"
          />
          <Link
            to="/requests"
            className="col-span-2 flex h-[112px] flex-col justify-center gap-1 rounded-[20px] bg-forest p-5 transition-transform hover:scale-[1.01]"
          >
            <span className="text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
              NEED A PART?
            </span>
            <span className="text-[18px] font-extrabold leading-tight text-neon">
              Raise a part request →
            </span>
          </Link>
        </div>
      )}
    </>
  );
}
