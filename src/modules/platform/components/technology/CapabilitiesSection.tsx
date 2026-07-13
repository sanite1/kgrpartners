import { Globe, GraduationCap, type LucideIcon } from "lucide-react";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { CAPABILITIES } from "@/data/technology-data";

const ICON_MAP: Record<string, LucideIcon> = {
  Globe,
  GraduationCap,
};

// Capabilities beyond the three fleet systems: partnerships and training.
const CapabilitiesSection = () => (
  <section className="bg-white px-5 py-16 sm:px-8 lg:px-16">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8" data-aos="fade-up">
        <SectionEyebrow>BEYOND THE FLEET</SectionEyebrow>
        <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-ink sm:text-[32px] lg:text-[36px]">
          Capability that stays in Nigeria
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {CAPABILITIES.map((capability, i) => {
          const Icon = ICON_MAP[capability.icon];
          return (
            <div
              key={capability.title}
              className="flex items-start gap-5 rounded-2xl border border-line bg-white p-6 lg:p-7"
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              <span className="cta-gradient flex h-[52px] w-[52px] flex-none items-center justify-center rounded-xl text-forest-deep">
                {Icon && <Icon size={24} strokeWidth={2.2} />}
              </span>
              <div>
                <div className="text-[18px] font-extrabold text-ink lg:text-[19px]">
                  {capability.title}
                </div>
                <p className="mb-0 mt-1.5 text-[14px] font-medium leading-[1.6] text-sage">
                  {capability.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default CapabilitiesSection;
