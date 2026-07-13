import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { SWAP_STEPS } from "@/data/technology-data";

// The 5-step battery swap walkthrough; grid on desktop, snap-carousel on mobile.
const SwapSteps = () => (
  <section className="bg-mist py-16 lg:py-[72px]">
    <div className="mb-10 px-5 sm:px-8 lg:px-16" data-aos="fade-up">
      <div className="mx-auto max-w-7xl">
        <SectionEyebrow>HOW A SWAP WORKS</SectionEyebrow>
        <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-ink sm:text-[32px] lg:text-[36px]">
          Under 5 minutes, start to finish
        </h2>
      </div>
    </div>

    <div
      className="no-scrollbar mx-auto flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-2 sm:scroll-pl-8 sm:px-8 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:px-16 lg:pb-0 xl:px-0"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      {SWAP_STEPS.map((step, i) => (
        <div
          key={step.title}
          className="flex w-[70%] max-w-[280px] flex-none snap-start flex-col gap-3 rounded-2xl border border-card-line bg-white p-6 sm:w-[40%] lg:w-auto lg:max-w-none"
        >
          <span className="cta-gradient flex h-10 w-10 items-center justify-center rounded-xl text-[16px] font-extrabold text-forest-deep">
            {i + 1}
          </span>
          <span className="text-[17px] font-extrabold text-ink">
            {step.title}
          </span>
          <p className="m-0 text-[14px] font-medium leading-[1.6] text-sage">
            {step.description}
          </p>
        </div>
      ))}
    </div>

    <div className="mx-auto mt-3 max-w-7xl px-5 text-[12px] font-semibold text-fog sm:px-8 lg:hidden">
      Swipe through the swap →
    </div>
  </section>
);

export default SwapSteps;
