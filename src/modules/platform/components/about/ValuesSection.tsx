import BoltMark from "@/components/shared/BoltMark";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { BELIEFS, ABOUT_IMAGES } from "@/data/about-data";

const ValuesSection = () => (
  <section className="px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
      <div className="relative" data-aos="fade-right">
        <img
          src={ABOUT_IMAGES.values}
          alt="A converted KGR electric bus"
          className="h-[300px] w-full rounded-[20px] object-cover sm:h-[420px]"
        />
        <div className="absolute -bottom-5 left-2 flex items-center gap-3.5 rounded-2xl bg-ink px-5 py-4 shadow-[0_14px_30px_rgba(4,23,12,0.25)] sm:-bottom-[22px] sm:-left-[18px] sm:px-[26px] sm:py-5">
          <BoltMark width={22} height={30} />
          <div className="text-[15px] font-extrabold leading-snug text-white sm:text-[16px]">
            Every vehicle kept.
            <br />
            <span className="text-[13px] font-semibold text-mint-soft">
              Nothing sent to the scrapyard
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-[22px] lg:mt-0" data-aos="fade-up">
        <SectionEyebrow>WHAT WE BELIEVE</SectionEyebrow>
        <h2 className="m-0 text-[30px] font-extrabold leading-[1.15] tracking-[-1px] text-ink sm:text-[34px] lg:text-[38px]">
          Sustainability that pays its own way
        </h2>
        <div className="flex flex-col gap-5">
          {BELIEFS.map((belief, i) => (
            <div key={belief.title} className="flex gap-4">
              <span className="cta-gradient flex h-11 w-11 flex-none items-center justify-center rounded-xl text-[18px] font-extrabold text-forest-deep">
                {i + 1}
              </span>
              <div>
                <div className="text-[17px] font-extrabold text-ink">
                  {belief.title}
                </div>
                <p className="mb-0 mt-1 text-[14px] font-medium leading-[1.6] text-sage">
                  {belief.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ValuesSection;
