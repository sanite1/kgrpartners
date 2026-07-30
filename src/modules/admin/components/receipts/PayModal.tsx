import { useState } from "react";
import Modal from "../console/Modal";
import { usePayReceipt } from "@/lib/network/api/payment.api";
import type { Receipt } from "@/lib/network/types/receipt.types";
import { cn, fmtNaira } from "@/lib/utils";
import { inputClasses, labelClasses, errorClasses } from "../console/form";

interface PayModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

// Collecting cash for one receipt. Defaults to the full expected amount;
// entering less demands a reason, which follows the payment to the admin's
// daily account and shift reports.
const PayModal = ({ receipt, onClose }: PayModalProps) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const payReceipt = usePayReceipt();

  const expected = receipt?.expectedAmount ?? "0";
  // untouched input means full payment
  const effective = amount.trim() === "" ? expected : amount.trim();
  const amountNum = Number(effective);
  const isShort = amountNum > 0 && amountNum < Number(expected);
  const overpaid = amountNum > Number(expected);

  const close = () => {
    setAmount("");
    setReason("");
    setError("");
    onClose();
  };

  const collect = () => {
    if (!receipt) return;
    if (!/^\d+(\.\d{1,2})?$/.test(effective) || !(amountNum > 0)) {
      setError("Enter a plain amount like 5000");
      return;
    }
    if (overpaid) {
      setError(
        `This receipt expects ${fmtNaira(expected)}; collect at most that`,
      );
      return;
    }
    if (isShort && reason.trim().length < 3) {
      setError("Give the reason for collecting less than expected");
      return;
    }
    setError("");
    payReceipt.mutate(
      {
        receiptId: receipt._id,
        amount: isShort ? effective : undefined,
        reason: isShort ? reason.trim() : undefined,
      },
      { onSuccess: close },
    );
  };

  return (
    <Modal
      title={receipt ? `Collect for ${receipt.busNumber}` : "Collect"}
      open={!!receipt}
      onClose={close}
    >
      {receipt && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl bg-haze px-4 py-3.5">
            <span className="text-[12px] font-extrabold tracking-[1px] text-fog">
              EXPECTED · #{receipt.billId}
            </span>
            <span className="text-[18px] font-extrabold text-ink">
              {fmtNaira(expected)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pay-amount" className={labelClasses}>
              Amount collected <span className="text-brand-500">*</span>
            </label>
            <input
              id="pay-amount"
              type="text"
              inputMode="numeric"
              placeholder={expected}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
            {isShort && (
              <span className="text-[12px] font-bold text-solar-700">
                {fmtNaira(Number(expected) - amountNum)} below expected: a
                reason is required.
              </span>
            )}
          </div>

          {isShort && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pay-reason" className={labelClasses}>
                Reason <span className="text-brand-500">*</span>
              </label>
              <textarea
                id="pay-reason"
                rows={2}
                placeholder="Why is less being collected?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={cn(inputClasses, "resize-y")}
              />
            </div>
          )}

          {error && <span className={errorClasses}>{error}</span>}

          <button
            type="button"
            disabled={payReceipt.isPending}
            onClick={collect}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[15px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {payReceipt.isPending
              ? "Collecting…"
              : `Collect ${fmtNaira(effective)} →`}
          </button>
        </div>
      )}
    </Modal>
  );
};

export default PayModal;
