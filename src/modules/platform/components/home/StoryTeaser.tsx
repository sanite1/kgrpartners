import { Link } from "react-router-dom";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { STORY_CHECKS, STORY_IMAGE } from "@/data/home-data";

const StoryTeaser = () => (
  <section className="bg-mist px-5 py-16 sm:px-8 lg:px-16 lg:py-[72px]">
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2">
      <div className="relative" data-aos="fade-right">
        <img
          src={STORY_IMAGE}
          alt="KGR solar panels"
          className="h-[280px] w-full rounded-[20px] object-cover sm:h-[400px]"
        />
        <div className="cta-gradient absolute -bottom-5 right-2 rounded-2xl px-5 py-4 text-[14px] font-extrabold text-forest-deep shadow-[0_14px_30px_rgba(4,23,12,0.2)] sm:-bottom-[22px] sm:-right-[18px] sm:px-6 sm:py-[18px] sm:text-[16px]">
          ☀ Powered by our own sun
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-[18px] lg:mt-0" data-aos="fade-up">
        <SectionEyebrow>WHO WE ARE</SectionEyebrow>
        <h2 className="m-0 text-[30px] font-extrabold leading-[1.15] tracking-[-1px] text-ink sm:text-[36px] lg:text-[40px]">
          We did not buy a green fleet. We built one.
        </h2>
        <p className="m-0 text-[16px] font-medium leading-[1.7] text-bark">
          Volatile fuel costs and heavy maintenance pushed us to a decision in
          late 2023: leave fossil fuels behind for good. Instead of scrapping
          our ageing vehicles, we gave them a second life, rebuilt by our own
          engineers as clean, silent electric machines. Today we go further and
          build electric tricycles from scratch, right here in Kaduna.
        </p>
        <div className="mt-1.5 flex flex-col gap-3 text-[15px] font-bold text-ink">
          {STORY_CHECKS.map((check) => (
            <span key={check}>
              <span className="text-brand-500">✓</span> &nbsp;{check}
            </span>
          ))}
        </div>
        <Link
          to="/about"
          className="mt-2 self-start rounded-full bg-ink px-[30px] py-3.5 text-[15px] font-extrabold text-white transition-transform hover:scale-[1.02] hover:text-white"
        >
          Read the full story →
        </Link>
      </div>
    </div>
  </section>
);

export default StoryTeaser;
