import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClasses } from "./form";

export interface SearchSelectOption {
  key: string;
  title: string;
  subtitle?: string;
}

interface SearchSelectProps {
  id?: string;
  placeholder: string;
  search: string;
  onSearch: (value: string) => void;
  // parent enables its query with this, so options load as soon as
  // the field is focused, before anything is typed
  onOpenChange: (open: boolean) => void;
  options: SearchSelectOption[];
  onPick: (key: string) => void;
  emptyText?: string; // shown when a typed search matches nothing
  icon?: boolean; // leading search glyph
  // inline lists take real space instead of floating; use inside modals
  // where a floating panel would fight the modal's own scroll area
  inline?: boolean;
}

const listClasses =
  "max-h-[240px] overflow-y-auto rounded-xl border border-line bg-white";

// leaves room for the 240px list; below this the panel flips upward
const PANEL_SPACE = 264;

const SearchSelect = ({
  id,
  placeholder,
  search,
  onSearch,
  onOpenChange,
  options,
  onPick,
  emptyText,
  icon,
  inline,
}: SearchSelectProps) => {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // opens upward when there isn't room below and there is more room
  // above (only for the floating panel; inline lives in the flow)
  const decidePlacement = () => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUp(spaceBelow < PANEL_SPACE && rect.top > spaceBelow);
  };

  const setOpenState = (next: boolean) => {
    if (next && !inline) decidePlacement();
    setOpen(next);
    onOpenChange(next);
  };

  // clicking outside closes and clears; scrolling/resizing re-checks
  // which way the panel should open
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        onOpenChange(false);
        onSearch("");
      }
    };
    const onReflow = () => {
      if (!inline) decidePlacement();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (key: string) => {
    onPick(key);
    setOpenState(false);
    onSearch("");
  };

  const floatPlacement = openUp
    ? "absolute inset-x-0 bottom-full mb-1.5 z-30 shadow-[0_-18px_44px_rgba(13,31,21,0.15)]"
    : "absolute inset-x-0 top-full mt-1.5 z-30 shadow-[0_18px_44px_rgba(13,31,21,0.15)]";
  const panelPlacement = inline ? "mt-1.5" : floatPlacement;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        {icon && (
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
        )}
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => setOpenState(true)}
          className={cn(inputClasses, icon && "pl-9")}
          autoComplete="off"
        />
      </div>
      {open && options.length > 0 && (
        <div className={cn(listClasses, panelPlacement)}>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => pick(option.key)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent px-4 py-3 text-left transition-colors hover:bg-haze"
            >
              <span className="text-[14px] font-extrabold text-ink">
                {option.title}
              </span>
              {option.subtitle && (
                <span className="shrink-0 text-[12px] font-semibold text-fog">
                  {option.subtitle}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && search.length > 0 && options.length === 0 && emptyText && (
        <div
          className={cn(
            "rounded-xl border border-line bg-white px-4 py-3 text-[13px] font-semibold text-fog",
            panelPlacement,
          )}
        >
          {emptyText}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
