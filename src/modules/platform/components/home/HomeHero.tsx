import { Link } from "react-router-dom";
import BoltMark from "@/components/shared/BoltMark";
import { HERO_IMAGES } from "@/data/home-data";

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
        {/* status-pill eyebrow, echoing the "Solar station live" badge idiom */}
        <span className="inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full border border-brand-200 bg-white py-2 pl-3 pr-3.5 text-[10px] font-extrabold tracking-[0.5px] text-brand-600 shadow-[0_4px_14px_rgba(15,165,58,0.12)] sm:gap-2.5 sm:pl-3.5 sm:pr-4 sm:text-[12px] sm:tracking-[2px]">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solar opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-solar" />
          </span>
          NIGERIA'S SOLAR ELECTRIC TRANSPORT COMPANY
        </span>
        <h1 className="m-0 text-[38px] font-extrabold leading-[1.08] tracking-[-1.5px] text-ink sm:text-[48px] lg:text-[56px]">
          Driving Nigeria's{" "}
          <span className="text-gradient-green">clean energy future</span>, one
          electric vehicle at a time.
        </h1>
        <p className="m-0 max-w-[520px] text-[16px] font-medium leading-[1.65] text-bark lg:text-[17px]">
          KGR Partners Ltd is an indigenous Nigerian clean energy mobility
          company headquartered in Kaduna State. We build our own electric
          tricycles from scratch, convert commercial buses to electric, and
          charge the entire fleet on our own 800kW DC off-grid solar
          infrastructure. No fossil fuel. No grid dependency. Just a fully
          operational transport business moving over 5,000 commuters every day.
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
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute right-0 top-0 h-[230px] w-[78%] rounded-[18px] object-cover shadow-[0_18px_44px_rgba(13,31,21,0.22)] sm:h-[300px] lg:h-[340px]"
        />
        <img
          src={HERO_IMAGES.secondary}
          alt="KGR solar charging station"
          decoding="async"
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
