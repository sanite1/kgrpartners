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
        KGR Partners started operations in 2017, moving people and goods across
        Nigeria with a fleet of conventional diesel buses. We soon met the
        familiar problems of the business: fuel crises, rising diesel costs
        eating into margins, smoke and emissions, and mechanical wear that made
        life harder for drivers and passengers alike.
      </p>
      <p className="m-0">
        Rather than accept those problems as the cost of doing business, we
        spent our early years serving communities while quietly building the
        technical knowledge to do things differently. In 2023 we made the
        decision that would redefine us. We left fossil fuels behind for good.
      </p>
    </div>
    </div>
  </section>
);

export default StoryIntro;
