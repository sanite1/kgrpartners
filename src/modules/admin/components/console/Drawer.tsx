import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

// A right-hand slide-out panel, for records with more detail than a
// modal should hold. Scrolls internally; the footer stays pinned.
const Drawer = ({
  title,
  subtitle,
  open,
  onClose,
  children,
  footer,
}: DrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cnOpen(open)}
      aria-hidden={!open}
      onClick={onClose}
    >
      {/* scrim */}
      <div
        className={`absolute inset-0 bg-forest-deep/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* panel */}
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-white shadow-[0_0_60px_rgba(4,23,12,0.35)] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-[19px] font-extrabold tracking-[-0.4px] text-ink">
              {title}
            </h2>
            {subtitle && (
              <p className="m-0 mt-0.5 truncate text-[13px] font-semibold text-fog">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className={cn(
            "flex-1 overflow-y-auto px-6 py-5",
            // without a footer the body ends under the iOS toolbar band;
            // keep the last content clear of it on phones
            !footer && "pb-24 md:pb-5",
          )}
        >
          {children}
        </div>

        {footer && (
          // the panel extends under the iOS toolbar band (lvh) so the
          // band shows the white sheet; the extra mobile padding keeps
          // the action buttons above the bar itself
          <div className="border-t border-line px-6 pb-24 pt-4 md:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// the outer wrapper toggles pointer events so a closed drawer never
// blocks clicks behind it, while still animating out
const cnOpen = (open: boolean) =>
  `fixed inset-0 z-[100] h-lvh ${open ? "" : "pointer-events-none"}`;

export default Drawer;
