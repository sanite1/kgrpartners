import SectionEyebrow from "@/components/shared/SectionEyebrow";

const StoryIntro = () => (
  <section className="px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-16">
    <div className="flex flex-col gap-[18px]" data-aos="fade-up">
      <SectionEyebrow>OUR STORY</SectionEyebrow>
      <h2 className="m-0 text-[30px] font-extrabold leading-[1.15] tracking-[-1px] text-ink sm:text-[36px] lg:text-[40px]">
        We began where every Nigerian transporter begins. On the road, in
        traffic, at the pump.
      </h2>
    </div>
    <div
      className="flex flex-col gap-[18px] text-[16px] font-medium leading-[1.75] text-bark"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      <p className="m-0">
        KGR Partners Ltd is an indigenous Nigerian clean energy mobility
        company headquartered in Kaduna State. Founded in 2017 and registered
        with the Corporate Affairs Commission (RC: 7451921), we were
        established to provide affordable, efficient and sustainable township
        mobility services within the Kaduna metropolis.
      </p>
      <p className="m-0">
        Since commencing commercial operations in 2017, we have grown from a
        conventional internal combustion engine transport operator into one of
        the few private companies in Northern Nigeria running commercially
        converted electric vehicles on public roads. Not as a pilot, but as a
        fully operational, revenue-generating transport business.
      </p>
    </div>
    </div>
  </section>
);

export default StoryIntro;
