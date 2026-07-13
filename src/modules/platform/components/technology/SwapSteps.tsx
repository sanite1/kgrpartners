import { ChevronRight, RotateCcw } from "lucide-react";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { SWAP_STEPS } from "@/data/technology-data";
import { cn } from "@/lib/utils";

// Connected stepper: badges joined by dashed connectors reading left to
// right on desktop; a vertical rail timeline on mobile. Step 5 hands the
// cycle back to step 1 via the loop note below the flow.
const SwapSteps = () => {
  const last = SWAP_STEPS.length - 1;

  return (
    <section className="bg-mist px-5 py-16 sm:px-8 lg:px-16 lg:py-[72px]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12" data-aos="fade-up">
          <SectionEyebrow>HOW A SWAP WORKS</SectionEyebrow>
          <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-ink sm:text-[32px] lg:text-[36px]">
            Under 5 minutes, start to finish
          </h2>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-5 lg:gap-0"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          {SWAP_STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex gap-5 lg:flex-col lg:gap-5 lg:pr-8 lg:last:pr-0"
            >
              {/* rail: badge + connector (vertical on mobile, horizontal on lg) */}
              <div className="flex flex-col items-center lg:w-full lg:flex-row">
                <span className="cta-gradient flex h-11 w-11 flex-none items-center justify-center rounded-full text-[16px] font-extrabold text-forest-deep shadow-[0_8px_18px_rgba(15,165,58,0.3)]">
                  {i + 1}
                </span>
                {i < last && (
                  <>
                    <span className="mt-2 w-0 flex-1 border-l-2 border-dashed border-brand-200 lg:ml-3 lg:mt-0 lg:h-0 lg:w-auto lg:border-l-0 lg:border-t-2" />
                    <ChevronRight
                      size={18}
                      className="-mt-1 hidden text-brand-300 lg:-ml-1.5 lg:mt-0 lg:block"
                    />
                  </>
                )}
              </div>

              <div className={cn("lg:pb-0", i < last ? "pb-9" : "pb-0")}>
                <div className="text-[17px] font-extrabold text-ink">
                  {step.title}
                </div>
                <p className="mb-0 mt-1.5 max-w-[420px] text-[14px] font-medium leading-[1.6] text-sage lg:max-w-none">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* the loop back to step 1 */}
        <div
          className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-brand-200 bg-white px-5 py-2.5 text-[13px] font-bold text-brand-600"
          data-aos="fade-up"
        >
          <RotateCcw size={15} strokeWidth={2.6} />
          The recharged pack goes back into rotation, and the cycle starts
          again.
        </div>
      </div>
    </section>
  );
};

export default SwapSteps;
