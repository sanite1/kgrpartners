import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import { cn, fmtNaira } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

// ₦847,977,210 reads as ₦848.0m on an axis
const compact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}bn`;
  if (abs >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
};
const money = (n: number) => Math.round(n * 100) / 100;

type Compounding = "monthly" | "daily";

interface Row {
  month: number;
  opening: number;
  contribution: number;
  interest: number;
  closing: number;
  nextYield: number; // what the closing balance earns in the next month
}

// The same sum the owners checked by hand: a daily amount turned into
// its monthly equivalent (x 365.25 / 12), compounded month by month at
// rate / 12. "Daily" instead compounds every deposit at rate / 365.25.
const project = (
  daily: number,
  ratePct: number,
  months: number,
  compounding: Compounding,
): Row[] => {
  const rows: Row[] = [];
  const monthly = (daily * 365.25) / 12;
  const r = ratePct / 100;
  let balance = 0;
  for (let m = 1; m <= months; m += 1) {
    const opening = balance;
    let interest = 0;
    if (compounding === "monthly") {
      // deposit lands first, then the whole month earns (Gemini's sum)
      interest = (opening + monthly) * (r / 12);
      balance = opening + monthly + interest;
    } else {
      const days = 365.25 / 12;
      const dr = r / 365.25;
      let b = opening;
      for (let d = 0; d < days; d += 1) {
        b += daily;
        const inc = b * dr;
        interest += inc;
        b += inc;
      }
      balance = b;
    }
    rows.push({
      month: m,
      opening: money(opening),
      contribution: money(monthly),
      interest: money(interest),
      closing: money(balance),
      nextYield: money(balance * (r / 12)),
    });
  }
  return rows;
};

// A savings projection the owners can play with: how much a day, at
// what rate, for how long, and what that becomes. No records are kept;
// it is a calculator, separate from Finance and the Money Book.
export default function GrowthPlanner() {
  const [daily, setDaily] = useState("600000");
  const [rate, setRate] = useState("16");
  const [months, setMonths] = useState("36");
  const [compounding, setCompounding] = useState<Compounding>("monthly");
  const [showAll, setShowAll] = useState(false);

  const dailyNum = Math.max(0, Number(daily) || 0);
  const rateNum = Math.max(0, Number(rate) || 0);
  const monthsNum = Math.min(600, Math.max(1, Math.round(Number(months) || 0)));

  const rows = useMemo(
    () => project(dailyNum, rateNum, monthsNum, compounding),
    [dailyNum, rateNum, monthsNum, compounding],
  );
  const last = rows[rows.length - 1];
  const deposits = money(rows.reduce((s, r) => s + r.contribution, 0));
  const interest = money((last?.closing ?? 0) - deposits);
  const peak = Math.max(1, last?.closing ?? 1);
  const years = monthsNum / 12;
  const yearsText =
    years >= 1
      ? `${Number.isInteger(years) ? years : years.toFixed(1)} year${years === 1 ? "" : "s"}`
      : `${monthsNum} month${monthsNum === 1 ? "" : "s"}`;

  const visibleRows = showAll
    ? rows
    : rows.length <= 8
      ? rows
      : [...rows.slice(0, 3), ...rows.slice(-3)];

  // one polyline across the months; the axis labels every quarter
  const W = 640;
  const H = 220;
  const padL = 56;
  const padB = 28;
  const points = rows
    .map((r, i) => {
      const x = padL + (i / Math.max(1, rows.length - 1)) * (W - padL - 12);
      const y = 12 + (1 - r.closing / peak) * (H - padB - 12);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const monthLabel = (n: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + n);
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  };

  return (
    <>
      <PageMeta title="Growth Planner | KGR Console" />
      <PageHead
        eyebrow="WHAT A DAILY HABIT BECOMES"
        title="Growth Planner"
        subtitle="Set aside an amount every day at a given rate and see what it grows into, month by month."
      />

      {/* the inputs: each one separate, as asked */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4">
          <label htmlFor="gp-daily" className={labelClasses}>
            Amount per day (₦)
          </label>
          <input
            id="gp-daily"
            type="number"
            min="0"
            step="1000"
            inputMode="numeric"
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
            className={cn(inputClasses, "text-[18px] font-extrabold")}
          />
          <div className="flex flex-wrap gap-1.5">
            {[100000, 300000, 600000, 700000, 1000000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDaily(String(v))}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-extrabold",
                  dailyNum === v
                    ? "border-transparent bg-forest-deep text-neon"
                    : "border-line bg-white text-bark hover:border-brand-500",
                )}
              >
                {compact(v)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4">
          <label htmlFor="gp-rate" className={labelClasses}>
            Interest rate (% per year)
          </label>
          <input
            id="gp-rate"
            type="number"
            min="0"
            max="100"
            step="0.5"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={cn(inputClasses, "text-[18px] font-extrabold")}
          />
          <div className="flex flex-wrap gap-1.5">
            {[10, 12, 16, 18, 20].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRate(String(v))}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-extrabold",
                  rateNum === v
                    ? "border-transparent bg-forest-deep text-neon"
                    : "border-line bg-white text-bark hover:border-brand-500",
                )}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4">
          <label htmlFor="gp-months" className={labelClasses}>
            For how long (months)
          </label>
          <input
            id="gp-months"
            type="number"
            min="1"
            max="600"
            step="1"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className={cn(inputClasses, "text-[18px] font-extrabold")}
          />
          <div className="flex flex-wrap gap-1.5">
            {[12, 24, 36, 60, 120].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMonths(String(v))}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-extrabold",
                  monthsNum === v
                    ? "border-transparent bg-forest-deep text-neon"
                    : "border-line bg-white text-bark hover:border-brand-500",
                )}
              >
                {v / 12 >= 1 ? `${v / 12}y` : `${v}m`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4">
          <span className={labelClasses}>Interest added</span>
          <div className="flex gap-2">
            {(["monthly", "daily"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCompounding(c)}
                className={cn(
                  "flex-1 cursor-pointer rounded-[10px] border px-3 py-2.5 text-[13.5px] font-extrabold transition-colors",
                  compounding === c
                    ? "cta-gradient border-transparent text-forest-deep"
                    : "border-line bg-white text-bark hover:border-brand-500",
                )}
              >
                {c === "monthly" ? "Monthly" : "Daily"}
              </button>
            ))}
          </div>
          <span className="text-[11.5px] font-semibold text-fog">
            Monthly matches the sum the owners checked: ₦ a day × 365.25 ÷ 12,
            at rate ÷ 12 each month.
          </span>
        </div>
      </div>

      {/* the answer in one sentence */}
      <div className="mb-5 rounded-2xl border border-forest-border bg-forest-deep px-5 py-4">
        <p className="m-0 text-[14.5px] font-bold leading-relaxed text-white">
          Put in <span className="text-neon">{fmtNaira(dailyNum)}</span> a day
          for <span className="text-neon">{yearsText}</span> at{" "}
          <span className="text-neon">{rateNum}%</span> and you end with{" "}
          <span className="text-neon">{fmtNaira(last?.closing ?? 0)}</span>, of
          which <span className="text-neon">{fmtNaira(interest)}</span> is
          interest. By then the balance earns about{" "}
          <span className="text-neon">{fmtNaira(last?.nextYield ?? 0)}</span>{" "}
          every month on its own.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["TOTAL DEPOSITED", deposits, false],
            ["INTEREST EARNED", interest, true],
            ["FINAL BALANCE", last?.closing ?? 0, false],
            [
              `MONTHLY INTEREST · MONTH ${monthsNum}`,
              last?.nextYield ?? 0,
              true,
            ],
          ] as const
        ).map(([label, value, green]) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl border border-line bg-white p-4"
          >
            <span
              className={cn(
                "block break-all text-[16px] font-extrabold leading-tight tabular-nums sm:text-[20px]",
                green ? "text-brand-600" : "text-ink",
              )}
            >
              {fmtNaira(value)}
            </span>
            <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* the curve */}
      <div className="mb-5 rounded-2xl border border-line bg-white p-5">
        <span className="block text-[14px] font-extrabold text-ink">
          Balance over time
        </span>
        <span className="block text-[12px] font-semibold text-fog">
          Deposits plus interest, month by month
        </span>
        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full min-w-[480px]"
            role="img"
            aria-label="Balance growth curve"
          >
            {ticks.map((t) => {
              const y = 12 + (1 - t) * (H - padB - 12);
              return (
                <g key={t}>
                  <line
                    x1={padL}
                    x2={W - 12}
                    y1={y}
                    y2={y}
                    stroke="#E7EFE9"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="700"
                    fill="#7A8A80"
                  >
                    {compact(peak * t)}
                  </text>
                </g>
              );
            })}
            {rows
              .filter(
                (_, i) =>
                  i === 0 ||
                  (i + 1) % Math.max(1, Math.round(rows.length / 6)) === 0 ||
                  i === rows.length - 1,
              )
              .map((r, _, arr) => {
                const i = r.month - 1;
                const x =
                  padL + (i / Math.max(1, rows.length - 1)) * (W - padL - 12);
                return (
                  <text
                    key={r.month}
                    x={x}
                    y={H - 8}
                    textAnchor={
                      arr.length > 1 && r.month === rows.length
                        ? "end"
                        : "middle"
                    }
                    fontSize="10"
                    fontWeight="700"
                    fill="#7A8A80"
                  >
                    {monthLabel(r.month)}
                  </text>
                );
              })}
            <polyline
              points={points}
              fill="none"
              stroke="#0FA53A"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* the schedule */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line bg-haze px-5 py-3">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
            MONTH BY MONTH
          </span>
          {rows.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] font-extrabold text-brand-600 hover:text-brand-500"
            >
              {showAll
                ? "Show start and end only"
                : `Show all ${rows.length} months`}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {[
                  "MONTH",
                  "OPENING",
                  "DEPOSITED",
                  "INTEREST",
                  "CLOSING",
                  "NEXT MONTH EARNS",
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
              {visibleRows.map((r, i) => (
                <>
                  {!showAll && rows.length > 8 && i === 3 && (
                    <tr key="gap" className="border-b border-line">
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-center text-[12px] font-bold text-fog"
                      >
                        · · · {rows.length - 6} more months · · ·
                      </td>
                    </tr>
                  )}
                  <tr
                    key={r.month}
                    className="border-b border-line last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-extrabold text-ink">
                      {r.month}
                      <span className="ml-2 text-[11px] font-semibold text-fog">
                        {monthLabel(r.month)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-bark">
                      {fmtNaira(r.opening)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-bark">
                      {fmtNaira(r.contribution)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-extrabold tabular-nums text-brand-600">
                      {fmtNaira(r.interest)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-extrabold tabular-nums text-ink">
                      {fmtNaira(r.closing)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-fog">
                      {fmtNaira(r.nextYield)}
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4">
        <div>
          <span className="block text-[14px] font-extrabold text-ink">
            Make this a real goal
          </span>
          <span className="block text-[12px] font-semibold text-fog">
            Track the money that actually goes in against this plan.
          </span>
        </div>
        <Link
          to={`/goals?new=1&daily=${dailyNum}&rate=${rateNum}&months=${monthsNum}`}
          className="cta-gradient flex items-center gap-2 rounded-[10px] px-5 py-3 text-[14px] font-extrabold text-forest-deep no-underline transition-transform hover:scale-[1.02]"
        >
          <Target size={16} strokeWidth={3} /> Send to Goal Tracker
        </Link>
      </div>
      <p className="m-0 mt-3 text-[12px] font-semibold text-fog">
        A projection, not a promise: it assumes the rate holds and every deposit
        is made. Nothing here is saved.
      </p>
    </>
  );
}
