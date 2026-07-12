import { Link } from "react-router-dom";
import BoltMark from "@/components/shared/BoltMark";
import { HERO_STATS, HERO_IMAGES } from "@/data/home-data";
import { cn } from "@/lib/utils";

const HomeHero = () => (
  <section className="relative overflow-hidden bg-linear-to-b from-haze to-white px-5 pb-16 pt-10 sm:px-8 lg:px-16 lg:pb-20 lg:pt-[72px]">
    {/* decorative circles */}
    <div className="pointer-events-none absolute -right-20 -top-[60px] h-[340px] w-[340px] rounded-full border-2 border-[#E2F5E6]" />
    <div className="pointer-events-none absolute right-[60px] top-5 h-[200px] w-[200px] rounded-full border-2 border-[#F5E9C9]" />

    <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-12">
    {/* copy */}
    <div
      className="relative flex flex-col justify-center gap-[22px]"
      data-aos="fade-up"
    >
      <span className="inline-flex items-center gap-2 text-[12px] font-extrabold tracking-[2px] text-brand-500 sm:text-[13px]">
        <span className="inline-block h-0.5 w-7 shrink-0 bg-solar" />
        NIGERIA'S SOLAR ELECTRIC TRANSPORT COMPANY
      </span>
      <h1 className="m-0 text-[38px] font-extrabold leading-[1.08] tracking-[-1.5px] text-ink sm:text-[48px] lg:text-[58px]">
        Moving people and goods on{" "}
        <span className="text-gradient-green">pure sunshine.</span>
      </h1>
      <p className="m-0 max-w-[500px] text-[16px] font-medium leading-[1.65] text-bark lg:text-[17px]">
        Since 2017 we have carried communities to work and to school. Today our
        converted electric buses run without a single breakdown, powered by our
        own 800&nbsp;kW solar stations, with battery swaps that take minutes
        rather than hours.
      </p>
      <div className="mt-1.5 flex flex-col gap-3.5 sm:flex-row">
        <Link
          to="/about"
          className="rounded-lg bg-ink px-[30px] py-[15px] text-center text-[15px] font-extrabold text-white transition-transform hover:scale-[1.02] hover:text-white"
        >
          Discover our story
        </Link>
        <Link
          to="/technology"
          className="rounded-lg border-2 border-brand-500 px-7 py-[13px] text-center text-[15px] font-extrabold text-brand-600 transition-colors hover:bg-brand-50"
        >
          ▶ See how it works
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-divider">
        {HERO_STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-1",
              i > 0 && "pl-4 sm:pl-8",
              i < HERO_STATS.length - 1 && "pr-3 sm:pr-8",
            )}
          >
            <div className="text-[22px] font-extrabold text-ink sm:text-[30px]">
              {stat.value}
            </div>
            <div className="text-[12px] font-semibold text-fog sm:text-[13px]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* photo collage */}
    <div
      className="relative mt-12 min-h-[340px] sm:min-h-[420px] lg:mt-0 lg:min-h-[480px]"
      data-aos="fade-left"
      data-aos-delay="150"
    >
      <img
        src={HERO_IMAGES.main}
        alt="KGR electric bus on the road"
        className="absolute right-0 top-0 h-[230px] w-[78%] rounded-[18px] object-cover shadow-[0_18px_44px_rgba(13,31,21,0.22)] sm:h-[300px] lg:h-[340px]"
      />
      <img
        src={HERO_IMAGES.secondary}
        alt="KGR solar charging station"
        className="absolute bottom-0 left-0 h-[150px] w-[52%] rounded-[18px] border-[6px] border-white object-cover shadow-[0_18px_44px_rgba(13,31,21,0.22)] sm:h-[200px] lg:h-[220px]"
      />
      <div className="absolute bottom-[90px] right-2 flex items-center gap-3 rounded-[14px] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(13,31,21,0.18)] sm:bottom-[120px] sm:right-3.5 sm:px-5 sm:py-4">
        <span className="cta-gradient flex h-[42px] w-[42px] items-center justify-center rounded-[10px]">
          <BoltMark fill="#04170C" width={20} height={26} />
        </span>
        <div>
          <div className="text-[15px] font-extrabold text-ink">
            Solar station live
          </div>
          <div className="text-[12px] font-semibold text-brand-500">
            Generating · fleet charged
          </div>
        </div>
      </div>
    </div>
    </div>
  </section>
);

export default HomeHero;
