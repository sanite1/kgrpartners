import { useState } from "react";
import { Download } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import {
  useGetMonthlyReport,
  useGetExpenseReport,
} from "@/lib/network/api/report.api";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { cn, fmtNaira, todayLagos, downloadBlob } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

const thClasses =
  "px-4 py-3 text-left text-[11px] font-extrabold tracking-[1px] text-fog";
const tdClasses = "px-4 py-3 text-[13.5px] font-semibold text-ink";

const toCsv = (header: string[], rows: (string | number)[][]) => {
  const escape = (v: string | number) =>
    `"${String(v).replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
};

const saveCsv = (csv: string, filename: string) =>
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);

export default function Reports() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [month, setMonth] = useState(todayLagos().slice(0, 7));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const monthly = useGetMonthlyReport(month, { enabled: isAdmin });
  const expenses = useGetExpenseReport(
    { from: from || undefined, to: to || undefined },
    { enabled: isAdmin },
  );

  if (!isAdmin) {
    return (
      <>
        <PageMeta title="Reports | KGR Console" />
        <PageHead eyebrow="INSIGHT" title="Reports" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            Reports are for admins only.
          </p>
        </div>
      </>
    );
  }

  const monthData = monthly.data?.data;
  const days = monthData?.days ?? [];
  const monthTotals = monthData?.totals;

  const expenseData = expenses.data?.data;
  const busRows = expenseData?.buses ?? [];
  const expenseTotals = expenseData?.totals;

  const exportMonthly = () => {
    if (!monthTotals) return;
    const csv = toCsv(
      [
        "Date",
        "Receipts",
        "Expected",
        "Collected",
        "From Today",
        "From Arrears",
        "Outstanding",
        "Voided",
        "Not Checked In",
      ],
      [
        ...days.map((d) => [
          d.date,
          d.issued,
          d.expected,
          d.collected,
          d.fromToday,
          d.fromArrears,
          d.outstanding,
          d.voided,
          d.notCheckedIn,
        ]),
        [
          "TOTAL",
          monthTotals.issued,
          monthTotals.expected,
          monthTotals.collected,
          monthTotals.fromToday,
          monthTotals.fromArrears,
          monthTotals.outstanding,
          monthTotals.voided,
          monthTotals.notCheckedIn,
        ],
      ],
    );
    saveCsv(csv, `kgr-monthly-${month}.csv`);
  };

  const exportExpenses = () => {
    if (!expenseTotals) return;
    const csv = toCsv(
      [
        "Bus",
        "Requests",
        "Requests Total",
        "Repairs",
        "Repair Parts",
        "Repair Labor",
        "Repairs Total",
        "Total",
      ],
      [
        ...busRows.map((b) => [
          b.busNumber,
          b.requestsCount,
          b.requestsTotal,
          b.repairsCount,
          b.repairsParts,
          b.repairsLabor,
          b.repairsTotal,
          b.total,
        ]),
        [
          "TOTAL",
          expenseTotals.requestsCount,
          expenseTotals.requestsTotal,
          expenseTotals.repairsCount,
          expenseTotals.repairsParts,
          expenseTotals.repairsLabor,
          expenseTotals.repairsTotal,
          expenseTotals.total,
        ],
      ],
    );
    saveCsv(csv, `kgr-expenses-${from || "all"}-${to || "all"}.csv`);
  };

  const exportBtn =
    "flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <PageMeta title="Reports | KGR Console" />
      <PageHead
        eyebrow="INSIGHT"
        title="Reports"
        subtitle="The month's money in one table, and where the fleet's spend goes."
      />

      {/* monthly ledger */}
      <div className="mb-6 rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="m-0 text-[17px] font-extrabold text-ink">
              Monthly ledger
            </h2>
            <p className="m-0 mt-1 text-[13px] font-medium text-sage">
              Issued vs collected per day; arrears collections counted apart.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rep-month" className={labelClasses}>
                Month
              </label>
              <input
                id="rep-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className={cn(inputClasses, "py-2.5")}
              />
            </div>
            <button
              type="button"
              disabled={days.length === 0}
              onClick={exportMonthly}
              className={exportBtn}
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] whitespace-nowrap border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={thClasses}>DATE</th>
                <th className={cn(thClasses, "text-right")}>RECEIPTS</th>
                <th className={cn(thClasses, "text-right")}>EXPECTED</th>
                <th className={cn(thClasses, "text-right")}>COLLECTED</th>
                <th className={cn(thClasses, "text-right")}>FROM TODAY</th>
                <th className={cn(thClasses, "text-right")}>ARREARS</th>
                <th className={cn(thClasses, "text-right")}>OUTSTANDING</th>
                <th className={cn(thClasses, "text-right")}>VOID</th>
                <th className={cn(thClasses, "text-right")}>NO CHECK-IN</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date} className="border-b border-line/60">
                  <td className={cn(tdClasses, "font-extrabold")}>{d.date}</td>
                  <td className={cn(tdClasses, "text-right")}>{d.issued}</td>
                  <td className={cn(tdClasses, "text-right")}>
                    {fmtNaira(d.expected)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-brand-600")}>
                    {fmtNaira(d.collected)}
                  </td>
                  <td className={cn(tdClasses, "text-right")}>
                    {fmtNaira(d.fromToday)}
                  </td>
                  <td className={cn(tdClasses, "text-right")}>
                    {fmtNaira(d.fromArrears)}
                  </td>
                  <td
                    className={cn(
                      tdClasses,
                      "text-right",
                      Number(d.outstanding) > 0 && "font-extrabold text-solar-700",
                    )}
                  >
                    {fmtNaira(d.outstanding)}
                  </td>
                  <td className={cn(tdClasses, "text-right")}>{d.voided}</td>
                  <td className={cn(tdClasses, "text-right")}>{d.notCheckedIn}</td>
                </tr>
              ))}
              {monthTotals && days.length > 0 && (
                <tr className="bg-forest-deep">
                  <td className={cn(tdClasses, "rounded-l-xl font-extrabold text-white")}>
                    TOTAL
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {monthTotals.issued}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {fmtNaira(monthTotals.expected)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-neon")}>
                    {fmtNaira(monthTotals.collected)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {fmtNaira(monthTotals.fromToday)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {fmtNaira(monthTotals.fromArrears)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-solar")}>
                    {fmtNaira(monthTotals.outstanding)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {monthTotals.voided}
                  </td>
                  <td className={cn(tdClasses, "rounded-r-xl text-right font-extrabold text-white")}>
                    {monthTotals.notCheckedIn}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {monthly.isLoading && (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
            </div>
          )}
          {!monthly.isLoading && days.length === 0 && (
            <p className="m-0 py-10 text-center text-[14px] font-semibold text-fog">
              Nothing recorded for this month yet.
            </p>
          )}
        </div>
      </div>

      {/* fleet expenses */}
      <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="m-0 text-[17px] font-extrabold text-ink">
              Fleet expenses
            </h2>
            <p className="m-0 mt-1 text-[13px] font-medium text-sage">
              Approved part requests plus completed repairs, per bus.
              Battery-only repairs show as Workshop.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rep-from" className={labelClasses}>
                From
              </label>
              <input
                id="rep-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={cn(inputClasses, "py-2.5")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rep-to" className={labelClasses}>
                To
              </label>
              <input
                id="rep-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={cn(inputClasses, "py-2.5")}
              />
            </div>
            <button
              type="button"
              disabled={busRows.length === 0}
              onClick={exportExpenses}
              className={exportBtn}
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] whitespace-nowrap border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={thClasses}>BUS</th>
                <th className={cn(thClasses, "text-right")}>REQUESTS</th>
                <th className={cn(thClasses, "text-right")}>REQUESTS ₦</th>
                <th className={cn(thClasses, "text-right")}>REPAIRS</th>
                <th className={cn(thClasses, "text-right")}>PARTS ₦</th>
                <th className={cn(thClasses, "text-right")}>LABOR ₦</th>
                <th className={cn(thClasses, "text-right")}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {busRows.map((b) => (
                <tr key={b.busNumber} className="border-b border-line/60">
                  <td className={cn(tdClasses, "font-extrabold")}>
                    {b.busNumber}
                  </td>
                  <td className={cn(tdClasses, "text-right")}>
                    {b.requestsCount}
                  </td>
                  <td className={cn(tdClasses, "text-right")}>
                    {fmtNaira(b.requestsTotal)}
                  </td>
                  <td className={cn(tdClasses, "text-right")}>
                    {b.repairsCount}
                  </td>
                  <td className={cn(tdClasses, "text-right")}>
                    {fmtNaira(b.repairsParts)}
                  </td>
                  <td className={cn(tdClasses, "text-right")}>
                    {fmtNaira(b.repairsLabor)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-brand-600")}>
                    {fmtNaira(b.total)}
                  </td>
                </tr>
              ))}
              {expenseTotals && busRows.length > 0 && (
                <tr className="bg-forest-deep">
                  <td className={cn(tdClasses, "rounded-l-xl font-extrabold text-white")}>
                    TOTAL
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {expenseTotals.requestsCount}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {fmtNaira(expenseTotals.requestsTotal)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {expenseTotals.repairsCount}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {fmtNaira(expenseTotals.repairsParts)}
                  </td>
                  <td className={cn(tdClasses, "text-right font-extrabold text-white")}>
                    {fmtNaira(expenseTotals.repairsLabor)}
                  </td>
                  <td className={cn(tdClasses, "rounded-r-xl text-right font-extrabold text-neon")}>
                    {fmtNaira(expenseTotals.total)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {expenses.isLoading && (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
            </div>
          )}
          {!expenses.isLoading && busRows.length === 0 && (
            <p className="m-0 py-10 text-center text-[14px] font-semibold text-fog">
              No approved requests or completed repairs in this range.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
