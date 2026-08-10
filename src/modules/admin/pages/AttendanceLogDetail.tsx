import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import ConfirmModal from "../components/console/ConfirmModal";
import {
  useGetAttendanceLog,
  useDeleteAttendanceLog,
} from "@/lib/network/api/batteryAttendance.api";
import type { AttendanceTimeOfDay } from "@/lib/network/types/batteryAttendance.types";
import { LOCATION_LABEL } from "../components/exitform/meta";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { isAdminRole } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

const TIME_LABEL: Record<AttendanceTimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
};

type RowFilter = "all" | "seen" | "missing" | "unmarked";

const ROW_FILTERS: { id: RowFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "seen", label: "Seen" },
  { id: "missing", label: "Missing" },
  { id: "unmarked", label: "Unmarked" },
];

const thClasses =
  "whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog";

// One submitted roll call, read only: every pack's verdict as the
// submitter recorded it. Wrong logs are deleted (admin), never edited.
export default function AttendanceLogDetail() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);

  const [filter, setFilter] = useState<RowFilter>("all");
  const [search, setSearch] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useGetAttendanceLog(id);
  const log = data?.data;
  const rows = log?.rows ?? [];

  const deleteLog = useDeleteAttendanceLog();

  const matches = (code: string) =>
    !search || code.toUpperCase().includes(search.trim().toUpperCase());

  const visibleRows = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    return matches(r.batteryCode);
  });

  // packs the submitter never called, listed after the marked ones
  const visibleUnmarked =
    filter === "all" || filter === "unmarked"
      ? (log?.unmarked ?? []).filter((u) => matches(u.batteryCode))
      : [];

  return (
    <>
      <PageMeta
        title={`Attendance ${log ? `#${log.logId}` : ""} | KGR Console`}
      />
      <PageHead
        eyebrow="FLEET ROLL-CALL"
        title={log ? `Attendance #${log.logId}` : "Attendance"}
        subtitle={
          log
            ? `${fmtDate(log.date)} · logged by ${log.submittedByName} at ${fmtTime(log.createdAt)}`
            : "Loading the roll call."
        }
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && log && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-red-600 transition-colors hover:border-red-300"
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/battery-attendance")}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              <ArrowLeft size={15} /> All logs
            </button>
          </div>
        }
      />

      {/* the log in numbers */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          <span className="block text-[24px] font-extrabold leading-none text-neon">
            {log?.totals.fleet ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            FLEET
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-brand-600">
            {log?.totals.seen ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            SEEN{(log?.totals.auto ?? 0) > 0 && ` · ${log?.totals.auto} AUTO`}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-4",
            (log?.totals.missing ?? 0) > 0
              ? "border-red-200 bg-red-50"
              : "border-line bg-white",
          )}
        >
          <span
            className={cn(
              "block text-[24px] font-extrabold leading-none",
              (log?.totals.missing ?? 0) > 0 ? "text-red-600" : "text-ink",
            )}
          >
            {log?.totals.missing ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            MISSING
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-4",
            (log?.totals.unmarked ?? 0) > 0
              ? "border-solar/40 bg-[#FDF6E3]"
              : "border-line bg-white",
          )}
        >
          <span
            className={cn(
              "block text-[24px] font-extrabold leading-none",
              (log?.totals.unmarked ?? 0) > 0 ? "text-solar-700" : "text-ink",
            )}
          >
            {log?.totals.unmarked ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            UNMARKED
          </span>
        </div>
      </div>

      {/* filters and search */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {ROW_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                filter === f.id
                  ? "cta-gradient border-transparent text-forest-deep"
                  : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-[190px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Search battery"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-haze">
                {["S/N", "BATTERY", "STATUS", "TIME", "DETAIL"].map((h) => (
                  <th key={h} className={thClasses}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r, i) => (
                <tr
                  key={r.battery}
                  className={cn(
                    "border-b border-line last:border-0",
                    r.status === "missing" && "bg-red-50/60",
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold tabular-nums text-fog">
                    {i + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                    {r.batteryCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                        r.status === "seen"
                          ? "bg-brand-50 text-brand-600"
                          : "bg-red-50 text-red-600",
                      )}
                    >
                      {r.status === "seen" ? "Seen" : "MISSING"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                    {TIME_LABEL[r.timeOfDay] ?? r.timeOfDay}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-bark">
                    {r.status === "seen" ? (
                      r.location ? (
                        LOCATION_LABEL[r.location]
                      ) : r.onBus ? (
                        <>
                          On {r.onBus}{" "}
                          <span className="text-[11px] font-bold text-fog">
                            auto
                          </span>
                        </>
                      ) : (
                        "-"
                      )
                    ) : r.lastSeen ? (
                      `Last seen: ${r.lastSeen}`
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {visibleUnmarked.map((u, i) => (
                <tr
                  key={u.battery}
                  className="border-b border-line bg-[#FDF6E3]/40 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold tabular-nums text-fog">
                    {visibleRows.length + i + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                    {u.batteryCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-[#FDF6E3] px-2.5 py-1 text-[11.5px] font-extrabold text-solar-700">
                      Not called
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                    -
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                    -
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {!isLoading && !log && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              Attendance log not found.
            </p>
          </div>
        )}

        {!isLoading &&
          log &&
          visibleRows.length === 0 &&
          visibleUnmarked.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              Nothing matches this filter.
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Delete this log?"
        message={
          <>
            Delete attendance <strong>#{log?.logId}</strong> by{" "}
            <strong>{log?.submittedByName}</strong> (
            {log ? fmtDate(log.date) : ""})? This cannot be undone.
          </>
        }
        confirmLabel="Yes, delete"
        loading={deleteLog.isPending}
        onConfirm={() =>
          log &&
          deleteLog.mutate(log._id, {
            onSuccess: () => navigate("/battery-attendance"),
          })
        }
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
