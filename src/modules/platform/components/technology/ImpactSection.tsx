import SectionEyebrow from "@/components/shared/SectionEyebrow";
import {
  IMPACT_INTRO,
  IMPACT_STATS,
  IMPACT_EQUIVALENCY,
} from "@/data/technology-data";

// Dedicated Environmental Impact section; anchor target of "See Our Impact".
const ImpactSection = () => (
  <section
    id="impact"
    className="scroll-mt-24 bg-forest px-5 py-16 sm:px-8 lg:px-16 lg:py-[72px]"
  >
    <div className="mx-auto max-w-7xl">
      <div className="max-w-[720px]" data-aos="fade-up">
        <SectionEyebrow tone="neon">OUR ENVIRONMENTAL IMPACT</SectionEyebrow>
        <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-white sm:text-[32px] lg:text-[36px]">
          Measured in tons, not promises
        </h2>
        <p className="mb-0 mt-4 text-[15px] font-medium leading-[1.7] text-mint-pale sm:text-[16px]">
          {IMPACT_INTRO}
        </p>
      </div>

      <div
        className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        {IMPACT_STATS.map((stat) => (
          <div
            key={stat.value}
            className="flex flex-col gap-2.5 rounded-2xl border border-forest-border p-6 lg:p-[26px]"
          >
            <span className="text-[30px] font-extrabold text-neon sm:text-[34px]">
              {stat.value}
            </span>
            <p className="m-0 text-[14px] font-medium leading-[1.6] text-mint-soft">
              {stat.label}
            </p>
          </div>
        ))}

        {/* equivalency callout: illustration only, visually subordinate to the
            verified figures (this page may be reviewed by NCCC / NESREA) */}
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-forest-border bg-[rgba(255,255,255,0.03)] p-6 lg:p-[26px]">
          <span className="text-[11px] font-extrabold tracking-[2px] text-solar">
            FOR ILLUSTRATION
          </span>
          <p className="m-0 text-[13px] font-medium leading-[1.6] text-mint-dim">
            {IMPACT_EQUIVALENCY}
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default ImpactSection;
