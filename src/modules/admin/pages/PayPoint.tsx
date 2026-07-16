import { useState } from "react";
import { Download, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import { useGetReceipts } from "@/lib/network/api/receipt.api";
import { useGetReceiptSummary } from "@/lib/network/api/receipt.api";
import {
  useGetPayments,
  usePayReceipt,
  downloadPaymentsCsvFn,
} from "@/lib/network/api/payment.api";
import type { Receipt } from "@/lib/network/types/receipt.types";
import { cn, fmtNaira, fmtDate, todayLagos, downloadBlob } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function PayPoint() {
  const today = todayLagos();
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [downloading, setDownloading] = useState(false);

  const { data: results, isFetching } = useGetReceipts(
    { search: term, pageSize: 5 },
    { enabled: term.length > 0 },
  );
  const found = results?.data ?? [];

  const { data: summaryData } = useGetReceiptSummary();
  const summary = summaryData?.data;
  const expected = Number(summary?.expectedAmount ?? 0);
  const collected = Number(summary?.collectedAmount ?? 0);
  const pct = expected > 0 ? Math.min(1, collected / expected) : 0;
  const ARC = 283;

  const { data: todayPayments } = useGetPayments({
    date: today,
    pageSize: 10,
  });
  const payments = todayPayments?.data ?? [];

  const payReceipt = usePayReceipt();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadPaymentsCsvFn({
        date: today,
        collectedBy: "me",
      });
      downloadBlob(blob, `kgr-shift-report-${today}.csv`);
    } finally {
      setDownloading(false);
    }
  };

  const renderResult = (receipt: Receipt) => (
    <div
      key={receipt._id}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5"
    >
      <div className="flex items-center gap-4">
        <BoltMark width={12} height={16} fill="#0FA53A" />
        <div>
          <div className="text-[16px] font-extrabold text-ink">
            {receipt.busNumber}
            <span className="ml-2 text-[13px] font-semibold tabular-nums text-fog">
              #{receipt.billId} · {receipt.ticketId}
            </span>
          </div>
          <div className="mt-0.5 text-[13px] font-semibold text-fog">
            {fmtDate(receipt.date)} · {receipt.expectedTrips} trip
            {receipt.expectedTrips === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      {receipt.status === "awaiting_payment" ? (
        <button
          type="button"
          disabled={payReceipt.isPending}
          onClick={() => payReceipt.mutate({ receiptId: receipt._id })}
          className={cn(
            "cta-gradient cursor-pointer rounded-[10px] border-none px-6 py-3 text-[15px] font-extrabold text-forest-deep",
            payReceipt.isPending
              ? "cursor-not-allowed opacity-60"
              : "transition-transform hover:scale-[1.02]",
          )}
        >
          Collect {fmtNaira(receipt.expectedAmount)}
        </button>
      ) : (
        <StatusPill
          tone={receipt.status === "paid" ? "success" : "muted"}
          label={receipt.status === "paid" ? "Already paid" : "Void"}
        />
      )}
    </div>
  );

  return (
    <>
      <PageMeta title="PayPoint | KGR Console" />
      <PageHead
        eyebrow="PAYPOINT"
        title="Collect payments"
        subtitle="Find a receipt by ticket, bill or bus number and collect the cash."
        actions={
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500 disabled:opacity-50"
          >
            <Download size={15} />
            {downloading ? "Preparing…" : "Shift report"}
          </button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          {/* search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTerm(input.trim());
            }}
            className="flex gap-3 rounded-[20px] border border-line bg-white p-4 shadow-[0_12px_30px_rgba(13,31,21,0.05)]"
          >
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-fog"
              />
              <input
                type="text"
                autoFocus
                placeholder="Ticket ID, bill number or bus"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={cn(inputClasses, "py-3.5 pl-11 text-[16px]")}
              />
            </div>
            <button
              type="submit"
              className="cta-gradient cursor-pointer rounded-[10px] border-none px-7 text-[15px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
            >
              Find
            </button>
          </form>

          {/* results */}
          {term && (
            <div className="flex flex-col gap-3">
              {isFetching && (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
                </div>
              )}
              {!isFetching && found.length === 0 && (
                <p className="m-0 rounded-2xl border border-line bg-white px-5 py-8 text-center text-[14px] font-semibold text-fog">
                  Nothing matches "{term}".
                </p>
              )}
              {!isFetching && found.map(renderResult)}
            </div>
          )}

          {/* today's collections */}
          <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
            <div className="border-b border-line px-5 py-3.5 text-[12px] font-extrabold tracking-[1.5px] text-fog">
              TODAY'S COLLECTIONS
            </div>
            {payments.length === 0 ? (
              <p className="m-0 px-5 py-8 text-center text-[14px] font-semibold text-fog">
                No payments collected yet today.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <tbody>
                    {payments.map((p) => {
                      const receipt = p.receipt as {
                        billId?: number;
                        busNumber?: string;
                      };
                      const collector = p.collectedBy as {
                        firstName?: string;
                        lastName?: string;
                      };
                      return (
                        <tr
                          key={p._id}
                          className="border-b border-line last:border-b-0"
                        >
                          <td className="px-5 py-3 text-[13px] font-semibold text-fog">
                            {fmtTime(p.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-[14px] font-extrabold tabular-nums text-ink">
                            #{receipt?.billId}
                          </td>
                          <td className="px-5 py-3 text-[14px] font-extrabold text-ink">
                            {receipt?.busNumber}
                          </td>
                          <td className="px-5 py-3 text-[14px] font-extrabold text-brand-600">
                            {fmtNaira(p.amount)}
                          </td>
                          <td className="px-5 py-3 text-[13px] font-semibold text-fog">
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

        {/* gauge rail */}
        <div className="rounded-[20px] bg-forest p-6 lg:sticky lg:top-8">
          <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
            </span>
            COLLECTED TODAY
          </span>
          <div className="relative mx-auto mt-4 w-full max-w-[240px]">
            <svg viewBox="0 0 220 130" className="block w-full" aria-hidden="true">
              <defs>
                <linearGradient id="pp-gauge" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0FA53A" />
                  <stop offset="100%" stopColor="#0FF338" />
                </linearGradient>
              </defs>
              <path
                d="M20,120 A90,90 0 0 1 200,120"
                fill="none"
                stroke="#123524"
                strokeWidth={14}
                strokeLinecap="round"
              />
              <path
                d="M20,120 A90,90 0 0 1 200,120"
                fill="none"
                stroke="url(#pp-gauge)"
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray={ARC}
                strokeDashoffset={ARC - ARC * pct}
                style={{
                  transition: "stroke-dashoffset 0.6s cubic-bezier(0.2,0.8,0.2,1)",
                }}
              />
            </svg>
            <div className="absolute left-1/2 top-[62%] w-full -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-[26px] font-extrabold leading-none text-neon">
                {fmtNaira(summary?.collectedAmount)}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-mint-soft">
                of {fmtNaira(summary?.expectedAmount)} expected
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-forest-line p-3.5">
              <div className="text-[10px] font-extrabold tracking-[1.5px] text-mint-faint">
                OUTSTANDING
              </div>
              <div className="mt-1 text-[17px] font-extrabold text-solar">
                {fmtNaira(summary?.outstandingAmount)}
              </div>
            </div>
            <div className="rounded-xl border border-forest-line p-3.5">
              <div className="text-[10px] font-extrabold tracking-[1.5px] text-mint-faint">
                AWAITING
              </div>
              <div className="mt-1 text-[17px] font-extrabold text-white">
                {summary?.awaitingCount ?? 0} receipt
                {(summary?.awaitingCount ?? 0) === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
