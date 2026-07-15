import { Link } from "react-router-dom";
import BoltMark from "@/components/shared/BoltMark";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import LiveCo2Ticker from "./LiveCo2Ticker";
import { BENTO_IMAGES } from "@/data/home-data";

// "At a glance" bento grid — 4 columns on desktop, a 2-column bento on
// mobile so the collage feel survives small screens.
const BentoSection = () => (
  <section className="bg-mist px-5 py-16 sm:px-8 lg:px-16">
    <div className="mx-auto max-w-7xl">
    <div className="mb-8" data-aos="fade-up">
      <SectionEyebrow>AT A GLANCE</SectionEyebrow>
      <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-ink sm:text-[32px] lg:text-[36px]">
        A working reality, not a promise.
      </h2>
    </div>

    <div
      className="grid auto-rows-[130px] grid-cols-2 gap-3 sm:auto-rows-[150px] sm:gap-4 lg:grid-cols-4"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      {/* big fleet photo */}
      <div className="relative col-span-2 row-span-2 overflow-hidden rounded-[20px]">
        <img
          src={BENTO_IMAGES.fleet}
          alt="The KGR electric fleet"
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-4 left-4 rounded-[10px] bg-[rgba(13,31,21,0.85)] px-4 py-2.5 text-[13px] font-extrabold text-white sm:bottom-[18px] sm:left-5 sm:text-[14px]">
          The fleet · moving since 2017
        </div>
      </div>

      {/* 800kW DC dark card */}
      <div className="flex flex-col justify-between rounded-[20px] bg-ink p-5 sm:p-[22px]">
        <BoltMark width={26} height={34} />
        <div>
          <div className="text-[24px] font-extrabold text-white sm:text-[30px]">
            800kW DC
          </div>
          <div className="text-[12px] font-semibold text-mint-soft sm:text-[13px]">
            our own off-grid solar power
          </div>
        </div>
      </div>

      {/* charging photo */}
      <div className="overflow-hidden rounded-[20px]">
        <img
          src={BENTO_IMAGES.charging}
          alt="Charging bay"
          className="h-full w-full object-cover"
        />
      </div>

      {/* swap-time gradient card */}
      <div className="cta-gradient flex flex-col justify-between rounded-[20px] p-5 sm:p-[22px]">
        <div className="text-[24px] font-extrabold text-forest-deep sm:text-[30px]">
          &lt; 5 min
        </div>
        <div className="text-[13px] font-bold text-forest-deep sm:text-[14px]">
          battery swap, so vehicles never wait at chargers
        </div>
      </div>

      {/* workshop photo */}
      <div className="overflow-hidden rounded-[20px]">
        <img
          src={BENTO_IMAGES.workshop}
          alt="Conversion workshop"
          className="h-full w-full object-cover"
        />
      </div>

      {/* 100% converted card */}
      <div className="flex flex-col justify-between rounded-[20px] border border-card-line bg-white p-5 sm:p-[22px]">
        <div className="text-[24px] font-extrabold text-ink sm:text-[30px]">
          100<span className="text-solar">%</span>
        </div>
        <div className="text-[12px] font-semibold text-fog-deep sm:text-[13px]">
          of the fleet converted to electric
        </div>
      </div>

      {/* CO₂ eliminated card — live ticker, the fleet never stands still */}
      <div className="flex flex-col justify-between rounded-[20px] bg-forest p-5 sm:p-[22px]">
        <div className="text-[24px] font-extrabold text-neon sm:text-[28px]">
          <LiveCo2Ticker />
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-mint-soft sm:text-[13px]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
          </span>
          of CO₂ eliminated, and counting
        </div>
      </div>

      {/* quote + CTA cell */}
      <div className="col-span-2 flex flex-col items-start justify-center gap-4 rounded-[20px] border border-card-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-[22px]">
        <div className="text-[16px] font-extrabold leading-[1.3] text-ink sm:text-[20px]">
          "Living proof that sustainable public transport is a working
          reality."
        </div>
        <Link
          to="/about"
          className="whitespace-nowrap rounded-[10px] bg-ink px-6 py-[13px] text-[14px] font-extrabold text-white hover:text-white"
        >
          Our story →
        </Link>
      </div>
    </div>
    </div>
  </section>
);

export default BentoSection;
