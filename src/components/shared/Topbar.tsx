import { COMPANY_INFO } from "@/data/site-data";

const TICKER_ITEMS = [
  COMPANY_INFO.location,
  COMPANY_INFO.hours,
  COMPANY_INFO.email,
  COMPANY_INFO.phone,
];

const Topbar = () => (
  <div className="overflow-hidden bg-forest px-5 py-2.5 sm:px-8 lg:px-16">
    {/* mobile: infinitely scrolling ticker */}
    <div className="overflow-hidden sm:hidden">
      <div className="animate-marquee flex w-max text-[12px] font-medium text-mint motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <span
            key={copy}
            aria-hidden={copy === 1}
            className="flex items-center whitespace-nowrap"
          >
            {TICKER_ITEMS.map((item) => (
              <span key={item} className="flex items-center">
                <span>{item}</span>
                <span className="px-3 text-mint-faint">·</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>

    {/* sm+: static split layout */}
    <div className="mx-auto hidden max-w-7xl items-center justify-between text-[13px] font-medium text-mint sm:flex">
      <span>
        {COMPANY_INFO.location} · {COMPANY_INFO.hours}
      </span>
      <span>
        {COMPANY_INFO.email} &nbsp;·&nbsp; {COMPANY_INFO.phone}
      </span>
    </div>
  </div>
);

export default Topbar;
