import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: string; // e.g. "2017", "50+", "5,000+"
  duration?: number;
}

// Counts from 0 to the numeric part of `value` when scrolled into view,
// preserving the original formatting (comma grouping, trailing suffix).
const CountUp = ({ value, duration = 1600 }: CountUpProps) => {
  const match = /^([\d,]+)(.*)$/.exec(value.trim());
  const target = match ? parseInt(match[1].replace(/,/g, ""), 10) : NaN;
  const suffix = match ? match[2] : "";
  const useComma = value.includes(",");

  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || Number.isNaN(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  if (Number.isNaN(target)) return <span>{value}</span>;

  return (
    <span ref={ref} className="tabular-nums">
      {useComma ? display.toLocaleString("en-NG") : String(display)}
      {suffix}
    </span>
  );
};

export default CountUp;
