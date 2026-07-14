import { Link } from "react-router-dom";
import BoltMark from "@/components/shared/BoltMark";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { CONTACT_IMAGES, CONTACT_QUICK_STATS } from "@/data/contact-data";
import { cn } from "@/lib/utils";

const ContactSide = () => (
  <div className="flex flex-col gap-[22px]" data-aos="fade-up" data-aos-delay="100">
    {/* photo + floating badge */}
    <div className="relative">
      <img
        src={CONTACT_IMAGES.side}
        alt="The KGR depot"
        className="h-[240px] w-full rounded-[18px] object-cover shadow-[0_18px_44px_rgba(13,31,21,0.18)] sm:h-[300px]"
      />
      <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-[14px] bg-white px-4 py-3.5 shadow-[0_12px_30px_rgba(13,31,21,0.16)]">
        <span className="cta-gradient flex h-10 w-10 items-center justify-center rounded-[10px]">
          <BoltMark fill="#04170C" width={18} height={24} />
        </span>
        <div>
          <div className="text-[14px] font-extrabold text-ink">
            Depot visits welcome
          </div>
          <div className="text-[12px] font-semibold text-brand-500">
            By appointment · see the fleet charge
          </div>
        </div>
      </div>
    </div>

    {/* fleet owners card */}
    <div className="mt-3.5 flex flex-col gap-3.5 rounded-[18px] bg-forest p-6 lg:p-[26px]">
      <SectionEyebrow tone="neon">FLEET OWNERS</SectionEyebrow>
      <div className="text-[18px] font-extrabold leading-[1.35] text-white sm:text-[20px]">
        Own petrol or diesel vehicles? Ask about converting them to electric.
      </div>
      <Link
        to="/technology"
        className="cta-gradient self-start rounded-lg px-6 py-3 text-[14px] font-extrabold text-forest-deep hover:text-forest-deep"
      >
        How conversion works →
      </Link>
    </div>

    {/* quick stats */}
    <div className="grid grid-cols-3 divide-x divide-divider rounded-[18px] border border-line bg-white p-5 lg:p-[22px]">
      {CONTACT_QUICK_STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "flex flex-col gap-1",
            i > 0 && "pl-4 sm:pl-7",
            i < CONTACT_QUICK_STATS.length - 1 && "pr-3 sm:pr-7",
          )}
        >
          <div className="text-[20px] font-extrabold text-brand-500 sm:text-[24px]">
            {stat.value}
          </div>
          <div className="text-[12px] font-semibold text-fog">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ContactSide;
