import { useState } from "react";
import { Printer, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import Modal from "../components/console/Modal";
import TicketCard from "../components/receipts/TicketCard";
import {
  useGetReceipts,
  useCheckInReceipt,
  useVoidReceipt,
} from "@/lib/network/api/receipt.api";
import type {
  Receipt,
  ReceiptStatus,
} from "@/lib/network/types/receipt.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { cn, fmtNaira, fmtDate } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

type StatusFilter = "all" | ReceiptStatus;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "awaiting_payment", label: "Awaiting" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void" },
];

const statusTone: Record<ReceiptStatus, "warn" | "success" | "muted"> = {
  awaiting_payment: "warn",
  paid: "success",
  void: "muted",
};

const statusLabel: Record<ReceiptStatus, string> = {
  awaiting_payment: "Awaiting",
  paid: "Paid",
  void: "Void",
};

export default function Receipts() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState<StatusFilter>("all");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const { data, isLoading } = useGetReceipts({
    page,
    pageSize: 20,
    status: status === "all" ? undefined : status,
    date: date || undefined,
    search: search || undefined,
  });

  const receipts = data?.data ?? [];
  const pagination = data?.pagination;

  const checkIn = useCheckInReceipt();
  const voidReceipt = useVoidReceipt();

  const handleVoid = () => {
    if (!selected || voidReason.trim().length < 3) return;
    voidReceipt.mutate(
      { id: selected._id, payload: { reason: voidReason.trim() } },
      {
        onSuccess: () => {
          setSelected(null);
          setVoidReason("");
        },
      },
    );
  };

  return (
    <>
      <PageMeta title="Receipts | KGR Console" />
      <PageHead
        eyebrow="RECEIPTS"
        title="Receipts"
        subtitle="Every receipt ever issued. Voids keep their history."
      />

      {/* filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setStatus(f.id);
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                status === f.id
                  ? "cta-gradient border-transparent text-forest-deep"
                  : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 text-[14px] sm:w-[170px]")}
          />
          <div className="relative sm:w-[240px]">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
            />
            <input
              type="text"
              placeholder="Bill, ticket or bus"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn(inputClasses, "py-2.5 pl-9 text-[14px]")}
            />
          </div>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["BILL", "TICKET", "BUS", "TRIPS", "AMOUNT", "DATE", "STATUS", "CHECK-IN"].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr
                  key={receipt._id}
                  onClick={() => setSelected(receipt)}
                  className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-haze"
                >
                  <td className="px-4 py-4 text-[14px] font-extrabold tabular-nums text-ink">
                    #{receipt.billId}
                  </td>
                  <td className="px-4 py-4 text-[13px] font-semibold tabular-nums text-bark">
                    {receipt.ticketId}
                  </td>
                  <td className="px-4 py-4 text-[14px] font-extrabold text-ink">
                    {receipt.busNumber}
                  </td>
                  <td className="px-4 py-4 text-[14px] font-semibold text-bark">
                    {receipt.expectedTrips}
                  </td>
                  <td className="px-4 py-4 text-[14px] font-extrabold text-ink">
                    {fmtNaira(receipt.expectedAmount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[13px] font-semibold text-fog">
                    {fmtDate(receipt.date)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill
                      tone={statusTone[receipt.status]}
                      label={statusLabel[receipt.status]}
                    />
                  </td>
                  <td className="px-4 py-4">
                    {receipt.checkedIn ? (
                      <StatusPill tone="success" label="Checked in" />
                    ) : receipt.status === "void" ? (
                      <span className="text-[12px] font-semibold text-fog">
                        —
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={checkIn.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          checkIn.mutate(receipt._id);
                        }}
                        className="cursor-pointer whitespace-nowrap rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-extrabold text-bark transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
                      >
                        Check in
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && receipts.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              No receipts match this view.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center px-6 py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {pagination && pagination.totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
            <span className="text-[13px] font-semibold text-fog">
              {pagination.totalItems} receipt
              {pagination.totalItems === 1 ? "" : "s"} · page {pagination.page}{" "}
              of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* detail modal */}
      <Modal
        title={selected ? `Receipt #${selected.billId}` : ""}
        open={selected !== null}
        onClose={() => {
          setSelected(null);
          setVoidReason("");
        }}
      >
        {selected && (
          <div className="flex flex-col items-center gap-5">
            <TicketCard printable receipt={selected} />
            <div className="flex w-full flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="cta-gradient flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep"
              >
                <Printer size={15} /> Print
              </button>
              {!selected.checkedIn && selected.status !== "void" && (
                <button
                  type="button"
                  disabled={checkIn.isPending}
                  onClick={() =>
                    checkIn.mutate(selected._id, {
                      onSuccess: (data) => setSelected(data.data ?? null),
                    })
                  }
                  className="flex-1 cursor-pointer rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500 disabled:opacity-50"
                >
                  Check in
                </button>
              )}
            </div>

            {isAdmin && selected.status === "awaiting_payment" && (
              <div className="w-full rounded-xl border border-red-200 bg-red-50/50 p-4">
                <label htmlFor="void-reason" className={labelClasses}>
                  Void this receipt
                </label>
                <input
                  id="void-reason"
                  type="text"
                  placeholder="Reason (required)"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className={cn(inputClasses, "mt-1.5")}
                />
                <button
                  type="button"
                  disabled={voidReason.trim().length < 3 || voidReceipt.isPending}
                  onClick={handleVoid}
                  className="mt-2.5 cursor-pointer rounded-lg border-none bg-red-600 px-5 py-2.5 text-[13px] font-extrabold text-white disabled:opacity-40"
                >
                  {voidReceipt.isPending ? "Voiding…" : "Void receipt"}
                </button>
              </div>
            )}

            {selected.status === "void" && selected.voidReason && (
              <p className="m-0 w-full rounded-xl bg-mist px-4 py-3 text-[13px] font-semibold text-fog">
                Voided: {selected.voidReason}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
