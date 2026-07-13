import { COMPANY_COUNTERS } from "@/data/home-data";
import { cn } from "@/lib/utils";

// Secondary stats bar: founded, fleet, commuters, staff, indirect jobs.
const CountersBand = () => (
  <section className="bg-ink px-5 py-10 sm:px-8 lg:px-16">
    <div
      className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5"
      data-aos="fade-up"
    >
      {COMPANY_COUNTERS.map((counter, i) => (
        <div
          key={counter.label}
          className={cn(
            "flex flex-col items-center gap-1 text-center",
            // odd item out on the 2-col mobile grid sits centered on its own row
            i === COMPANY_COUNTERS.length - 1 && "col-span-2 sm:col-span-1",
          )}
        >
          <div className="text-[26px] font-extrabold text-white sm:text-[30px]">
            {counter.value}
          </div>
          <div className="text-[13px] font-semibold text-mint-soft">
            {counter.label}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default CountersBand;
