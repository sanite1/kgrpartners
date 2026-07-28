import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ShieldCheck } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import Drawer from "../components/console/Drawer";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetGatePasses,
  useApproveGatePass,
  useDeclineGatePass,
  useClearGatePassItem,
  useCarryOutGatePass,
} from "@/lib/network/api/gatePass.api";
import type {
  GatePass,
  GatePassStatus,
} from "@/lib/network/types/gatePass.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

type StatusFilter = "all" | GatePassStatus;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "declined", label: "Declined" },
  { id: "carried_out", label: "Carried out" },
];

const STATUS_META: Record<
  GatePassStatus,
  { label: string; tone: "success" | "warn" | "muted" | "danger" }
> = {
  pending: { label: "Pending approval", tone: "warn" },
  approved: { label: "Approved", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  carried_out: { label: "Carried out", tone: "muted" },
};

export default function GatePassPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isManager = canApprove(user?.role);
  const isSecurity = user?.role === "security";
  const canClear = isSecurity || user?.role === "admin";

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<GatePass | null>(null);
  const [note, setNote] = useState("");
  const [confirmCarry, setConfirmCarry] = useState(false);

  // per-item flag form at the gate
  const [flagFor, setFlagFor] = useState<number | null>(null);
  const [flagQty, setFlagQty] = useState("");
  const [flagNote, setFlagNote] = useState("");

  const { data, isLoading } = useGetGatePasses({
    page,
    pageSize,
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });
  const passes = data?.data ?? [];
  const pagination = data?.pagination;

  const approve = useApproveGatePass();
  const decline = useDeclineGatePass();
  const clearItem = useClearGatePassItem();
  const carryOut = useCarryOutGatePass();
  const deciding =
    approve.isPending ||
    decline.isPending ||
    clearItem.isPending ||
    carryOut.isPending;

  const open = (pass: GatePass) => {
    setSelected(pass);
    setNote("");
    setConfirmCarry(false);
    setFlagFor(null);
  };

  const refreshSelected = (res: { data?: GatePass }) => {
    setSelected(res.data ?? null);
    setFlagFor(null);
  };

  // the gate may only release after looking at every single line
  const checkedCount =
    selected?.items.filter((i) => i.clearance?.status).length ?? 0;
  const allChecked = !!selected && checkedCount === selected.items.length;
  const flaggedCount =
    selected?.items.filter((i) => i.clearance?.status === "flagged").length ??
    0;

  const openFlag = (i: number) => {
    setFlagFor(i);
    setFlagQty("");
    setFlagNote("");
  };

  const saveFlag = (i: number) => {
    if (!selected) return;
    clearItem.mutate(
      {
        id: selected._id,
        index: i,
        payload: {
          outcome: "flagged",
          seenQuantity: flagQty.trim() === "" ? undefined : Number(flagQty),
          note: flagNote.trim() || undefined,
        },
      },
      { onSuccess: refreshSelected },
    );
  };

  // security sees only what they may act on; hide the filters that
  // can never return anything for them
  const filters = isSecurity
    ? FILTERS.filter((f) => ["all", "approved", "carried_out"].includes(f.id))
    : FILTERS;

  const subtitle = isSecurity
    ? "Only management-approved passes appear here. Confirm before anything leaves."
    : isManager
      ? "Everything staff want to take out of company grounds, and who cleared it."
      : "Your requests to take company property out. Security releases only approved passes.";

  return (
    <>
      <PageMeta title="Gate Pass | KGR Console" />
      <PageHead
        eyebrow="EXIT AND RETURN"
        title="Gate Pass"
        subtitle={subtitle}
        actions={
          !isSecurity ? (
            <button
              type="button"
              onClick={() => navigate("/gate-pass/new")}
              className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={3} /> New gate pass
            </button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
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
        <div className="relative sm:w-[240px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Pass no, name or item"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full whitespace-nowrap border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {[
                "#",
                "DATE",
                "REQUESTED BY",
                "DEPARTMENT",
                "ITEMS",
                "EXIT AT",
                "STATUS",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {passes.map((pass) => (
              <tr
                key={pass._id}
                onClick={() => open(pass)}
                className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-haze"
              >
                <td className="px-5 py-3.5 text-[13.5px] font-extrabold tabular-nums text-ink">
                  #{pass.passId}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-fog">
                  {fmtDate(pass.date)}
                </td>
                <td className="px-5 py-3.5 text-[14px] font-extrabold text-ink">
                  {pass.requestedByName}
                </td>
                <td className="px-5 py-3.5 text-[13.5px] font-semibold text-bark">
                  {pass.department}
                </td>
                <td className="px-5 py-3.5 text-[13.5px] font-bold tabular-nums text-bark">
                  {pass.items.length}
                  {(() => {
                    const flagged = pass.items.filter(
                      (i) => i.clearance?.status === "flagged",
                    ).length;
                    return flagged > 0 ? (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-extrabold text-red-600">
                        {flagged} flagged
                      </span>
                    ) : null;
                  })()}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-bark">
                  {pass.exitAt}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={STATUS_META[pass.status].tone}
                    label={STATUS_META[pass.status].label}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {!isLoading && passes.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {isSecurity
                ? "No approved passes at the gate right now."
                : "No gate passes in this view."}
            </p>
          </div>
        )}
      </div>

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

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Gate pass #${selected.passId}` : ""}
        subtitle={
          selected
            ? `${selected.requestedByName} · ${fmtDate(selected.createdAt)} at ${fmtTime(selected.createdAt)}`
            : undefined
        }
        footer={
          selected && (
            <div className="flex flex-col gap-3">
              {isManager && selected.status === "pending" && (
                <>
                  <textarea
                    rows={2}
                    placeholder="Note for the requester (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={cn(inputClasses, "resize-y sm:text-[13.5px]")}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={deciding}
                      onClick={() =>
                        approve.mutate(
                          {
                            id: selected._id,
                            payload: { note: note || undefined },
                          },
                          { onSuccess: refreshSelected },
                        )
                      }
                      className="cta-gradient flex-1 cursor-pointer rounded-lg border-none px-4 py-2.5 text-[13.5px] font-extrabold text-forest-deep disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={deciding}
                      onClick={() =>
                        decline.mutate(
                          {
                            id: selected._id,
                            payload: { note: note || undefined },
                          },
                          { onSuccess: refreshSelected },
                        )
                      }
                      className="flex-1 cursor-pointer rounded-lg border border-line bg-white px-4 py-2.5 text-[13.5px] font-extrabold text-bark transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </>
              )}

              {canClear &&
                (confirmCarry && selected.status === "approved" ? (
                  <div className="flex flex-col gap-2.5 rounded-xl border border-brand-200 bg-brand-50 p-4">
                    <p className="m-0 text-[13px] font-semibold text-bark">
                      {flaggedCount > 0
                        ? `Confirm: releasing pass #${selected.passId}. ${flaggedCount} flagged ${flaggedCount === 1 ? "item stays" : "items stay"} behind and management will see why.`
                        : `Confirm: the ${selected.items.length} item${selected.items.length === 1 ? "" : "s"} on pass #${selected.passId} are physically leaving the gate now.`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={deciding}
                        onClick={() =>
                          carryOut.mutate(selected._id, {
                            onSuccess: refreshSelected,
                          })
                        }
                        className="cta-gradient flex-1 cursor-pointer rounded-lg border-none px-4 py-2.5 text-[13.5px] font-extrabold text-forest-deep disabled:opacity-50"
                      >
                        Yes, carried out
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCarry(false)}
                        className="flex-1 cursor-pointer rounded-lg border border-line bg-white px-4 py-2.5 text-[13.5px] font-bold text-bark"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={
                      selected.status !== "approved" || !allChecked || deciding
                    }
                    title={
                      selected.status === "pending"
                        ? "Not approved by management yet. Do not release."
                        : selected.status === "declined"
                          ? "Declined by management. Do not release."
                          : selected.status === "carried_out"
                            ? "Already carried out"
                            : !allChecked
                              ? "Clear or flag every item first"
                              : undefined
                    }
                    onClick={() => setConfirmCarry(true)}
                    className="cta-gradient flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none px-4 py-2.5 text-[13.5px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShieldCheck size={15} />
                    {selected.status === "approved" && !allChecked
                      ? `Check all items first (${checkedCount}/${selected.items.length})`
                      : "Mark carried out"}
                  </button>
                ))}
            </div>
          )
        }
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-haze p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-extrabold tracking-[1px] text-fog">
                  STATUS
                </span>
                <StatusPill
                  tone={STATUS_META[selected.status].tone}
                  label={STATUS_META[selected.status].label}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-[13px] font-semibold text-bark">
                <p className="m-0">
                  <span className="block text-[10.5px] font-extrabold tracking-[1px] text-fog">
                    DEPARTMENT
                  </span>
                  {selected.department}
                </p>
                {selected.designation && (
                  <p className="m-0">
                    <span className="block text-[10.5px] font-extrabold tracking-[1px] text-fog">
                      DESIGNATION
                    </span>
                    {selected.designation}
                  </p>
                )}
                <p className="m-0 col-span-2">
                  <span className="block text-[10.5px] font-extrabold tracking-[1px] text-fog">
                    PLANNED EXIT
                  </span>
                  {selected.exitAt}
                </p>
              </div>
            </div>

            {/* items, numbered like the paper form; the gate checks
                each line against what they can actually see */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-extrabold tracking-[1px] text-brand-600">
                ITEM DETAILS
                {selected.status === "approved" && canClear && (
                  <span className="ml-2 text-fog">
                    · {checkedCount}/{selected.items.length} CHECKED
                  </span>
                )}
              </span>
              <div className="overflow-hidden rounded-xl border border-line">
                {selected.items.map((item, i) => {
                  const cl = item.clearance;
                  const checking = canClear && selected.status === "approved";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "px-4 py-3",
                        i > 0 && "border-t border-line",
                        cl?.status === "cleared" && "bg-brand-50/40",
                        cl?.status === "flagged" && "bg-red-50/60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="m-0 text-[14px] font-extrabold text-ink">
                          {i + 1}. {item.description}
                          <span className="ml-2 rounded-full bg-haze px-2 py-0.5 text-[11.5px] font-bold text-bark">
                            qty {item.quantity}
                          </span>
                        </p>
                        {cl && (
                          <span
                            className={cn(
                              "flex-none rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                              cl.status === "cleared"
                                ? "bg-brand-50 text-brand-600"
                                : "bg-red-50 text-red-600",
                            )}
                          >
                            {cl.status === "cleared" ? "Cleared" : "Flagged"}
                          </span>
                        )}
                      </div>
                      <p className="m-0 mt-1 text-[12.5px] font-semibold text-fog">
                        {item.purpose && <>Purpose: {item.purpose}</>}
                        {item.purpose && item.location && " · "}
                        {item.location && <>Going to: {item.location}</>}
                        {!item.purpose && !item.location && "No details given"}
                      </p>
                      {cl && (
                        <p
                          className={cn(
                            "m-0 mt-1.5 text-[12px] font-semibold",
                            cl.status === "flagged"
                              ? "text-red-600"
                              : "text-fog",
                          )}
                        >
                          {cl.status === "flagged" &&
                            cl.seenQuantity !== undefined && (
                              <>
                                Seen {cl.seenQuantity} of {item.quantity} ·{" "}
                              </>
                            )}
                          {cl.note && <>{cl.note} · </>}
                          {cl.byName}
                          {cl.at && <> at {fmtTime(cl.at)}</>}
                        </p>
                      )}
                      {checking && flagFor !== i && (
                        <div className="mt-2.5 flex gap-2">
                          <button
                            type="button"
                            disabled={deciding}
                            onClick={() =>
                              clearItem.mutate(
                                {
                                  id: selected._id,
                                  index: i,
                                  payload: { outcome: "cleared" },
                                },
                                { onSuccess: refreshSelected },
                              )
                            }
                            className={cn(
                              "flex-1 cursor-pointer rounded-lg border px-3 py-2 text-[12.5px] font-extrabold transition-colors disabled:opacity-50",
                              cl?.status === "cleared"
                                ? "border-transparent bg-brand-500 text-white"
                                : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
                            )}
                          >
                            ✓ {cl?.status === "cleared" ? "Cleared" : "Clear"}
                          </button>
                          <button
                            type="button"
                            disabled={deciding}
                            onClick={() => openFlag(i)}
                            className={cn(
                              "flex-1 cursor-pointer rounded-lg border px-3 py-2 text-[12.5px] font-extrabold transition-colors disabled:opacity-50",
                              cl?.status === "flagged"
                                ? "border-transparent bg-red-600 text-white"
                                : "border-line bg-white text-bark hover:border-red-300 hover:text-red-600",
                            )}
                          >
                            {cl?.status === "flagged" ? "Flagged" : "Flag"}
                          </button>
                        </div>
                      )}
                      {checking && flagFor === i && (
                        <div className="mt-2.5 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="m-0 text-[12px] font-bold text-red-600">
                            What did you actually see? This item will be held
                            back.
                          </p>
                          <input
                            type="number"
                            min={0}
                            placeholder={`Quantity seen (listed: ${item.quantity})`}
                            value={flagQty}
                            onChange={(e) => setFlagQty(e.target.value)}
                            className={cn(inputClasses, "sm:text-[13px]")}
                          />
                          <input
                            type="text"
                            placeholder="Note (different item, damaged...)"
                            value={flagNote}
                            onChange={(e) => setFlagNote(e.target.value)}
                            className={cn(inputClasses, "sm:text-[13px]")}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={
                                deciding ||
                                (flagQty.trim() === "" &&
                                  flagNote.trim() === "")
                              }
                              onClick={() => saveFlag(i)}
                              className="flex-1 cursor-pointer rounded-lg border-none bg-red-600 px-3 py-2 text-[12.5px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Flag item
                            </button>
                            <button
                              type="button"
                              onClick={() => setFlagFor(null)}
                              className="flex-1 cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-[12.5px] font-bold text-bark"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* the trail: who decided, who released */}
            {(selected.decidedAt || selected.carriedOutAt) && (
              <div className="flex flex-col gap-2 rounded-xl border border-line p-4 text-[13px] font-semibold text-bark">
                {selected.decidedAt && (
                  <p className="m-0">
                    {selected.status === "declined" ? "Declined" : "Approved"}{" "}
                    by <strong>{selected.decidedByName}</strong> on{" "}
                    {fmtDate(selected.decidedAt)} at{" "}
                    {fmtTime(selected.decidedAt)}
                  </p>
                )}
                {selected.decisionNote && (
                  <p className="m-0 text-fog">Note: {selected.decisionNote}</p>
                )}
                {selected.carriedOutAt && (
                  <p className="m-0">
                    Carried out past <strong>{selected.carriedOutByName}</strong>{" "}
                    on {fmtDate(selected.carriedOutAt)} at{" "}
                    {fmtTime(selected.carriedOutAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
