import type { PaginationMeta } from "@/lib/network/types/api.types";
import { cn } from "@/lib/utils";
import { PAGE_SIZES } from "./paginationConfig";

interface PaginationProps {
  pagination?: PaginationMeta;
  page: number;
  pageSize: number;
  onPage: (next: number) => void;
  // callers should reset to page 1 when the size changes
  onPageSize: (size: number) => void;
  className?: string;
}

const btn =
  "cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40";

// Shared list footer: rows-per-page selector plus prev/next. Hidden when
// there is nothing to page through (10 or fewer items).
const Pagination = ({
  pagination,
  page,
  pageSize,
  onPage,
  onPageSize,
  className,
}: PaginationProps) => {
  if (!pagination || pagination.totalItems <= PAGE_SIZES[0]) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 text-[12.5px] font-semibold text-fog">
        <label className="flex items-center gap-2">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] font-bold text-ink outline-none focus:border-brand-500"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <span className="hidden sm:inline">
          Page {pagination.page} of {pagination.totalPages} ·{" "}
          {pagination.totalItems} total
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!pagination.hasPrevPage}
          onClick={() => onPage(page - 1)}
          className={btn}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={() => onPage(page + 1)}
          className={btn}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
