import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { TIMELINE, type TimelineEntry } from "@/data/about-data";
import { cn } from "@/lib/utils";

const accentBorder: Record<TimelineEntry["accent"], string> = {
  solar: "border-t-solar",
  brand: "border-t-brand-500",
  neon: "border-t-neon",
};

// From diesel to sunshine — 4 cards on desktop, a swipeable snap-carousel
// on mobile so the journey stays a single horizontal read.
const Timeline = () => (
  <section className="bg-mist py-16 lg:py-[72px]">
    <div className="mb-10 px-5 sm:px-8 lg:px-16" data-aos="fade-up">
      <div className="mx-auto max-w-7xl">
        <SectionEyebrow>THE JOURNEY</SectionEyebrow>
        <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-ink sm:text-[32px] lg:text-[36px]">
          From diesel to sunshine
        </h2>
      </div>
    </div>

    <div
      className="no-scrollbar mx-auto flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-2 sm:scroll-pl-8 sm:px-8 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-16 lg:pb-0 xl:px-0"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      {TIMELINE.map((entry) => (
        <div
          key={entry.period}
          className={cn(
            "flex w-[80%] max-w-[320px] flex-none snap-start flex-col gap-3 rounded-2xl border-t-4 p-7 sm:w-[45%] lg:w-auto lg:max-w-none",
            accentBorder[entry.accent],
            entry.dark ? "bg-ink" : "bg-white",
          )}
        >
          <span
            className={cn(
              "text-[28px] font-extrabold sm:text-[32px]",
              entry.dark ? "text-neon" : "text-ink",
            )}
          >
            {entry.period}
          </span>
          <span
            className={cn(
              "text-[17px] font-extrabold",
              entry.dark ? "text-white" : "text-ink",
            )}
          >
            {entry.title}
          </span>
          <p
            className={cn(
              "m-0 text-[14px] font-medium leading-[1.65]",
              entry.dark ? "text-mint-soft" : "text-sage",
            )}
          >
            {entry.description}
          </p>
        </div>
      ))}
    </div>

    {/* swipe hint, mobile only */}
    <div className="mx-auto mt-3 max-w-7xl px-5 text-[12px] font-semibold text-fog sm:px-8 lg:hidden">
      Swipe to travel through the years →
    </div>
  </section>
);

export default Timeline;
