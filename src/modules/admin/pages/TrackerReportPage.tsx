import { useState } from "react";
import {
  ArrowLeft,
  ClipboardPaste,
  Copy,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useParseTrackerText,
  useCreateTrackerReport,
  useGetTrackerReports,
  useGetTrackerReport,
  useGetMileageSummary,
} from "@/lib/network/api/trackerReport.api";
import { useGetBuses } from "@/lib/network/api/bus.api";
import type {
  ParsedRow,
  TrackerSummary,
} from "@/lib/network/types/trackerReport.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

const EXAMPLE = `Here is my report for 20:07:2026

Bus A1
Status: Active
Start Time: 03:10:41
End Time: 23:59:59
Mileage: 147.133Km
Route:

Bus A3
Status: Active
Start Time: 00:00:10
End Time: 23:59:55
Mileage: 213.885Km
Route:`;

interface GridRow {
  busId?: string;
  busNumber: string;
  status: string;
  startTime: string;
  endTime: string;
  mileage: string; // string while editing
  issues: string[];
}

const smallBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600";

const cellInput =
  "w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-base font-bold text-bark transition-colors focus:border-brand-500 focus:outline-none sm:text-[12.5px]";

// renders the operator-style summary message for a saved report
const summaryText = (date: string, s: TrackerSummary): string =>
  [
    `Bus Trackers Summary ${fmtDate(date)}`,
    "",
    `Total Devices = ${s.totalDevices}`,
    `Active = ${s.activeCount}`,
    `Total Mileage = ${s.totalMileageKm}Km`,
    `Not Active with trackers: ${s.notActiveTracked.length}${
      s.notActiveTracked.length ? ` (${s.notActiveTracked.join(", ")})` : ""
    }`,
    `Not Active No Tracker: ${s.noTracker.length}${
      s.noTracker.length ? ` (${s.noTracker.join(", ")})` : ""
    }`,
    `No 12 volts/Data: ${s.badTracker.length}${
      s.badTracker.length ? ` (${s.badTracker.join(", ")})` : ""
    }`,
  ].join("\n");

const SummaryCard = ({
  date,
  summary,
}: {
  date: string;
  summary: TrackerSummary;
}) => (
  <div className="rounded-2xl border border-line bg-white p-5">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] font-extrabold tracking-[1.5px] text-fog">
        TRACKER SUMMARY
      </span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard
            .writeText(summaryText(date, summary))
            .then(() => toast.success("Summary copied"));
        }}
        className={smallBtn}
      >
        <span className="flex items-center gap-1.5">
          <Copy size={13} /> Copy as message
        </span>
      </button>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div>
        <div className="text-[20px] font-extrabold leading-none text-ink">
          {summary.totalDevices}
        </div>
        <div className="mt-1 text-[10.5px] font-extrabold tracking-[1px] text-fog">
          TOTAL DEVICES
        </div>
      </div>
      <div>
        <div className="text-[20px] font-extrabold leading-none text-brand-600">
          {summary.activeCount}
        </div>
        <div className="mt-1 text-[10.5px] font-extrabold tracking-[1px] text-fog">
          ACTIVE
        </div>
      </div>
      <div>
        <div className="text-[20px] font-extrabold leading-none text-ink">
          {Math.round(summary.totalMileageKm).toLocaleString()} km
        </div>
        <div className="mt-1 text-[10.5px] font-extrabold tracking-[1px] text-fog">
          TOTAL MILEAGE
        </div>
      </div>
    </div>
    <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3.5 text-[13px] font-semibold text-bark">
      <p className="m-0">
        <strong>
          Not active with tracker ({summary.notActiveTracked.length}):
        </strong>{" "}
        {summary.notActiveTracked.join(", ") || "none"}
      </p>
      <p className="m-0">
        <strong>No tracker ({summary.noTracker.length}):</strong>{" "}
        {summary.noTracker.join(", ") || "none"}
      </p>
      <p className="m-0">
        <strong>No 12V / no data ({summary.badTracker.length}):</strong>{" "}
        {summary.badTracker.join(", ") || "none"}
      </p>
    </div>
  </div>
);

// One saved report, opened from history (managers).
const ReportDetail = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const { data, isLoading } = useGetTrackerReport(id);
  const report = data?.data;

  return (
    <>
      <div className="mb-4">
        <button type="button" onClick={onBack} className={smallBtn}>
          <span className="flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to history
          </span>
        </button>
      </div>
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}
      {report && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[18px] font-extrabold text-ink">
                Report #{report.reportId} · {fmtDate(report.date)}
              </span>
              <p className="m-0 mt-0.5 text-[13px] font-semibold text-fog">
                Submitted by {report.submittedByName || "—"} on{" "}
                {fmtDate(report.createdAt)} · {fmtTime(report.createdAt)}
              </p>
            </div>
          </div>

          <SummaryCard date={report.date} summary={report.summary} />

          {(report.crossCheck.movedNoReceipt.length > 0 ||
            report.crossCheck.receiptNoMovement.length > 0) && (
            <div className="rounded-2xl border border-solar/40 bg-[#FDF6E3] p-5">
              <span className="flex items-center gap-2 text-[13px] font-extrabold text-solar-700">
                <TriangleAlert size={16} /> RECEIPT CROSS-CHECK
              </span>
              {report.crossCheck.movedNoReceipt.length > 0 && (
                <p className="m-0 mt-2.5 text-[13px] font-semibold text-solar-700">
                  <strong>Moved but no receipt:</strong>{" "}
                  {report.crossCheck.movedNoReceipt
                    .map((b) => `${b.busNumber} (${b.mileageKm}km)`)
                    .join(", ")}
                </p>
              )}
              {report.crossCheck.receiptNoMovement.length > 0 && (
                <p className="m-0 mt-1.5 text-[13px] font-semibold text-solar-700">
                  <strong>Receipt but no movement:</strong>{" "}
                  {report.crossCheck.receiptNoMovement.join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-haze">
                    {["BUS", "STATUS", "START", "END", "MILEAGE"].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    <tr
                      key={row.busNumber + i}
                      className="border-b border-line last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-[13.5px] font-extrabold text-ink">
                        {row.busNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold capitalize text-bark">
                        {row.status}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold tabular-nums text-bark">
                        {row.startTime || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold tabular-nums text-bark">
                        {row.endTime || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[13.5px] font-extrabold tabular-nums text-ink">
                        {row.mileageKm} km
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function TrackerReportPage() {
  const { user } = useAuthStore();
  const isManager = canApprove(user?.role);

  const [tab, setTab] = useState<"new" | "history" | "mileage">(() =>
    isManager ? "history" : "new",
  );

  // new-report state
  const [method, setMethod] = useState<"paste" | "manual">("paste");
  const [rawText, setRawText] = useState("");
  const [date, setDate] = useState("");
  // each input method keeps its own rows so switching never mixes them
  const [pasteRows, setPasteRows] = useState<GridRow[]>([]);
  const [manualRows, setManualRows] = useState<GridRow[]>([]);
  const rows = method === "paste" ? pasteRows : manualRows;
  const setRows = method === "paste" ? setPasteRows : setManualRows;
  const [reportIssues, setReportIssues] = useState<string[]>([]);
  const [askReplace, setAskReplace] = useState(false);

  // history state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [openReport, setOpenReport] = useState<string | null>(null);

  // mileage state
  const [month, setMonth] = useState("");

  const parseText = useParseTrackerText();
  const createReport = useCreateTrackerReport();

  const { data: historyData, isLoading: historyLoading } = useGetTrackerReports(
    { page, pageSize },
    { enabled: isManager && tab === "history" },
  );
  const reports = historyData?.data ?? [];

  const { data: mileageData, isLoading: mileageLoading } = useGetMileageSummary(
    month || undefined,
    {
      enabled: isManager && tab === "mileage",
    },
  );
  const mileage = mileageData?.data;

  const { data: busData } = useGetBuses(
    { isActive: "true", pageSize: 100 },
    { enabled: tab === "new" },
  );
  const activeBuses = busData?.data ?? [];

  const handleParse = () => {
    if (rawText.trim().length < 10) return;
    parseText.mutate(rawText, {
      onSuccess: (res) => {
        const parsed = res.data;
        if (!parsed) return;
        setDate(parsed.date);
        setReportIssues([
          ...(parsed.dateDetected
            ? []
            : ["No date detected; confirm the date below"]),
          ...parsed.issues,
        ]);
        setPasteRows(
          parsed.rows.map((r: ParsedRow) => ({
            busId: r.busId,
            busNumber: r.busNumber,
            status: r.status,
            startTime: r.startTime,
            endTime: r.endTime,
            mileage: String(r.mileageKm),
            issues: r.issues,
          })),
        );
        toast.success(
          `${parsed.parsedCount} buses parsed, ${parsed.matchedCount} matched`,
        );
      },
    });
  };

  const setRow = (i: number, patch: Partial<GridRow>) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        busNumber: "",
        status: "active",
        startTime: "",
        endTime: "",
        mileage: "",
        issues: [],
      },
    ]);

  const removeRow = (i: number) =>
    setRows((prev) => prev.filter((_, idx) => idx !== i));

  const validRows = rows.filter(
    (r) => r.busNumber.trim() && !Number.isNaN(Number(r.mileage)),
  );

  const submit = (replace: boolean) => {
    if (!date || validRows.length === 0) return;
    // catch impossible figures here, with the row named, instead of a
    // server rejection after the whole report is typed
    const bad = validRows.findIndex((r) => Number(r.mileage) > 10000);
    if (bad !== -1) {
      toast.error(
        `Row ${bad + 1} (${validRows[bad].busNumber || "no bus"}): ${validRows[bad].mileage} km in one day cannot be right. Correct the mileage.`,
      );
      return;
    }
    setAskReplace(false);
    createReport.mutate(
      {
        date,
        replace,
        rawText: rawText || undefined,
        rows: validRows.map((r) => ({
          busId: r.busId,
          busNumber: r.busNumber.trim(),
          status: r.status || undefined,
          startTime: /^\d{2}:\d{2}:\d{2}$/.test(r.startTime)
            ? r.startTime
            : undefined,
          endTime: /^\d{2}:\d{2}:\d{2}$/.test(r.endTime)
            ? r.endTime
            : undefined,
          mileageKm: Math.max(0, Number(r.mileage) || 0),
        })),
      },
      {
        onSuccess: () => {
          setRawText("");
          setRows([]);
          setReportIssues([]);
          setDate("");
        },
        onError: (error) => {
          if (error.response?.status === 409) setAskReplace(true);
        },
      },
    );
  };

  return (
    <>
      <PageMeta title="Tracker Report | KGR Console" />
      <PageHead
        eyebrow="FLEET TRACKING"
        title="Tracker Report"
        subtitle="Paste the day's tracker message; the system does the typing."
        actions={
          isManager ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTab("history");
                  setOpenReport(null);
                }}
                className={cn(
                  smallBtn,
                  tab === "history" && "border-brand-500 text-brand-600",
                )}
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setTab("mileage")}
                className={cn(
                  smallBtn,
                  tab === "mileage" && "border-brand-500 text-brand-600",
                )}
              >
                Mileage
              </button>
              <button
                type="button"
                onClick={() => setTab("new")}
                className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
              >
                <Plus size={16} strokeWidth={3} /> New report
              </button>
            </div>
          ) : undefined
        }
      />

      {/* NEW REPORT */}
      {tab === "new" && (
        <div className="flex flex-col gap-5">
          {/* input method: one at a time */}
          <div className="flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
            {(
              [
                ["paste", "Paste message"],
                ["manual", "Enter manually"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMethod(value);
                  // manual entry starts with a first row ready to fill
                  if (value === "manual" && manualRows.length === 0) {
                    setManualRows([
                      {
                        busNumber: "",
                        status: "active",
                        startTime: "",
                        endTime: "",
                        mileage: "",
                        issues: [],
                      },
                    ]);
                  }
                }}
                className={cn(
                  "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
                  method === value
                    ? "cta-gradient text-forest-deep"
                    : "bg-transparent text-fog hover:text-bark",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {method === "paste" && (
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="tr-paste" className={labelClasses}>
                  Paste the tracker message
                </label>
                <textarea
                  id="tr-paste"
                  rows={12}
                  placeholder={EXAMPLE}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className={cn(
                    inputClasses,
                    "resize-y font-mono sm:text-[13px]",
                  )}
                />
                <button
                  type="button"
                  disabled={rawText.trim().length < 10 || parseText.isPending}
                  onClick={handleParse}
                  className="cta-gradient flex w-fit cursor-pointer items-center gap-2 rounded-[10px] border-none px-6 py-3 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ClipboardPaste size={15} />
                  {parseText.isPending ? "Reading…" : "Parse message"}
                </button>
              </div>
              <div className="rounded-2xl border border-line bg-haze p-5">
                <span className="text-[12px] font-extrabold tracking-[1.5px] text-fog">
                  THE FORMAT TO FOLLOW
                </span>
                <pre className="m-0 mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[12.5px] font-semibold leading-relaxed text-bark">
                  {EXAMPLE}
                </pre>
                <p className="m-0 mt-2 text-[12px] font-semibold text-fog">
                  Small mistakes are fine: extra spaces, lowercase, km or Km,
                  and : - or = after labels all parse. Prefer typing it in
                  yourself? Switch to "Enter manually" above.
                </p>
              </div>
            </div>
          )}

          {reportIssues.length > 0 && (
            <div className="rounded-2xl border border-solar/40 bg-[#FDF6E3] px-5 py-4">
              {reportIssues.map((issue, i) => (
                <p
                  key={i}
                  className="m-0 flex items-center gap-2 text-[13px] font-semibold text-solar-700"
                >
                  <TriangleAlert size={14} className="flex-none" /> {issue}
                </p>
              ))}
            </div>
          )}

          {(method === "manual" || rows.length > 0) && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tr-date" className={labelClasses}>
                Report date <span className="text-brand-500">*</span>
              </label>
              <input
                id="tr-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(inputClasses, "w-fit")}
              />
            </div>
          )}

          {/* mobile: one card per bus, no sideways typing */}
          {rows.length > 0 && (
            <div className="flex flex-col gap-3 sm:hidden">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl border border-line bg-white p-4",
                    !row.busId &&
                      row.busNumber &&
                      "border-solar/50 bg-[#FDF6E3]/60",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-haze text-[12px] font-extrabold tabular-nums text-fog">
                      {i + 1}
                    </span>
                    <select
                      aria-label={`Bus for entry ${i + 1}`}
                      value={row.busId ?? ""}
                      onChange={(e) => {
                        const bus = activeBuses.find(
                          (b) => b._id === e.target.value,
                        );
                        setRow(i, {
                          busId: bus?._id,
                          busNumber: bus?.number ?? row.busNumber,
                          issues: [],
                        });
                      }}
                      className={cn(cellInput, "flex-1 cursor-pointer py-2.5")}
                    >
                      <option value="">
                        {row.busNumber
                          ? `${row.busNumber} (unmatched)`
                          : "Pick bus"}
                      </option>
                      {activeBuses.map((bus) => (
                        <option key={bus._id} value={bus._id}>
                          {bus.number}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={`Remove entry ${i + 1}`}
                      onClick={() => removeRow(i)}
                      className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                        START TIME
                      </span>
                      <input
                        aria-label={`Start time for entry ${i + 1}`}
                        type="text"
                        inputMode="numeric"
                        placeholder="00:00:00"
                        value={row.startTime}
                        onChange={(e) =>
                          setRow(i, { startTime: e.target.value })
                        }
                        className={cn(cellInput, "py-2.5 tabular-nums")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                        END TIME
                      </span>
                      <input
                        aria-label={`End time for entry ${i + 1}`}
                        type="text"
                        inputMode="numeric"
                        placeholder="23:59:59"
                        value={row.endTime}
                        onChange={(e) => setRow(i, { endTime: e.target.value })}
                        className={cn(cellInput, "py-2.5 tabular-nums")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                        MILEAGE (KM)
                      </span>
                      <input
                        aria-label={`Mileage for entry ${i + 1}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={row.mileage}
                        onChange={(e) => setRow(i, { mileage: e.target.value })}
                        className={cn(cellInput, "py-2.5 tabular-nums")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10.5px] font-extrabold tracking-[1px] text-fog">
                        STATUS
                      </span>
                      <input
                        aria-label={`Status for entry ${i + 1}`}
                        type="text"
                        value={row.status}
                        onChange={(e) => setRow(i, { status: e.target.value })}
                        className={cn(cellInput, "py-2.5")}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* desktop: the grid */}
          {rows.length > 0 && (
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-white sm:block">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-haze">
                      {[
                        "S/N",
                        "BUS",
                        "STATUS",
                        "START",
                        "END",
                        "MILEAGE (KM)",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="whitespace-nowrap px-3 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "border-b border-line last:border-0",
                          !row.busId && row.busNumber && "bg-[#FDF6E3]/60",
                        )}
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-[13px] font-bold tabular-nums text-fog">
                          {i + 1}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <select
                            aria-label={`Bus for row ${i + 1}`}
                            value={row.busId ?? ""}
                            onChange={(e) => {
                              const bus = activeBuses.find(
                                (b) => b._id === e.target.value,
                              );
                              setRow(i, {
                                busId: bus?._id,
                                busNumber: bus?.number ?? row.busNumber,
                                issues: [],
                              });
                            }}
                            className={cn(cellInput, "cursor-pointer")}
                          >
                            <option value="">
                              {row.busNumber
                                ? `${row.busNumber} (unmatched)`
                                : "Pick bus"}
                            </option>
                            {activeBuses.map((bus) => (
                              <option key={bus._id} value={bus._id}>
                                {bus.number}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <input
                            aria-label={`Status for row ${i + 1}`}
                            type="text"
                            value={row.status}
                            onChange={(e) =>
                              setRow(i, { status: e.target.value })
                            }
                            className={cellInput}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <input
                            aria-label={`Start time for row ${i + 1}`}
                            type="text"
                            placeholder="00:00:00"
                            value={row.startTime}
                            onChange={(e) =>
                              setRow(i, { startTime: e.target.value })
                            }
                            className={cn(cellInput, "w-[92px] tabular-nums")}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <input
                            aria-label={`End time for row ${i + 1}`}
                            type="text"
                            placeholder="23:59:59"
                            value={row.endTime}
                            onChange={(e) =>
                              setRow(i, { endTime: e.target.value })
                            }
                            className={cn(cellInput, "w-[92px] tabular-nums")}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <input
                            aria-label={`Mileage for row ${i + 1}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="0.0"
                            value={row.mileage}
                            onChange={(e) =>
                              setRow(i, { mileage: e.target.value })
                            }
                            className={cn(cellInput, "w-[90px] tabular-nums")}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <button
                            type="button"
                            aria-label={`Remove row ${i + 1}`}
                            onClick={() => removeRow(i)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(method === "manual" || rows.length > 0) && (
            <button
              type="button"
              onClick={addRow}
              className={cn(smallBtn, "w-fit")}
            >
              <span className="flex items-center gap-1.5">
                <Plus size={14} /> Add bus row
              </span>
            </button>
          )}

          {askReplace && (
            <div className="rounded-2xl border border-solar/40 bg-[#FDF6E3] px-5 py-4">
              <p className="m-0 text-[13.5px] font-semibold text-solar-700">
                A report for {date} already exists. Replace it with this one?
              </p>
              <div className="mt-2.5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => submit(true)}
                  className="cursor-pointer rounded-lg border-none bg-solar px-4 py-2 text-[13px] font-extrabold text-forest-deep"
                >
                  Replace it
                </button>
                <button
                  type="button"
                  onClick={() => setAskReplace(false)}
                  className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-bold text-bark"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 px-5 py-4 backdrop-blur">
              <span className="text-[13px] font-bold text-fog">
                {validRows.length} of {rows.length} rows ready ·{" "}
                {Math.round(
                  validRows.reduce((a, r) => a + (Number(r.mileage) || 0), 0),
                ).toLocaleString()}{" "}
                km total
              </span>
              <button
                type="button"
                disabled={
                  !date || validRows.length === 0 || createReport.isPending
                }
                onClick={() => submit(false)}
                className="cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createReport.isPending ? "Saving…" : "Save report →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* HISTORY (managers) */}
      {isManager && tab === "history" && (
        <>
          {openReport ? (
            <ReportDetail id={openReport} onBack={() => setOpenReport(null)} />
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line bg-haze">
                        {[
                          "DATE",
                          "REPORT",
                          "ACTIVE",
                          "TOTAL KM",
                          "NOT ACTIVE",
                          "SUBMITTED BY",
                        ].map((h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr
                          key={report._id}
                          onClick={() => setOpenReport(report._id)}
                          className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-haze"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                            {fmtDate(report.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                            #{report.reportId}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-brand-600">
                            {report.summary?.activeCount ?? 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-ink">
                            {Math.round(
                              report.summary?.totalMileageKm ?? 0,
                            ).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-solar-700">
                            {(report.summary?.notActiveTracked?.length ?? 0) +
                              (report.summary?.badTracker?.length ?? 0)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-fog">
                            {report.submittedByName || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {historyLoading && (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
                  </div>
                )}
                {!historyLoading && reports.length === 0 && (
                  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                    <BoltMark width={22} height={29} fill="#B5ECC2" />
                    <p className="m-0 text-[15px] font-bold text-bark">
                      No tracker reports yet.
                    </p>
                  </div>
                )}
              </div>
              <Pagination
                pagination={historyData?.pagination}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            </>
          )}
        </>
      )}

      {/* MILEAGE (managers) */}
      {isManager && tab === "mileage" && (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tr-month" className={labelClasses}>
                Month
              </label>
              <input
                id="tr-month"
                type="month"
                value={month || (mileage?.month ?? "")}
                onChange={(e) => setMonth(e.target.value)}
                className={inputClasses}
              />
            </div>
            <span className="text-[13px] font-bold text-fog">
              {mileage?.daysReported ?? 0} day
              {(mileage?.daysReported ?? 0) === 1 ? "" : "s"} reported
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-haze">
                    {[
                      "BUS",
                      "DAYS ACTIVE",
                      "TOTAL KM",
                      "AVG KM/DAY",
                      "BEST DAY",
                    ].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(mileage?.buses ?? []).map((bus) => (
                    <tr
                      key={bus.busNumber}
                      className="border-b border-line last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                        {bus.busNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                        {bus.days}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold tabular-nums text-ink">
                        {bus.totalKm.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                        {bus.avgKm.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                        {bus.maxKm.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mileageLoading && (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
              </div>
            )}
            {!mileageLoading && (mileage?.buses ?? []).length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <BoltMark width={22} height={29} fill="#B5ECC2" />
                <p className="m-0 text-[15px] font-bold text-bark">
                  No mileage recorded for this month.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
