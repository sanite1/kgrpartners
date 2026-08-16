import { useState } from "react";
import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import Skeleton from "../components/console/Skeleton";
import {
  useGetReceiptSummary,
  useGetOutstandingSummary,
  useGetReceiptSeries,
} from "@/lib/network/api/receipt.api";
import { useGetBuses } from "@/lib/network/api/bus.api";
import { useGetItems } from "@/lib/network/api/inventory.api";
import {
  useGetBatterySummary,
  useGetIdleBatteries,
} from "@/lib/network/api/battery.api";
import { useGetRepairJobs } from "@/lib/network/api/repair.api";
import { useGetPartRequests } from "@/lib/network/api/partRequest.api";
import { useGetGatePasses } from "@/lib/network/api/gatePass.api";
import { useGetChecklist } from "@/lib/network/api/checklist.api";
import { useGetTodos } from "@/lib/network/api/todo.api";
import type { ReceiptSeriesRange } from "@/lib/network/types/receipt.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove, isAdminRole } from "../permissions";
import { cn, fmtNaira } from "@/lib/utils";

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-NG", {
    weekday: "short",
  });

// bar labels: ₦663,750 reads as ₦664k so seven days fit side by side
const fmtCompact = (raw: string | number) => {
  const n = Number(raw) || 0;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
};

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

// The money bars. Personal mode drops the "expected" bar (a cashier
// has no personal expected figure) and shows collections only. Points
// arrive with ready-made labels so one chart serves every zoom level.
type TrendPoint = {
  key: string;
  label: string;
  expectedAmount: string;
  collectedAmount: string;
};

const TrendChart = ({
  points,
  title,
  loading,
  personal,
  controls,
}: {
  points: TrendPoint[];
  title: string;
  loading: boolean;
  personal?: boolean;
  controls?: React.ReactNode;
}) => {
  const max = Math.max(
    1,
    ...points.map((s) =>
      Math.max(Number(s.expectedAmount), Number(s.collectedAmount)),
    ),
  );
  const crowded = points.length > 8;
  return (
    <div className="mt-6 rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-extrabold tracking-[1.5px] text-fog">
          {title}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {!personal && (
            <span className="flex items-center gap-4 text-[11px] font-bold text-fog">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-card-line" />{" "}
                expected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="cta-gradient h-2.5 w-2.5 rounded-sm" />{" "}
                collected
              </span>
            </span>
          )}
          {controls}
        </div>
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
        <div className="flex h-[160px] items-end justify-between gap-1.5 sm:gap-4">
          {points.map((point) => {
            const expectedPct = Math.round(
              (Number(point.expectedAmount) / max) * 100,
            );
            const collectedPct = Math.round(
              (Number(point.collectedAmount) / max) * 100,
            );
            return (
              <div
                key={point.key}
                className="flex flex-1 flex-col items-center gap-1.5"
                title={
                  personal
                    ? `${point.label}: collected ${fmtNaira(point.collectedAmount)}`
                    : `${point.label}: expected ${fmtNaira(point.expectedAmount)}, collected ${fmtNaira(point.collectedAmount)}`
                }
              >
                <span
                  className={cn(
                    "whitespace-nowrap text-[9.5px] font-extrabold tabular-nums text-brand-600 sm:text-[11px]",
                    crowded && "hidden sm:block",
                  )}
                >
                  {fmtCompact(point.collectedAmount)}
                </span>
                <div className="flex h-[102px] w-full items-end justify-center gap-1">
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
                <span
                  className={cn(
                    "whitespace-nowrap font-bold text-fog",
                    crowded ? "text-[9px] sm:text-[10.5px]" : "text-[11px]",
                  )}
                >
                  {point.label}
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
  // monthly totals (money and trips) are the admin's view alone;
  // managers see the day's numbers
  const isAdmin = isAdminRole(role);
  const isCashier = role === "cashier";
  const [chartRange, setChartRange] = useState<ReceiptSeriesRange>("daily");
  const isStore = role === "storekeeper";
  const isSecurity = role === "security";
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

  // SECURITY: what is waiting at the gate and today's clearance sheet
  const { data: approvedPassesData, isLoading: passesLoading } =
    useGetGatePasses(
      { status: "approved", pageSize: 1 },
      { enabled: isSecurity },
    );
  const { data: securitySheetData, isLoading: sheetLoading } = useGetChecklist(
    "security",
    undefined,
    { enabled: isSecurity },
  );
  const sheetTotals = securitySheetData?.data?.totals;

  const { data: idleData } = useGetIdleBatteries({ enabled: isManager });
  const idleCount = idleData?.data?.count ?? 0;
  const snoozedCount = idleData?.data?.snoozedCount ?? 0;

  // the to-do list ringing: dated items whose day has arrived
  const { data: todoData } = useGetTodos(
    { view: "attention", pageSize: 1 },
    { enabled: isManager },
  );
  const todoCount = todoData?.counts?.attention ?? 0;

  const batteryCounts = batterySummaryData?.data?.counts;
  const series = summary?.series ?? [];

  // the admin chart at four zoom levels
  const { data: seriesData, isLoading: seriesLoading } = useGetReceiptSeries(
    chartRange,
    { enabled: isAdmin },
  );
  const chartPoints = seriesData?.data?.buckets ?? [];
  const CHART_TITLE: Record<ReceiptSeriesRange, string> = {
    daily: "LAST 7 DAYS",
    weekly: "LAST 8 WEEKS",
    monthly: "LAST 12 MONTHS",
    yearly: "BY YEAR",
  };
  const RANGES: { id: ReceiptSeriesRange; label: string }[] = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ];
  const rangePicker = (
    <div className="flex w-fit gap-1 rounded-lg border border-line bg-white p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => setChartRange(r.id)}
          className={cn(
            "cursor-pointer rounded-md border-none px-2.5 py-1 text-[11.5px] font-extrabold transition-colors",
            chartRange === r.id
              ? "cta-gradient text-forest-deep"
              : "bg-transparent text-fog hover:text-bark",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

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
        label="BATTERIES ON BUSES TODAY"
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
        : isSecurity
          ? "The gate at a glance. Release approved passes and clear every bus."
          : "Your workspace. Raise a part request or browse inventory.";

  return (
    <>
      <PageMeta title="Dashboard | KGR Console" />
      <PageHead
        eyebrow="OVERVIEW"
        title={`Welcome back, ${user?.firstName ?? ""}`}
        subtitle={subtitle}
      />

      {/* MANAGER / ADMIN: the whole yard */}
      {isManager && (
        <>
          {(idleCount > 0 || snoozedCount > 0) && (
            <Link
              to="/batteries"
              className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-solar/40 bg-[#FDF6E3] px-5 py-4 no-underline transition-colors hover:border-solar"
            >
              <span className="flex flex-wrap items-center gap-2.5 text-[14px] font-extrabold text-solar-700">
                <TriangleAlert size={17} className="flex-none" />
                {idleCount} {idleCount === 1 ? "battery has" : "batteries have"}{" "}
                not worked in 48 hours or more
                {snoozedCount > 0 && (
                  <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11.5px] font-extrabold text-bark">
                    {snoozedCount} snoozed
                  </span>
                )}
              </span>
              <span className="flex-none text-[13px] font-extrabold text-solar-700">
                View →
              </span>
            </Link>
          )}
          {todoCount > 0 && (
            <Link
              to="/todos"
              className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 no-underline transition-colors hover:border-red-300"
            >
              <span className="flex flex-wrap items-center gap-2.5 text-[14px] font-extrabold text-red-600">
                <TriangleAlert size={17} className="flex-none" />
                {todoCount} {todoCount === 1 ? "to-do needs" : "to-dos need"}{" "}
                attention on the company list
              </span>
              <span className="flex-none text-[13px] font-extrabold text-red-600">
                Open →
              </span>
            </Link>
          )}
          <div className="grid auto-rows-[124px] grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 flex flex-col justify-between rounded-[20px] bg-forest p-5">
              <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
                </span>
                {isAdmin ? "COLLECTED THIS MONTH" : "COLLECTED TODAY"}
              </span>
              {summaryLoading ? (
                <Skeleton className="h-8 w-44 bg-white/15" />
              ) : (
                <span className="text-[32px] font-extrabold leading-none text-neon">
                  {fmtNaira(
                    isAdmin ? summary?.monthCollected : summary?.collectedAmount,
                  )}
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
                {isAdmin ? "COLLECTED TODAY" : "EXPECTED TODAY"}
              </span>
              {summaryLoading ? (
                <Skeleton className="h-6 w-28" />
              ) : (
                <span className="text-[24px] font-extrabold leading-none text-ink">
                  {fmtNaira(
                    isAdmin ? summary?.collectedAmount : summary?.expectedAmount,
                  )}
                </span>
              )}
            </div>

            <StatCell
              label={isAdmin ? "RECEIPTS THIS MONTH" : "RECEIPTS TODAY"}
              value={
                (isAdmin ? summary?.monthIssuedCount : summary?.issuedCount) ??
                0
              }
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
          <div
            className={cn(
              "mt-4 grid auto-rows-[124px] grid-cols-2 gap-4",
              isAdmin ? "lg:grid-cols-6" : "lg:grid-cols-5",
            )}
          >
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
              label="BATTERIES WORKING TODAY"
              value={summary?.batteriesWorkingToday ?? 0}
              loading={summaryLoading}
            />
            <StatCell
              label="BATTERIES IDLE TODAY"
              value={summary?.batteriesIdleToday ?? 0}
              loading={summaryLoading}
              warn
            />
            <StatCell
              label="TRIPS TODAY"
              value={summary?.trips ?? 0}
              loading={summaryLoading}
            />
            {isAdmin && (
              <StatCell
                label="TRIPS THIS MONTH"
                value={summary?.monthTrips ?? 0}
                loading={summaryLoading}
              />
            )}
          </div>

          <div className="mt-4">{opsCells}</div>
          {/* week-long money trends are the admin's view alone */}
          {isAdmin && (
            <TrendChart
              points={chartPoints}
              title={`${CHART_TITLE[chartRange]} · EXPECTED VS COLLECTED`}
              loading={seriesLoading}
              controls={rangePicker}
            />
          )}
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
          <TrendChart
            points={series.map((p) => ({
              key: p.date,
              label: dayLabel(p.date),
              expectedAmount: p.expectedAmount,
              collectedAmount: p.collectedAmount,
            }))}
            title="LAST 7 DAYS · MY COLLECTIONS"
            loading={summaryLoading}
            personal
          />
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

      {/* SECURITY: the gate desk */}
      {isSecurity && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCell
            label="PASSES AWAITING RELEASE"
            value={approvedPassesData?.pagination?.totalItems ?? 0}
            loading={passesLoading}
            warn
            to="/gate-pass"
          />
          <StatCell
            label="BUSES CLEARED · MORNING"
            value={sheetTotals?.morningBuses ?? 0}
            loading={sheetLoading}
            to="/checklist"
          />
          <StatCell
            label="BUSES CLEARED · EVENING"
            value={sheetTotals?.eveningBuses ?? 0}
            loading={sheetLoading}
            to="/checklist"
          />
          <StatCell
            label="TRIPS TODAY"
            value={sheetTotals?.totalTrips ?? 0}
            loading={sheetLoading}
            to="/checklist"
          />
          <Link
            to="/checklist"
            className="col-span-2 flex h-[112px] flex-col justify-center gap-1 rounded-[20px] bg-forest p-5 transition-transform hover:scale-[1.01]"
          >
            <span className="text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
              BUS GOING OUT?
            </span>
            <span className="text-[18px] font-extrabold leading-tight text-neon">
              Clear a bus →
            </span>
          </Link>
          <Link
            to="/gate-pass"
            className="col-span-2 flex h-[112px] flex-col justify-center gap-1 rounded-[20px] bg-forest p-5 transition-transform hover:scale-[1.01]"
          >
            <span className="text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
              ITEMS LEAVING THE YARD?
            </span>
            <span className="text-[18px] font-extrabold leading-tight text-neon">
              Open gate passes →
            </span>
          </Link>
        </div>
      )}

      {/* STAFF: minimal workspace */}
      {!isManager && !isCashier && !isStore && !isSecurity && (
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
