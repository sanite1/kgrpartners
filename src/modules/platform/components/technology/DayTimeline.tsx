import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { DAY_TIMELINE } from "@/data/technology-data";

// "How a day works" — dark band; grid on desktop, snap-carousel on mobile.
const DayTimeline = () => (
  <section className="bg-forest py-16 lg:py-[72px]">
    <div className="mb-10 px-5 sm:px-8 lg:px-16" data-aos="fade-up">
      <div className="mx-auto max-w-7xl">
        <SectionEyebrow tone="neon">HOW A DAY WORKS</SectionEyebrow>
        <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-white sm:text-[32px] lg:text-[36px]">
          Sunrise to last stop
        </h2>
      </div>
    </div>

    <div
      className="no-scrollbar mx-auto flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-2 sm:scroll-pl-8 sm:px-8 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-16 lg:pb-0 xl:px-0"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      {DAY_TIMELINE.map((moment) => (
        <div
          key={moment.time}
          className="flex w-[75%] max-w-[300px] flex-none snap-start flex-col gap-2.5 rounded-2xl border border-forest-border p-6 sm:w-[45%] lg:w-auto lg:max-w-none lg:p-[26px]"
        >
          <span className="text-[15px] font-extrabold text-solar">
            {moment.time}
          </span>
          <span className="text-[17px] font-extrabold text-white">
            {moment.title}
          </span>
          <p className="m-0 text-[14px] font-medium leading-[1.6] text-mint-soft">
            {moment.description}
          </p>
        </div>
      ))}
    </div>

    <div className="mx-auto mt-3 max-w-7xl px-5 text-[12px] font-semibold text-mint-faint sm:px-8 lg:hidden">
      Swipe through the day →
    </div>
  </section>
);

export default DayTimeline;
