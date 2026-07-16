import { useState } from "react";
import { Download } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import {
  useGetDailyAccount,
  downloadPaymentsCsvFn,
} from "@/lib/network/api/payment.api";
import { cn, fmtNaira, fmtDate, todayLagos, downloadBlob } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function DailyAccount() {
  const [date, setDate] = useState(todayLagos());
  const [downloading, setDownloading] = useState(false);
  const { data } = useGetDailyAccount(date);
  const account = data?.data;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadPaymentsCsvFn({ date });
      downloadBlob(blob, `kgr-collections-${date}.csv`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageMeta title="Daily Account | KGR Console" />
      <PageHead
        eyebrow="RECONCILIATION"
        title="Daily Account"
        subtitle="One day's money: what was expected, what came in, and from whom."
        actions={
          <div className="flex gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayLagos())}
              className={cn(inputClasses, "w-[165px] py-2.5 text-[14px]")}
            />
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownload}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-extrabold text-ink transition-colors hover:border-brand-500 disabled:opacity-50"
            >
              <Download size={14} />
              CSV
            </button>
          </div>
        }
      />

      {/* summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="flex flex-col justify-between rounded-[20px] border border-line bg-white p-5">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
            EXPECTED
          </span>
          <span className="mt-3 text-[20px] font-extrabold leading-none text-ink">
            {fmtNaira(account?.expectedAmount)}
          </span>
        </div>
        <div className="flex flex-col justify-between rounded-[20px] bg-forest p-5">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
            COLLECTED TOTAL
          </span>
          <span className="mt-3 text-[20px] font-extrabold leading-none text-neon">
            {fmtNaira(account?.collectedTotal)}
          </span>
        </div>
        <div className="flex flex-col justify-between rounded-[20px] border border-line bg-white p-5">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
            FROM TODAY'S RECEIPTS
          </span>
          <span className="mt-3 text-[20px] font-extrabold leading-none text-ink">
            {fmtNaira(account?.collectedFromToday)}
          </span>
        </div>
        <div className="flex flex-col justify-between rounded-[20px] bg-solar p-5">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-forest-deep/70">
            FROM ARREARS
          </span>
          <span className="mt-3 text-[20px] font-extrabold leading-none text-forest-deep">
            {fmtNaira(account?.collectedFromArrears)}
          </span>
        </div>
        <div className="col-span-2 flex flex-col justify-between rounded-[20px] border border-line bg-white p-5 lg:col-span-1">
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
            STILL OUTSTANDING
          </span>
          <span
            className={cn(
              "mt-3 text-[20px] font-extrabold leading-none",
              Number(account?.outstandingToday ?? 0) > 0
                ? "text-solar-700"
                : "text-ink",
            )}
          >
            {fmtNaira(account?.outstandingToday)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_1fr]">
        {/* by cashier */}
        <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
          <div className="border-b border-line px-5 py-3.5 text-[12px] font-extrabold tracking-[1.5px] text-fog">
            BY CASHIER
          </div>
          {(account?.cashiers ?? []).length === 0 ? (
            <p className="m-0 px-5 py-8 text-center text-[14px] font-semibold text-fog">
              No collections this day.
            </p>
          ) : (
            (account?.cashiers ?? []).map((cashier) => (
              <div
                key={cashier.id}
                className="flex items-center justify-between border-b border-line px-5 py-3.5 last:border-b-0"
              >
                <div>
                  <div className="text-[14px] font-extrabold text-ink">
                    {cashier.name}
                  </div>
                  <div className="text-[12px] font-semibold text-fog">
                    {cashier.count} payment{cashier.count === 1 ? "" : "s"}
                  </div>
                </div>
                <span className="text-[15px] font-extrabold text-brand-600">
                  {fmtNaira(cashier.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* transactions */}
        <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
          <div className="border-b border-line px-5 py-3.5 text-[12px] font-extrabold tracking-[1.5px] text-fog">
            TRANSACTIONS · {fmtDate(account?.date)}
          </div>
          {(account?.payments ?? []).length === 0 ? (
            <p className="m-0 px-5 py-8 text-center text-[14px] font-semibold text-fog">
              No transactions recorded.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    {["TIME", "BILL", "BUS", "RECEIPT DAY", "AMOUNT", "CASHIER"].map(
                      (h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(account?.payments ?? []).map((p) => {
                    const receipt = p.receipt as {
                      billId?: number;
                      busNumber?: string;
                    };
                    const collector = p.collectedBy as {
                      firstName?: string;
                      lastName?: string;
                    };
                    const arrears = p.receiptDate !== account?.date;
                    return (
                      <tr
                        key={p._id}
                        className="border-b border-line last:border-b-0"
                      >
                        <td className="px-4 py-3 text-[13px] font-semibold text-fog">
                          {fmtTime(p.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-extrabold tabular-nums text-ink">
                          #{receipt?.billId}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-extrabold text-ink">
                          {receipt?.busNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={cn(
                              "text-[12.5px] font-bold",
                              arrears ? "text-solar-700" : "text-fog",
                            )}
                          >
                            {fmtDate(p.receiptDate)}
                            {arrears && " (arrears)"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[14px] font-extrabold text-brand-600">
                          {fmtNaira(p.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                          {collector?.firstName} {collector?.lastName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
