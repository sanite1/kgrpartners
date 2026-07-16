import { cn } from "@/lib/utils";

type PillTone = "success" | "warn" | "muted" | "danger";

const toneClasses: Record<PillTone, { pill: string; dot: string }> = {
  success: { pill: "border-brand-200 text-brand-600", dot: "bg-brand-500" },
  warn: { pill: "border-solar/40 text-solar-700", dot: "bg-solar" },
  muted: { pill: "border-line text-fog", dot: "bg-fog" },
  danger: { pill: "border-red-200 text-red-600", dot: "bg-red-500" },
};

interface StatusPillProps {
  tone: PillTone;
  label: string;
  className?: string;
}

const StatusPill = ({ tone, label, className }: StatusPillProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-2.5 py-1 text-[11px] font-extrabold tracking-[0.5px]",
      toneClasses[tone].pill,
      className,
    )}
  >
    <span className={cn("h-1.5 w-1.5 rounded-full", toneClasses[tone].dot)} />
    {label}
  </span>
);

export default StatusPill;
