import { Link } from "react-router-dom";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { SERVICES } from "@/data/home-data";

const ServicesSection = () => (
  <section className="bg-white px-5 py-16 sm:px-8 lg:px-16">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div data-aos="fade-up">
          <SectionEyebrow>WHAT WE DO</SectionEyebrow>
          <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-ink sm:text-[32px] lg:text-[36px]">
            One company. The whole electric chain.
          </h2>
        </div>
        <Link
          to="/technology"
          className="shrink-0 text-[15px] font-bold text-brand-600 hover:text-brand-500"
        >
          All services →
        </Link>
      </div>

      {/* top three only; the full set lives on /technology via "All services" */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {SERVICES.slice(0, 3).map((service, i) => (
          <div
            key={service.title}
            className="group overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_16px_40px_rgba(13,31,21,0.1)]"
            data-aos="fade-up"
            data-aos-delay={i * 100}
          >
            <div className="h-[190px] overflow-hidden">
              <img
                src={service.image}
                alt={service.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col gap-2.5 p-6">
              <span className="text-[19px] font-extrabold text-ink">
                {service.title}
              </span>
              <p className="m-0 text-[14px] font-medium leading-[1.6] text-sage">
                {service.description}
              </p>
              <Link
                to={`/technology#${service.techId}`}
                className="text-[14px] font-extrabold text-brand-600 hover:text-brand-500"
              >
                Learn more →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
