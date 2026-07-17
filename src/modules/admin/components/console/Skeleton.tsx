import { cn } from "@/lib/utils";

// Pulsing placeholder shown while a stat is still on its way.
// Size it with h-/w- classes; override bg- for dark surfaces.
const Skeleton = ({ className }: { className?: string }) => (
  <span
    className={cn("block animate-pulse rounded-lg bg-mist", className)}
    aria-hidden
  />
);

export default Skeleton;
