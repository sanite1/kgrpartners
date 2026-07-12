import { cn } from "@/lib/utils";

interface SectionEyebrowProps {
  children: string;
  tone?: "brand" | "neon";
  dash?: boolean;
  className?: string;
}

// The small tracking-wide label above every section heading.
const SectionEyebrow = ({
  children,
  tone = "brand",
  dash = false,
  className,
}: SectionEyebrowProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 text-[13px] font-extrabold tracking-[2px]",
      tone === "brand" ? "text-brand-500" : "text-neon",
      className,
    )}
  >
    {dash && <span className="inline-block h-0.5 w-7 bg-solar" />}
    {children}
  </span>
);

export default SectionEyebrow;
