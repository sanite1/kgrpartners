import { useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import StatusPill from "../components/console/StatusPill";
import Drawer from "../components/console/Drawer";
import {
  useGetPartnerships,
  useUpdatePartnershipStatus,
} from "@/lib/network/api/partnership.api";
import type {
  PartnershipRequest,
  PartnershipKind,
} from "@/lib/network/types/partnership.types";
import type { ConversionStatus } from "@/lib/network/types/conversion.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../permissions";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

type StatusFilter = "all" | ConversionStatus;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "in_review", label: "In review" },
  { id: "contacted", label: "Contacted" },
  { id: "closed", label: "Closed" },
];

const STATUS_META: Record<
  ConversionStatus,
  { label: string; tone: "success" | "warn" | "muted" | "danger" }
> = {
  new: { label: "New", tone: "warn" },
  in_review: { label: "In review", tone: "success" },
  contacted: { label: "Contacted", tone: "muted" },
  closed: { label: "Closed", tone: "muted" },
};

const KIND_LABEL: Record<PartnershipKind, string> = {
  corporate: "Corporate",
  individual: "Individual",
};

// the forward path a lead usually travels
const NEXT_STATUS: ConversionStatus[] = [
  "new",
  "in_review",
  "contacted",
  "closed",
];

export default function Partnerships() {
  const canView = canApprove(useAuthStore((s) => s.user)?.role);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [kind, setKind] = useState<"all" | PartnershipKind>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<PartnershipRequest | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useGetPartnerships(
    {
      page,
      pageSize,
      status: status === "all" ? undefined : status,
      kind: kind === "all" ? undefined : kind,
      search: search || undefined,
    },
    { enabled: canView },
  );
  const requests = data?.data ?? [];
  const pagination = data?.pagination;

  const updateStatus = useUpdatePartnershipStatus();

  const open = (request: PartnershipRequest) => {
    setSelected(request);
    setNote(request.adminNote ?? "");
  };

  const changeStatus = (next: ConversionStatus) => {
    if (!selected) return;
    updateStatus.mutate(
      { id: selected._id, payload: { status: next, note: note || undefined } },
      {
        onSuccess: (res) => setSelected(res.data ?? null),
      },
    );
  };

  const handledBy = selected?.handledBy as
    { firstName?: string; lastName?: string } | undefined;

  if (!canView) {
    return (
      <>
        <PageMeta title="Partnerships | KGR Console" />
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-white px-6 py-16 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            Only a manager or admin can view partnership requests.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Partnerships | KGR Console" />
      <PageHead
        eyebrow="LEADS"
        title="Partnership Requests"
        subtitle="Every partner / investor form submitted from the website."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <select
            aria-label="Filter by type"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as "all" | PartnershipKind);
              setPage(1);
            }}
            className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-base font-bold text-bark outline-none transition-colors hover:border-brand-500 sm:text-[13px]"
          >
            <option value="all">All types</option>
            <option value="corporate">Corporate</option>
            <option value="individual">Individual</option>
          </select>
        </div>
        <div className="relative sm:w-[240px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Name, email or number"
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
                "NAME",
                "TYPE",
                "EMAIL",
                "PHONE",
                "STATUS",
                "SUBMITTED",
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
            {requests.map((request) => (
              <tr
                key={request._id}
                onClick={() => open(request)}
                className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-haze"
              >
                <td className="px-5 py-3.5 text-[13.5px] font-extrabold text-ink">
                  #{request.requestId}
                </td>
                <td className="px-5 py-3.5 text-[14px] font-extrabold text-ink">
                  {request.name}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={request.kind === "corporate" ? "success" : "muted"}
                    label={KIND_LABEL[request.kind]}
                  />
                </td>
                <td className="px-5 py-3.5 text-[13.5px] font-semibold text-bark">
                  {request.email}
                </td>
                <td className="px-5 py-3.5 text-[13.5px] font-semibold text-bark">
                  {request.phone || "—"}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={STATUS_META[request.status].tone}
                    label={STATUS_META[request.status].label}
                  />
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-fog">
                  {fmtDate(request.createdAt)}
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

        {!isLoading && requests.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              No partnership requests in this view.
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
        title={selected ? `${selected.name}` : ""}
        subtitle={
          selected
            ? `${KIND_LABEL[selected.kind]} · Request #${selected.requestId} · ${fmtDate(selected.createdAt)} at ${fmtTime(selected.createdAt)}`
            : undefined
        }
        footer={
          selected && (
            <div className="flex flex-col gap-3">
              <textarea
                rows={2}
                placeholder="Internal note (saved with the next status change)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={cn(inputClasses, "resize-y sm:text-[13.5px]")}
              />
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUS.filter((s) => s !== selected.status).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => changeStatus(s)}
                    className={cn(
                      "cursor-pointer rounded-lg border px-4 py-2 text-[13px] font-extrabold transition-colors disabled:opacity-50",
                      s === "closed"
                        ? "border-line bg-white text-bark hover:border-red-300 hover:text-red-600"
                        : "cta-gradient border-transparent text-forest-deep",
                    )}
                  >
                    Mark {STATUS_META[s].label.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )
        }
      >
        {selected && (
          <div className="flex flex-col gap-6">
            {/* status + contact */}
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
              <a
                href={`mailto:${selected.email}`}
                className="flex items-center gap-2.5 text-[14px] font-bold text-ink hover:text-brand-600"
              >
                <Mail size={15} className="text-fog" /> {selected.email}
              </a>
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="flex items-center gap-2.5 text-[14px] font-bold text-ink hover:text-brand-600"
                >
                  <Phone size={15} className="text-fog" /> {selected.phone}
                </a>
              )}
              {handledBy?.firstName && selected.handledAt && (
                <p className="m-0 text-[12.5px] font-semibold text-fog">
                  Last handled by {handledBy.firstName} {handledBy.lastName} on{" "}
                  {fmtDate(selected.handledAt)}
                </p>
              )}
            </div>

            {/* the form, section by section */}
            {selected.sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-2">
                <span className="text-[12px] font-extrabold tracking-[1px] text-brand-600">
                  {section.title.toUpperCase()}
                </span>
                <div className="overflow-hidden rounded-xl border border-line">
                  {section.fields.map((field, i) => (
                    <div
                      key={field.label}
                      className={cn(
                        "flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:justify-between sm:gap-4",
                        i > 0 && "border-t border-line",
                      )}
                    >
                      <span className="flex-none text-[13px] font-bold text-fog sm:w-[45%]">
                        {field.label}
                      </span>
                      <span className="text-[13.5px] font-semibold text-ink sm:text-right">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {selected.adminNote && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-extrabold tracking-[1px] text-fog">
                  INTERNAL NOTE
                </span>
                <p className="m-0 whitespace-pre-line rounded-xl border border-solar/40 bg-[#FDF6E3] p-4 text-[13.5px] font-semibold leading-[1.6] text-solar-700">
                  {selected.adminNote}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
