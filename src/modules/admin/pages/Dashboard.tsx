import { Link } from "react-router-dom";
import { TicketPlus } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import { useGetReceiptSummary } from "@/lib/network/api/receipt.api";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { cn, fmtNaira } from "@/lib/utils";

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-NG", {
    weekday: "short",
  });

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data } = useGetReceiptSummary();
  const summary = data?.data;

  const series = summary?.series ?? [];
  const maxExpected = Math.max(
    1,
    ...series.map((s) => Number(s.expectedAmount)),
  );

  return (
    <>
      <PageMeta title="Dashboard | KGR Console" />
      <PageHead
        eyebrow="OVERVIEW"
        title={`Welcome back, ${user?.firstName ?? ""}`}
        subtitle="Today at the yard, at a glance."
        actions={
          <Link
            to="/generate"
            className="cta-gradient flex items-center gap-2 rounded-[10px] px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02] hover:text-forest-deep"
          >
            <TicketPlus size={16} strokeWidth={2.4} /> Generate receipt
          </Link>
        }
      />

      {/* bento stats */}
      <div className="grid auto-rows-[124px] grid-cols-2 gap-4 lg:grid-cols-4">
        {/* collected: the day's headline */}
        <div className="col-span-2 flex flex-col justify-between rounded-[20px] bg-forest p-5">
          <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
            </span>
            COLLECTED TODAY
          </span>
          <span className="text-[32px] font-extrabold leading-none text-neon">
            {fmtNaira(summary?.collectedAmount)}
          </span>
        </div>

        {/* outstanding: warm on purpose */}
        <div className="flex flex-col justify-between rounded-[20px] bg-solar p-5">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-forest-deep/70">
            OUTSTANDING
          </span>
          <span className="text-[24px] font-extrabold leading-none text-forest-deep">
            {fmtNaira(summary?.outstandingAmount)}
          </span>
        </div>

        <div className="flex flex-col justify-between rounded-[20px] border border-line bg-white p-5">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
            EXPECTED TODAY
          </span>
          <span className="text-[24px] font-extrabold leading-none text-ink">
            {fmtNaira(summary?.expectedAmount)}
          </span>
        </div>

        {[
          { label: "RECEIPTS ISSUED", value: summary?.issuedCount ?? 0 },
          { label: "TRIPS EXPECTED", value: summary?.trips ?? 0 },
          { label: "BUSES CHECKED IN", value: summary?.checkedIn ?? 0 },
          { label: "AWAITING PAYMENT", value: summary?.awaitingCount ?? 0 },
        ].map((cell) => (
          <div
            key={cell.label}
            className="flex flex-col justify-between rounded-[20px] border border-line bg-white p-5"
          >
            <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
              {cell.label}
            </span>
            <span
              className={cn(
                "text-[28px] font-extrabold leading-none",
                cell.label === "AWAITING PAYMENT" && cell.value > 0
                  ? "text-solar-700"
                  : "text-ink",
              )}
            >
              {cell.value}
            </span>
          </div>
        ))}
      </div>

      {/* 7-day trend */}
      <div className="mt-6 rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] font-extrabold tracking-[1.5px] text-fog">
            LAST 7 DAYS · EXPECTED VS COLLECTED
          </span>
          <span className="flex items-center gap-4 text-[11px] font-bold text-fog">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-card-line" /> expected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="cta-gradient h-2.5 w-2.5 rounded-sm" /> collected
            </span>
          </span>
        </div>
        <div className="flex h-[160px] items-end justify-between gap-2 sm:gap-4">
          {series.map((point) => {
            const expectedPct = Math.round(
              (Number(point.expectedAmount) / maxExpected) * 100,
            );
            const collectedPct = Math.round(
              (Number(point.collectedAmount) / maxExpected) * 100,
            );
            return (
              <div
                key={point.date}
                className="flex flex-1 flex-col items-center gap-2"
                title={`${point.date}: expected ${fmtNaira(point.expectedAmount)}, collected ${fmtNaira(point.collectedAmount)}`}
              >
                <div className="flex h-[120px] w-full items-end justify-center gap-1">
                  <div
                    className="w-[38%] max-w-[26px] rounded-t-md bg-card-line"
                    style={{ height: `${Math.max(2, expectedPct)}%` }}
                  />
                  <div
                    className="cta-gradient w-[38%] max-w-[26px] rounded-t-md"
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
      </div>
    </>
  );
}
