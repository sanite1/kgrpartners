import { QRCodeSVG } from "qrcode.react";
import BoltMark from "@/components/shared/BoltMark";
import StatusPill from "../console/StatusPill";
import type { Receipt, ReceiptStatus } from "@/lib/network/types/receipt.types";
import { cn, fmtNaira, fmtDate } from "@/lib/utils";

// fixed bar widths for the barcode flourish
const BARCODE = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2];

export interface TicketDraft {
  busNumber: string;
  batteryName: string;
  batteryPercent: number;
  voltage: number;
  timeOut: string;
  expectedTrips: number;
  unitPrice: string;
  expectedAmount: string;
  date: string;
}

interface TicketCardProps {
  receipt?: Receipt | null; // issued
  draft?: TicketDraft | null; // live preview before issuing
  printable?: boolean;
}

const statusTone: Record<ReceiptStatus, "warn" | "success" | "muted"> = {
  awaiting_payment: "warn",
  paid: "success",
  void: "muted",
};

const statusLabel: Record<ReceiptStatus, string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  void: "Void",
};

// The bus receipt as a KGR transit pass: perforations, punch-hole
// notches, barcode flourish and a QR that encodes the ticket identity.
const TicketCard = ({ receipt, draft, printable }: TicketCardProps) => {
  const busNumber = receipt?.busNumber ?? draft?.busNumber ?? "";
  const batteryName = receipt?.batteryName ?? draft?.batteryName ?? "";
  const batteryPercent = receipt?.batteryPercent ?? draft?.batteryPercent ?? 0;
  const voltage = receipt?.voltage ?? draft?.voltage ?? 0;
  const timeOut = receipt?.timeOut ?? draft?.timeOut ?? "";
  const trips = receipt?.expectedTrips ?? draft?.expectedTrips ?? 0;
  const unitPrice = receipt?.unitPrice ?? draft?.unitPrice ?? "0";
  const amount = receipt?.expectedAmount ?? draft?.expectedAmount ?? "0";
  const date = receipt?.date ?? draft?.date ?? "";

  const qrValue = receipt
    ? `KGR-RECEIPT|bill:${receipt.billId}|ticket:${receipt.ticketId}|bus:${receipt.busNumber}|amount:${receipt.expectedAmount}|date:${receipt.date}`
    : "";

  return (
    <div
      id={printable ? "print-ticket" : undefined}
      className="relative w-full max-w-[420px] rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.08)]"
    >
      {/* header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <span className="flex items-center gap-2 text-[12px] font-extrabold tracking-[2px] text-brand-500">
          <BoltMark width={11} height={15} fill="#0FA53A" />
          KGR BUS RECEIPT
        </span>
        <span className="flex h-5 items-end gap-[2.5px]" aria-hidden="true">
          {BARCODE.map((width, i) => (
            <span
              key={i}
              style={{ width: `${width}px` }}
              className="h-full bg-ink/25"
            />
          ))}
        </span>
      </div>

      {/* perforation */}
      <div className="relative">
        <div
          data-print="rule"
          className="mx-5 border-t-2 border-dashed border-divider"
        />
        <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border-r border-line bg-haze" />
        <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border-l border-line bg-haze" />
      </div>

      {/* body */}
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
              BUS
            </div>
            <div className="mt-0.5 text-[30px] font-extrabold leading-none tracking-[-0.5px] text-ink">
              {busNumber || "—"}
            </div>
            <div className="mt-1 text-[13px] font-bold text-bark">
              {batteryName || "—"}
            </div>
          </div>
          {receipt && (
            <StatusPill
              tone={statusTone[receipt.status]}
              label={statusLabel[receipt.status]}
            />
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
              BATTERY %
            </div>
            <div className="mt-0.5 text-[18px] font-extrabold text-ink">
              {batteryPercent || "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
              VOLTAGE
            </div>
            <div className="mt-0.5 text-[18px] font-extrabold text-ink">
              {voltage || "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
              TIME OUT
            </div>
            <div className="mt-0.5 text-[18px] font-extrabold text-ink">
              {timeOut || "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
              TRIPS
            </div>
            <div className="mt-0.5 text-[18px] font-extrabold text-ink">
              {trips || "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
              PER TRIP
            </div>
            <div className="mt-0.5 text-[18px] font-extrabold text-ink">
              {fmtNaira(unitPrice)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
              DATE
            </div>
            <div className="mt-0.5 text-[15px] font-extrabold text-ink">
              {date ? fmtDate(date) : "—"}
            </div>
          </div>
        </div>

        <div
          data-print="amount"
          className="mt-5 rounded-2xl bg-forest px-5 py-4"
        >
          <div className="text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
            AMOUNT EXPECTED
          </div>
          <div className="mt-0.5 text-[30px] font-extrabold leading-none text-neon">
            {fmtNaira(amount)}
          </div>
        </div>
      </div>

      {/* perforation */}
      <div className="relative">
        <div
          data-print="rule"
          className="mx-5 border-t-2 border-dashed border-divider"
        />
        <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border-r border-line bg-haze" />
        <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border-l border-line bg-haze" />
      </div>

      {/* stub */}
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <div>
            <span className="text-[10px] font-extrabold tracking-[1.5px] text-fog">
              BILL ID{" "}
            </span>
            <span className="text-[15px] font-extrabold tabular-nums text-ink">
              {receipt ? `#${receipt.billId}` : "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold tracking-[1.5px] text-fog">
              TICKET{" "}
            </span>
            <span className="text-[15px] font-extrabold tabular-nums text-ink">
              {receipt ? receipt.ticketId : "issued on save"}
            </span>
          </div>
        </div>
        <div
          className={cn(
            "flex h-[74px] w-[74px] items-center justify-center rounded-lg border border-line bg-white p-1.5",
            !receipt && "opacity-30",
          )}
        >
          {receipt ? (
            <QRCodeSVG value={qrValue} size={62} fgColor="#0D1F15" />
          ) : (
            <span className="text-center text-[9px] font-bold text-fog">
              QR after issue
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
