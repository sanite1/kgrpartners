import { cn } from "@/lib/utils";
import type { TechSystem } from "@/data/technology-data";

interface SystemSectionProps {
  system: TechSystem;
  first?: boolean;
  last?: boolean;
}

// One numbered system block (01 / 02 / 03), image alternating sides.
const SystemSection = ({ system, first, last }: SystemSectionProps) => (
  <section
    id={system.id}
    className={cn(
      // scroll-mt clears the sticky navbar when arriving via a #hash link
      "scroll-mt-24 px-5 py-10 sm:px-8 lg:px-16",
      first && "lg:pt-[88px]",
      last && "lg:pb-[88px]",
    )}
  >
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div
        className={cn(
          "flex flex-col gap-[18px]",
          system.imageFirst && "lg:order-2",
        )}
        data-aos="fade-up"
      >
        <span
          className={cn(
            "text-[48px] font-extrabold leading-none sm:text-[60px]",
            system.accent === "brand"
              ? "text-stroke-brand text-[#EAF2EA]"
              : "text-stroke-solar text-[#FDF6E3]",
          )}
        >
          {system.number}
        </span>
        <h2 className="m-0 text-[28px] font-extrabold leading-[1.15] tracking-[-1px] text-ink sm:text-[34px] lg:text-[38px]">
          {system.title}
        </h2>
        <p className="m-0 text-[16px] font-medium leading-[1.75] text-bark">
          {system.description}
        </p>
        <div className="mt-2 grid grid-cols-3 divide-x divide-divider">
          {system.stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col gap-1",
                i > 0 && "pl-4 sm:pl-7",
                i < system.stats.length - 1 && "pr-3 sm:pr-7",
              )}
            >
              <div
                className={cn(
                  "text-[20px] font-extrabold sm:text-[26px]",
                  system.accent === "brand"
                    ? "text-brand-500"
                    : "text-solar-700",
                )}
              >
                {stat.value}
              </div>
              <div className="text-[12px] font-semibold text-fog sm:text-[13px]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <img
        src={system.image}
        alt={system.title}
        loading="lazy"
        decoding="async"
        className={cn(
          "h-[260px] w-full rounded-[20px] object-cover sm:h-[380px]",
          system.imageFirst && "lg:order-1",
        )}
        data-aos={system.imageFirst ? "fade-right" : "fade-left"}
      />
    </div>
  </section>
);

export default SystemSection;
