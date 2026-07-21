import BoltMark from "@/components/shared/BoltMark";
import type { BatteryExitForm } from "@/lib/network/types/batteryExitForm.types";
import type { BatteryLocation } from "@/lib/network/types/battery.types";
import { fmtDate, fmtTime } from "@/lib/utils";
import {
  CHECK_LABEL,
  LOCATION_LABEL,
  LOCATION_OPTIONS,
  TALLY_ROWS,
} from "./meta";

// A submitted roll-call, laid out like the paper sheet it replaces.
// Wrapped in #print-sheet so printing drops every tint and prints plain.
const ExitFormDetail = ({ form }: { form: BatteryExitForm }) => (
  <div
    id="print-sheet"
    className="rounded-2xl border border-line bg-white p-6 sm:p-8"
  >
    <div className="flex flex-wrap items-start justify-between gap-4">
      <span className="flex items-center gap-2 text-[13px] font-extrabold tracking-[2px] text-brand-500">
        <BoltMark width={12} height={16} fill="#0FA53A" />
        KGR BATTERY EXIT FORM
      </span>
      <span className="text-[13px] font-extrabold text-ink">
        #{form.formId}
      </span>
    </div>

    <div
      data-print="rule"
      className="mt-4 grid grid-cols-2 gap-3 border-t border-divider pt-4 sm:grid-cols-4"
    >
      <div>
        <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
          ISSUED BY
        </div>
        <div className="mt-0.5 text-[15px] font-extrabold text-ink">
          {form.issuedByName || "—"}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
          DATE
        </div>
        <div className="mt-0.5 text-[15px] font-extrabold text-ink">
          {fmtDate(form.date)}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
          SUBMITTED
        </div>
        <div className="mt-0.5 text-[15px] font-extrabold text-ink">
          {fmtDate(form.createdAt)} · {fmtTime(form.createdAt)}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
          PACKS COUNTED
        </div>
        <div className="mt-0.5 text-[15px] font-extrabold text-ink">
          {form.rows.length}
        </div>
      </div>
    </div>

    {/* the roll-call itself */}
    <div className="mt-5 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            {["S/N", "BATTERY", "CHECK", "LOCATION", "NOTE"].map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-2 py-2 text-[11px] font-extrabold tracking-[1.5px] text-fog"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {form.rows.map((row, i) => (
            <tr key={row.battery + i} className="border-b border-line">
              <td className="whitespace-nowrap px-2 py-1.5 text-[13px] font-semibold tabular-nums text-fog">
                {i + 1}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-[13px] font-extrabold text-ink">
                {row.code}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-[13px] font-bold text-bark">
                {CHECK_LABEL[row.check]}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-[13px] font-semibold text-bark">
                {LOCATION_LABEL[row.location]}
              </td>
              <td className="px-2 py-1.5 text-[12.5px] font-semibold text-fog">
                {row.note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* tallies, the part nobody has to count by hand any more */}
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {TALLY_ROWS.map((t) => (
        <div
          key={t.key}
          data-print="box"
          className="rounded-xl border border-line bg-haze px-4 py-3"
        >
          <div className="text-[20px] font-extrabold leading-none text-ink">
            {form.totals?.[t.key] ?? 0}
          </div>
          <div className="mt-1 text-[10.5px] font-extrabold uppercase tracking-[1px] text-fog">
            {t.label}
          </div>
        </div>
      ))}
    </div>

    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {LOCATION_OPTIONS.map(([value, label]) => (
        <div
          key={value}
          data-print="box"
          className="rounded-xl border border-line px-4 py-3"
        >
          <div className="text-[20px] font-extrabold leading-none text-ink">
            {form.byLocation?.[value as BatteryLocation] ?? 0}
          </div>
          <div className="mt-1 text-[10.5px] font-extrabold uppercase tracking-[1px] text-fog">
            {label}
          </div>
        </div>
      ))}
    </div>

    {form.comments && (
      <div data-print="rule" className="mt-5 border-t border-divider pt-4">
        <div className="text-[11px] font-extrabold tracking-[1.5px] text-fog">
          COMMENTS
        </div>
        <p className="m-0 mt-1 text-[13.5px] font-semibold text-bark">
          {form.comments}
        </p>
      </div>
    )}
  </div>
);

export default ExitFormDetail;
