import { useState } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import Modal from "../components/console/Modal";
import BusForm from "../components/buses/BusForm";
import { useGetBuses } from "@/lib/network/api/bus.api";
import type { Bus } from "@/lib/network/types/bus.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { canApprove } from "../permissions";
import { cn, fmtDate } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

type ActiveFilter = "all" | "true" | "false";

const FILTERS: { id: ActiveFilter; label: string }[] = [
  { id: "all", label: "All buses" },
  { id: "true", label: "Active" },
  { id: "false", label: "Inactive" },
];

export default function Buses() {
  const { user } = useAuthStore();
  const canEdit = canApprove(user?.role);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | { bus?: Bus }>(null);

  const { data, isLoading } = useGetBuses({
    page,
    pageSize: 20,
    search: search || undefined,
    isActive: activeFilter === "all" ? undefined : activeFilter,
  });

  const buses = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <PageMeta title="Buses | KGR Console" />
      <PageHead
        eyebrow="REGISTRY"
        title="Buses"
        subtitle="Every vehicle in the fleet, with its driver and status."
        actions={
          <button
            type="button"
            onClick={() => setModal({})}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={2.6} /> Register bus
          </button>
        }
      />

      {/* filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActiveFilter(f.id);
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                activeFilter === f.id
                  ? "cta-gradient border-transparent text-forest-deep"
                  : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-[260px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Search number or driver"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog">
                  BUS
                </th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog">
                  DRIVER
                </th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog">
                  PHONE
                </th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog">
                  STATUS
                </th>
                <th className="px-5 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog">
                  REGISTERED
                </th>
                {canEdit && <th className="px-5 py-3.5" />}
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => (
                <tr
                  key={bus._id}
                  className="border-b border-line transition-colors last:border-b-0 hover:bg-haze"
                >
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2.5 text-[15px] font-extrabold text-ink">
                      <BoltMark width={10} height={13} fill="#0FA53A" />
                      {bus.number}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[14px] font-semibold text-bark">
                    {bus.driverName || (
                      <span className="text-fog">Not set</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[14px] font-semibold text-bark">
                    {bus.driverPhone || (
                      <span className="text-fog">Not set</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill
                      tone={bus.isActive ? "success" : "muted"}
                      label={bus.isActive ? "Active" : "Inactive"}
                    />
                  </td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-fog">
                    {fmtDate(bus.createdAt)}
                  </td>
                  {canEdit && (
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        title="Edit bus"
                        onClick={() => setModal({ bus })}
                        className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && buses.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {search || activeFilter !== "all"
                ? "No buses match this filter."
                : "No buses registered yet. Add the first one."}
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
              {pagination.totalItems} bus
              {pagination.totalItems === 1 ? "" : "es"} · page {pagination.page}{" "}
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

      <Modal
        title={modal?.bus ? `Edit ${modal.bus.number}` : "Register a bus"}
        open={modal !== null}
        onClose={() => setModal(null)}
      >
        {modal && <BusForm bus={modal.bus} onDone={() => setModal(null)} />}
      </Modal>
    </>
  );
}
