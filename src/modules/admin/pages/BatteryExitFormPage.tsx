import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCheck, Printer } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Skeleton from "../components/console/Skeleton";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import ExitFormDetail from "../components/exitform/ExitFormDetail";
import {
  CHECK_OPTIONS,
  LOCATION_OPTIONS,
  LOCATION_LABEL,
  TALLY_ROWS,
} from "../components/exitform/meta";
import {
  useGetFleetRoster,
  useCreateExitForm,
  useGetExitForms,
  useGetExitForm,
} from "@/lib/network/api/batteryExitForm.api";
import type {
  ExitCheck,
  ExitFormTotals,
  RosterBattery,
} from "@/lib/network/types/batteryExitForm.types";
import type { BatteryLocation } from "@/lib/network/types/battery.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { isAdminRole } from "../permissions";
import { cn, fmtDate } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

interface Entry {
  check: ExitCheck;
  location: BatteryLocation;
  note: string;
}

const smallBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 hover:text-brand-600";

const cellSelect =
  "w-full cursor-pointer rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-brand-500 focus:border-brand-500 focus:outline-none";

// A pack's row opens on whatever the fleet already believes about it, so a
// clean run means the staff only touches what actually changed.
const defaultEntry = (b: RosterBattery): Entry => ({
  check: b.needsCheck
    ? "needs_check"
    : b.status === "faulty"
      ? "faulty"
      : b.status === "not_in_use"
        ? "out_of_use"
        : "active",
  location: b.location ?? "main_yard",
  note: "",
});

// One saved form, opened from the history list (admin only).
const HistoryDetail = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const { data, isLoading } = useGetExitForm(id);
  const form = data?.data;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className={smallBtn}>
          <span className="flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to history
          </span>
        </button>
        {form && (
          <button
            type="button"
            onClick={() => window.print()}
            className={smallBtn}
          >
            <span className="flex items-center gap-1.5">
              <Printer size={14} /> Print
            </span>
          </button>
        )}
      </div>
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}
      {form && <ExitFormDetail form={form} />}
    </>
  );
};

export default function BatteryExitFormPage() {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);

  const [tab, setTab] = useState<"roll" | "history">("roll");
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [seeded, setSeeded] = useState(false);
  const [comments, setComments] = useState("");

  // history state (admin)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [openForm, setOpenForm] = useState<string | null>(null);

  const { data: rosterData, isLoading: rosterLoading } = useGetFleetRoster();
  const roster = rosterData?.data;

  const { data: historyData, isLoading: historyLoading } = useGetExitForms(
    { page, pageSize },
    { enabled: isAdmin && tab === "history" },
  );
  const forms = historyData?.data ?? [];

  const createForm = useCreateExitForm();

  // prime every row once the roster lands
  useEffect(() => {
    if (!roster || seeded) return;
    const next: Record<string, Entry> = {};
    for (const group of roster.series) {
      for (const battery of group.batteries) {
        next[battery._id] = defaultEntry(battery);
      }
    }
    setEntries(next);
    setSeeded(true);
  }, [roster, seeded]);

  const setEntry = (id: string, patch: Partial<Entry>) =>
    setEntries((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const markActive = (ids: string[]) =>
    setEntries((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = { ...next[id], check: "active" };
      return next;
    });

  // the tallies the paper form makes you count by hand
  const { totals, byLocation } = useMemo(() => {
    const t: ExitFormTotals = {
      active: 0,
      faulty: 0,
      needsCheck: 0,
      outOfUse: 0,
      sold: 0,
      bms: 0,
    };
    const loc: Record<string, number> = {};
    for (const entry of Object.values(entries)) {
      if (entry.check === "active") t.active += 1;
      else if (entry.check === "faulty") t.faulty += 1;
      else if (entry.check === "needs_check") t.needsCheck += 1;
      else if (entry.check === "out_of_use") t.outOfUse += 1;
      else if (entry.check === "sold") t.sold += 1;
      else if (entry.check === "bms") t.bms += 1;
      if (entry.check !== "sold") {
        loc[entry.location] = (loc[entry.location] || 0) + 1;
      }
    }
    return { totals: t, byLocation: loc };
  }, [entries]);

  const counted = Object.keys(entries).length;

  const submit = () => {
    const rows = Object.entries(entries).map(([batteryId, entry]) => ({
      batteryId,
      check: entry.check,
      location: entry.location,
      note: entry.note || undefined,
    }));
    createForm.mutate(
      { rows, comments: comments || undefined },
      { onSuccess: () => setComments("") },
    );
  };

  return (
    <>
      <PageMeta title="Battery Exit Form | KGR Console" />
      <PageHead
        eyebrow="FLEET ROLL-CALL"
        title="Battery Exit Form"
        subtitle="Walk the fleet, mark each pack, and the totals count themselves."
        actions={
          isAdmin ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("roll")}
                className={cn(
                  smallBtn,
                  tab === "roll" && "border-brand-500 text-brand-600",
                )}
              >
                New roll-call
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("history");
                  setOpenForm(null);
                }}
                className={cn(
                  smallBtn,
                  tab === "history" && "border-brand-500 text-brand-600",
                )}
              >
                History
              </button>
            </div>
          ) : undefined
        }
      />

      {/* ADMIN HISTORY */}
      {isAdmin && tab === "history" && (
        <>
          {openForm ? (
            <HistoryDetail id={openForm} onBack={() => setOpenForm(null)} />
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line bg-haze">
                        {["DATE", "FORM", "ISSUED BY", "ACTIVE", "FAULTY", "NEEDS CHECK", "SOLD"].map(
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
                      {forms.map((form) => (
                        <tr
                          key={form._id}
                          onClick={() => setOpenForm(form._id)}
                          className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-haze"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-extrabold text-ink">
                            {fmtDate(form.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-bark">
                            #{form.formId}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-semibold text-bark">
                            {form.issuedByName || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-ink">
                            {form.totals?.active ?? 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-ink">
                            {form.totals?.faulty ?? 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-ink">
                            {form.totals?.needsCheck ?? 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] font-bold tabular-nums text-ink">
                            {form.totals?.sold ?? 0}
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
                {!historyLoading && forms.length === 0 && (
                  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                    <BoltMark width={22} height={29} fill="#B5ECC2" />
                    <p className="m-0 text-[15px] font-bold text-bark">
                      No roll-calls submitted yet.
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

      {/* ROLL-CALL */}
      {tab === "roll" && (
        <>
          {rosterLoading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {!rosterLoading && counted === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-14 text-center">
              <BoltMark width={22} height={29} fill="#B5ECC2" />
              <p className="m-0 text-[15px] font-bold text-bark">
                No batteries registered yet.
              </p>
              <p className="m-0 text-[13px] font-semibold text-fog">
                Register the fleet first, then run a roll-call.
              </p>
            </div>
          )}

          {counted > 0 && (
            <>
              {/* live tallies */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {TALLY_ROWS.map((t) => (
                  <div
                    key={t.key}
                    className="rounded-2xl border border-line bg-white p-4"
                  >
                    <span className="block text-[24px] font-extrabold leading-none text-ink">
                      {totals[t.key]}
                    </span>
                    <span className="mt-1.5 block text-[11px] font-extrabold uppercase tracking-[1px] text-fog">
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LOCATION_OPTIONS.map(([value, label]) => (
                  <div
                    key={value}
                    className="rounded-2xl border border-line bg-haze p-4"
                  >
                    <span className="block text-[20px] font-extrabold leading-none text-ink">
                      {byLocation[value] ?? 0}
                    </span>
                    <span className="mt-1.5 block text-[11px] font-extrabold uppercase tracking-[1px] text-fog">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] font-bold text-fog">
                  {counted} packs on this roll-call
                </span>
                <button
                  type="button"
                  onClick={() => markActive(Object.keys(entries))}
                  className={smallBtn}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCheck size={14} /> Mark everything active
                  </span>
                </button>
              </div>

              {/* one block per series, mirroring the paper's columns */}
              <div className="flex flex-col gap-4">
                {roster?.series.map((group) => (
                  <div
                    key={group.series}
                    className="overflow-hidden rounded-2xl border border-line bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-haze px-5 py-3">
                      <span className="text-[14px] font-extrabold tracking-[-0.2px] text-ink">
                        {group.series}
                        <span className="ml-2 text-[12px] font-bold text-fog">
                          {group.batteries.length} packs
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          markActive(group.batteries.map((b) => b._id))
                        }
                        className={smallBtn}
                      >
                        All active
                      </button>
                    </div>
                    <div className="flex flex-col">
                      {group.batteries.map((battery) => {
                        const entry = entries[battery._id];
                        if (!entry) return null;
                        return (
                          <div
                            key={battery._id}
                            className="grid grid-cols-2 items-center gap-2 border-b border-line px-4 py-2.5 last:border-0 sm:grid-cols-[110px_1fr_1fr_1.2fr]"
                          >
                            <span className="text-[13.5px] font-extrabold text-ink">
                              {battery.code}
                            </span>
                            <select
                              aria-label={`Check for ${battery.code}`}
                              value={entry.check}
                              onChange={(e) =>
                                setEntry(battery._id, {
                                  check: e.target.value as ExitCheck,
                                })
                              }
                              className={cellSelect}
                            >
                              {CHECK_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <select
                              aria-label={`Location for ${battery.code}`}
                              value={entry.location}
                              onChange={(e) =>
                                setEntry(battery._id, {
                                  location: e.target.value as BatteryLocation,
                                })
                              }
                              className={cellSelect}
                            >
                              {LOCATION_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              aria-label={`Note for ${battery.code}`}
                              placeholder="Note"
                              value={entry.note}
                              onChange={(e) =>
                                setEntry(battery._id, { note: e.target.value })
                              }
                              className={cn(cellSelect, "col-span-2 sm:col-span-1 font-semibold")}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-1.5">
                <label htmlFor="exit-comments" className={labelClasses}>
                  Comments
                </label>
                <textarea
                  id="exit-comments"
                  rows={2}
                  placeholder="Anything worth noting about this run"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className={cn(inputClasses, "resize-y")}
                />
              </div>

              <div className="sticky bottom-0 z-10 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 px-5 py-4 backdrop-blur">
                <span className="text-[13px] font-bold text-fog">
                  {totals.active} active · {totals.faulty} faulty ·{" "}
                  {totals.needsCheck} to check ·{" "}
                  {byLocation.main_yard ?? 0} at {LOCATION_LABEL.main_yard}
                </span>
                <button
                  type="button"
                  disabled={createForm.isPending}
                  onClick={submit}
                  className="cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createForm.isPending ? "Saving…" : "Save roll-call →"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
