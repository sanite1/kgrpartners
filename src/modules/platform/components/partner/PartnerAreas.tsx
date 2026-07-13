import { Link } from "react-router-dom";
import {
  Bus,
  Sun,
  GraduationCap,
  Building2,
  Factory,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { PARTNER_INTRO, PARTNER_AREAS } from "@/data/partner-data";

const ICON_MAP: Record<string, LucideIcon> = {
  Bus,
  Sun,
  GraduationCap,
  Building2,
  Factory,
  Leaf,
};

// Six collaboration areas in the gradient-badge row style of About's
// "What we believe" section, with icons in the badges.
const PartnerAreas = () => (
  <section className="px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
    <div className="mx-auto max-w-7xl">
      <div className="max-w-[760px]" data-aos="fade-up">
        <SectionEyebrow>WHAT WE COLLABORATE ON</SectionEyebrow>
        <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-ink sm:text-[32px] lg:text-[36px]">
          Six ways to build this with us
        </h2>
        <p className="mb-0 mt-4 text-[15px] font-medium leading-[1.7] text-bark sm:text-[16px]">
          {PARTNER_INTRO}
        </p>
      </div>

      <div
        className="mt-12 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        {PARTNER_AREAS.map((area) => {
          const Icon = ICON_MAP[area.icon];
          return (
            <div key={area.title} className="flex gap-4">
              <span className="cta-gradient flex h-11 w-11 flex-none items-center justify-center rounded-xl text-forest-deep">
                {Icon && <Icon size={21} strokeWidth={2.3} />}
              </span>
              <div>
                <div className="text-[17px] font-extrabold text-ink">
                  {area.title}
                </div>
                <p className="mb-0 mt-1 text-[14px] font-medium leading-[1.6] text-sage">
                  {area.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* start the conversation */}
      <div
        className="mt-14 flex flex-col items-start gap-6 rounded-[20px] bg-forest p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10"
        data-aos="fade-up"
      >
        <div>
          <div className="text-[22px] font-extrabold text-white sm:text-[26px]">
            Ready to electrify your fleet or your state?
          </div>
          <p className="mb-0 mt-2 max-w-[560px] text-[15px] font-medium leading-[1.65] text-mint-pale">
            Tell us what you are working on. We reply within one business day.
          </p>
        </div>
        <Link
          to="/contact?subject=Partnership"
          className="cta-gradient shrink-0 rounded-lg px-8 py-4 text-[15px] font-extrabold text-forest-deep transition-transform hover:scale-[1.03] hover:text-forest-deep"
        >
          Start the conversation →
        </Link>
      </div>
    </div>
  </section>
);

export default PartnerAreas;
