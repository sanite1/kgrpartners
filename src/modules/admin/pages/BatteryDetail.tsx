import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import {
  useGetBatteryDetails,
  useGetBatteryMovements,
  useSetBatteryStatus,
  useUpdateBattery,
} from "@/lib/network/api/battery.api";
import type { BatteryStatus } from "@/lib/network/types/battery.types";
import { LOCATION_LABEL } from "../components/exitform/meta";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canManageStock } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

type PillTone = "success" | "warn" | "muted" | "danger";

const STATUS_META: Record<BatteryStatus, { label: string; tone: PillTone }> = {
  active: { label: "Active", tone: "success" },
  faulty: { label: "Faulty", tone: "danger" },
  charging: { label: "Charging", tone: "warn" },
  fully_charged: { label: "Fully charged", tone: "success" },
  not_charged: { label: "Not charged", tone: "warn" },
  not_in_use: { label: "Not in use", tone: "muted" },
};

const STATUS_OPTIONS = Object.entries(STATUS_META).map(
  ([value, meta]) => [value as BatteryStatus, meta.label] as const,
);

const metaFor = (status: string): { label: string; tone: PillTone } =>
  STATUS_META[status as BatteryStatus] ?? {
    label: status.replace(/_/g, " "),
    tone: "muted",
  };

const SESSION_LABEL: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
};

const CLOSING_SHEET_LABEL: Record<string, string> = {
  main: "Battery Closing",
  muhd_kamila: "Muh'd & Kamila House",
  main_yard: "Main Yard",
  ubs: "UBS",
};

const MOVE_LABEL: Record<string, string> = {
  issue: "Issued",
  collect: "Collected",
  status: "Status",
};

const sectionCard =
  "overflow-hidden rounded-2xl border border-line bg-white";
const sectionHead =
  "border-b border-line bg-haze px-5 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog";
const th =
  "whitespace-nowrap px-4 py-2.5 text-[10.5px] font-extrabold tracking-[1.2px] text-fog";
const td = "whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold text-bark";

// One pack's whole story: what it is, where it is, its trips, its
// attendance, its closing sheets, its swaps and its movements - with
// every action from the batteries table available right here.
export default function BatteryDetail() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { user } = useAuthStore();
  const canStock = canManageStock(user?.role);

  const { data, isLoading } = useGetBatteryDetails(id);
  const details = data?.data;
  const battery = details?.battery;

  const [movePage, setMovePage] = useState(1);
  const { data: movesData } = useGetBatteryMovements(id, movePage);
  const movements = movesData?.data ?? [];
  const movePagination = movesData?.pagination;

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editCode, setEditCode] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editActive, setEditActive] = useState(true);

  const setStatus = useSetBatteryStatus();
  const updateBattery = useUpdateBattery();

  const openEdit = () => {
    if (!battery) return;
    setEditCode(battery.code);
    setEditNotes(battery.notes ?? "");
    setEditActive(battery.isActive);
    setEditOpen(true);
  };

  return (
    <>
      <PageMeta title={`${battery?.code ?? "Battery"} | KGR Console`} />
      <PageHead
        eyebrow="FLEET POWER"
        title={battery?.code ?? "Battery"}
        subtitle={
          battery
            ? `${metaFor(battery.status).label}${details?.lastSeen ? ` · last seen on ${details.lastSeen.busName} (${details.lastSeen.source}, ${fmtDate(details.lastSeen.date)})` : " · not sighted this week"} · ${LOCATION_LABEL[battery.location] ?? battery.location}${battery.isActive ? "" : " · RETIRED"}`
            : "Loading the pack's record."
        }
        actions={
          <button
            type="button"
            onClick={() => navigate("/batteries")}
            className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
          >
            <ArrowLeft size={15} /> All batteries
          </button>
        }
      />

      {/* every action the table offers, in one bar */}
      {canStock && battery && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <select
            aria-label="Set status"
            value={battery.status}
            disabled={setStatus.isPending}
            onChange={(e) =>
              setStatus.mutate({
                id: battery._id,
                payload: { to: e.target.value as BatteryStatus },
              })
            }
            className={cn(inputClasses, "w-auto py-2.5 sm:text-[13.5px]")}
          >
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openEdit}
            className="cursor-pointer rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
          >
            Edit
          </button>
        </div>
      )}

      {/* the pack in numbers */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-ink">
            {details?.trips.today.trips ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            TRIPS TODAY
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-ink">
            {details?.trips.thisMonth.trips ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            TRIPS THIS MONTH
          </span>
        </div>
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          <span className="block text-[24px] font-extrabold leading-none text-neon">
            {details?.trips.allTime.trips ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            TRIPS ALL TIME
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-ink">
            {details?.trips.allTime.receipts ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            RECEIPTS ALL TIME
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}

      {!isLoading && details && (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          {/* attendance history */}
          <div className={sectionCard}>
            <div className={sectionHead}>ATTENDANCE · LAST 30 MARKS</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>DATE</th>
                    <th className={th}>TIME</th>
                    <th className={th}>LOG</th>
                    <th className={th}>STATUS</th>
                    <th className={th}>DETAIL</th>
                    <th className={th}>BY</th>
                  </tr>
                </thead>
                <tbody>
                  {details.attendance.map((a) => (
                    <tr
                      key={a._id}
                      className={cn(
                        "border-b border-line last:border-0",
                        a.status === "missing" && "bg-red-50/60",
                      )}
                    >
                      <td className={cn(td, "font-extrabold text-ink")}>
                        {fmtDate(a.date)}
                      </td>
                      <td className={td}>
                        {SESSION_LABEL[a.timeOfDay] ?? a.timeOfDay}
                      </td>
                      <td className={cn(td, "tabular-nums text-fog")}>
                        #{a.logId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                            a.status === "seen"
                              ? "bg-brand-50 text-brand-600"
                              : "bg-red-50 text-red-600",
                          )}
                        >
                          {a.status === "seen" ? "Seen" : "MISSING"}
                        </span>
                      </td>
                      <td className={td}>
                        {a.status === "seen"
                          ? a.location
                            ? (LOCATION_LABEL[a.location] ?? a.location)
                            : a.onBus
                              ? `On ${a.onBus} (auto)`
                              : "-"
                          : a.lastSeen || "-"}
                      </td>
                      <td className={cn(td, "text-fog")}>
                        {a.submittedByName || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {details.attendance.length === 0 && (
              <p className="m-0 px-5 py-8 text-center text-[13.5px] font-semibold text-fog">
                Never called on an attendance register yet.
              </p>
            )}
          </div>

          {/* trips = receipts naming this pack */}
          <div className={sectionCard}>
            <div className={sectionHead}>TRIPS · LAST 15 RECEIPTS</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>DATE</th>
                    <th className={th}>RECEIPT NO</th>
                    <th className={th}>BUS</th>
                    <th className={th}>TRIPS</th>
                  </tr>
                </thead>
                <tbody>
                  {details.receipts.map((r) => (
                    <tr key={r._id} className="border-b border-line last:border-0">
                      <td className={cn(td, "font-extrabold text-ink")}>
                        {fmtDate(r.date)}
                      </td>
                      <td className={cn(td, "tabular-nums")}>#{r.billId}</td>
                      <td className={td}>{r.busNumber}</td>
                      <td className={cn(td, "font-extrabold text-ink")}>
                        {r.expectedTrips}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {details.receipts.length === 0 && (
              <p className="m-0 px-5 py-8 text-center text-[13.5px] font-semibold text-fog">
                No receipts name this pack yet.
              </p>
            )}
          </div>

          {/* closing sheet appearances */}
          <div className={sectionCard}>
            <div className={sectionHead}>CLOSING SHEETS · LAST 30 DAYS</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>DATE</th>
                    <th className={th}>SHEET</th>
                    <th className={th}>LOCATION</th>
                    <th className={th}>%</th>
                    <th className={th}>VOLTAGE</th>
                    <th className={th}>WORKED</th>
                  </tr>
                </thead>
                <tbody>
                  {details.closings.map((c) => (
                    <tr key={c._id} className="border-b border-line last:border-0">
                      <td className={cn(td, "font-extrabold text-ink")}>
                        {fmtDate(c.date)}
                      </td>
                      <td className={td}>
                        {CLOSING_SHEET_LABEL[c.sheet ?? "main"] ?? c.sheet}
                      </td>
                      <td className={td}>
                        {LOCATION_LABEL[c.location] ?? c.location}
                      </td>
                      <td className={cn(td, "tabular-nums")}>{c.percent}%</td>
                      <td className={cn(td, "tabular-nums")}>{c.voltage}V</td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                            c.worked
                              ? "bg-brand-50 text-brand-600"
                              : "bg-[#FDF6E3] text-solar-700",
                          )}
                        >
                          {c.worked ? "Worked" : "Not yet"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {details.closings.length === 0 && (
              <p className="m-0 px-5 py-8 text-center text-[13.5px] font-semibold text-fog">
                Not on any closing sheet in the last 30 days.
              </p>
            )}
          </div>

          {/* swaps involving this pack */}
          <div className={sectionCard}>
            <div className={sectionHead}>SWAPS · LAST 10</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>DATE</th>
                    <th className={th}>BUS</th>
                    <th className={th}>DIRECTION</th>
                    <th className={th}>SWAPPED WITH</th>
                    <th className={th}>BY</th>
                  </tr>
                </thead>
                <tbody>
                  {details.swaps.map((sw) => (
                    <tr
                      key={sw._id}
                      className="border-b border-line last:border-0"
                    >
                      <td className={cn(td, "font-extrabold text-ink")}>
                        {fmtDate(sw.createdAt)}
                      </td>
                      <td className={td}>{sw.busNumber}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                            sw.role === "went_on"
                              ? "bg-brand-50 text-brand-600"
                              : "bg-mist text-bark",
                          )}
                        >
                          {sw.role === "went_on" ? "Went on" : "Came off"}
                        </span>
                      </td>
                      <td className={td}>
                        {sw.role === "went_on"
                          ? sw.initialBatteryCode
                          : sw.suppliedBatteryCode}
                      </td>
                      <td className={cn(td, "text-fog")}>{sw.byName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {details.swaps.length === 0 && (
              <p className="m-0 px-5 py-8 text-center text-[13.5px] font-semibold text-fog">
                No swaps involve this pack yet.
              </p>
            )}
          </div>

          {/* movement log */}
          <div className={cn(sectionCard, "xl:col-span-2")}>
            <div className={sectionHead}>MOVEMENT LOG</div>
            <div className="flex flex-col gap-2 p-4">
              {movements.map((m) => {
                const who = m.by as { firstName?: string; lastName?: string };
                return (
                  <div
                    key={m._id}
                    className="rounded-xl border border-line bg-haze px-4 py-3"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="text-[13.5px] font-extrabold text-ink">
                        {MOVE_LABEL[m.action] ?? m.action}:{" "}
                        {metaFor(m.fromStatus).label} →{" "}
                        {metaFor(m.toStatus).label}
                        {m.busNumber ? ` (${m.busNumber})` : ""}
                      </span>
                      <span className="shrink-0 text-[12px] font-semibold text-fog sm:text-right">
                        {fmtDate(m.createdAt)} · {fmtTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="m-0 mt-0.5 text-[12.5px] font-semibold text-fog">
                      {who?.firstName} {who?.lastName}
                      {m.note ? ` · ${m.note}` : ""}
                    </p>
                  </div>
                );
              })}
              {movements.length === 0 && (
                <p className="m-0 py-6 text-center text-[13.5px] font-semibold text-fog">
                  No movements yet.
                </p>
              )}
              {movePagination && movePagination.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={movePage <= 1}
                    onClick={() => setMovePage((p) => p - 1)}
                    className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-[12.5px] font-semibold text-fog">
                    {movePage} / {movePagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={movePage >= movePagination.totalPages}
                    onClick={() => setMovePage((p) => p + 1)}
                    className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !details && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            Battery not found.
          </p>
        </div>
      )}

      {/* edit */}
      <Modal
        title={battery ? `Edit ${battery.code}` : "Edit"}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      >
        {battery && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bd-edit-code" className={labelClasses}>
                Battery code <span className="text-brand-500">*</span>
              </label>
              <input
                id="bd-edit-code"
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bd-edit-notes" className={labelClasses}>
                Notes
              </label>
              <textarea
                id="bd-edit-notes"
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className={cn(inputClasses, "resize-y")}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-bold text-ink">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="h-4 w-4 accent-[#0FA53A]"
              />
              In the fleet (untick to retire)
            </label>
            <button
              type="button"
              disabled={updateBattery.isPending || editCode.trim().length < 2}
              onClick={() =>
                updateBattery.mutate(
                  {
                    id: battery._id,
                    payload: {
                      code: editCode.trim(),
                      notes: editNotes,
                      isActive: editActive,
                    },
                  },
                  { onSuccess: () => setEditOpen(false) },
                )
              }
              className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateBattery.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
