import { useState } from "react";
import { Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import Skeleton from "../components/console/Skeleton";
import {
  useGetReceipts,
  useGetOutstandingSummary,
} from "@/lib/network/api/receipt.api";
import type { Receipt } from "@/lib/network/types/receipt.types";
import PayModal from "../components/receipts/PayModal";
import { cn, fmtNaira, fmtDate, todayLagos } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

const ageDays = (date: string, today: string): number => {
  const ms =
    new Date(`${today}T00:00:00Z`).getTime() -
    new Date(`${date}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
};

const ageStyle = (days: number) =>
  days <= 7
    ? { border: "border-l-brand-400", text: "text-brand-600" }
    : days <= 30
      ? { border: "border-l-solar", text: "text-solar-700" }
      : { border: "border-l-red-400", text: "text-red-600" };

export default function Nyp() {
  const today = todayLagos();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data: summaryData, isLoading: summaryLoading } =
    useGetOutstandingSummary();
  const summary = summaryData?.data;

  const { data, isLoading } = useGetReceipts({
    page,
    pageSize,
    status: "awaiting_payment",
    sort: "oldest",
    search: search || undefined,
  });
  const receipts = data?.data ?? [];
  const pagination = data?.pagination;

  const [payFor, setPayFor] = useState<Receipt | null>(null);

  return (
    <>
      <PageMeta title="NYP List | KGR Console" />
      <PageHead
        eyebrow="NOT YET PAID"
        title="NYP List"
        subtitle="Every unpaid receipt, oldest first. The longer it waits, the louder it gets."
      />

      {/* totals banner */}
      <div className="mb-6 flex flex-col gap-5 rounded-[20px] bg-forest p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
            TOTAL OUTSTANDING
          </span>
          {summaryLoading ? (
            <>
              <Skeleton className="mt-2 h-7 w-40 bg-white/15" />
              <Skeleton className="mt-2 h-3.5 w-28 bg-white/10" />
            </>
          ) : (
            <>
              <div className="mt-1 text-[32px] font-extrabold leading-none text-solar">
                {fmtNaira(summary?.totalAmount)}
              </div>
              <div className="mt-1.5 text-[13px] font-semibold text-mint-soft">
                across {summary?.count ?? 0} receipt
                {(summary?.count ?? 0) === 1 ? "" : "s"}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {[
            {
              label: "≤ 7 days",
              bucket: summary?.buckets.d0_7,
              dot: "bg-brand-400",
            },
            {
              label: "8 to 30 days",
              bucket: summary?.buckets.d8_30,
              dot: "bg-solar",
            },
            {
              label: "over 30 days",
              bucket: summary?.buckets.d30plus,
              dot: "bg-red-400",
            },
          ].map((b) => (
            <div
              key={b.label}
              className="rounded-xl border border-forest-line px-4 py-3"
            >
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[1px] text-mint-faint">
                <span className={cn("h-1.5 w-1.5 rounded-full", b.dot)} />
                {b.label.toUpperCase()}
              </span>
              {summaryLoading ? (
                <Skeleton className="mt-2 h-4 w-24 bg-white/15" />
              ) : (
                <div className="mt-1 text-[15px] font-extrabold text-white">
                  {fmtNaira(b.bucket?.amount)}{" "}
                  <span className="text-[11px] font-semibold text-mint-soft">
                    ({b.bucket?.count ?? 0})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* search */}
      <div className="relative mb-4 sm:w-[280px]">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
        />
        <input
          type="text"
          placeholder="Bus, bill or ticket"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
        />
      </div>

      {/* rows */}
      <div className="flex flex-col gap-2.5">
        {receipts.map((receipt) => {
          const days = ageDays(receipt.date, today);
          const style = ageStyle(days);
          return (
            <div
              key={receipt._id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line border-l-4 bg-white px-5 py-4",
                style.border,
              )}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="min-w-[90px]">
                  <div className="text-[16px] font-extrabold text-ink">
                    {receipt.busNumber}
                  </div>
                  <div className="text-[12px] font-semibold tabular-nums text-fog">
                    #{receipt.billId}
                  </div>
                </div>
                <div>
                  <div className={cn("text-[14px] font-extrabold", style.text)}>
                    {days === 0
                      ? "Issued today"
                      : `${days} day${days === 1 ? "" : "s"} overdue`}
                  </div>
                  <div className="text-[12.5px] font-semibold text-fog">
                    issued {fmtDate(receipt.date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[17px] font-extrabold text-ink">
                  {fmtNaira(receipt.expectedAmount)}
                </span>
                <button
                  type="button"
                  onClick={() => setPayFor(receipt)}
                  className="cta-gradient cursor-pointer rounded-[10px] border-none px-5 py-2.5 text-[13px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
                >
                  Pay
                </button>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {!isLoading && receipts.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {search
                ? `Nothing owing matches "${search}".`
                : "Nothing outstanding. Every receipt is settled."}
            </p>
          </div>
        )}

        <Pagination
          pagination={pagination}
          page={page}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      <PayModal receipt={payFor} onClose={() => setPayFor(null)} />
    </>
  );
}
