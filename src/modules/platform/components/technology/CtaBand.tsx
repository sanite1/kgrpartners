import { Link } from "react-router-dom";

const CtaBand = () => (
  <section className="border-b border-line bg-white px-5 py-14 sm:px-8 lg:px-16">
    <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div data-aos="fade-up">
        <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.5px] text-ink sm:text-[30px]">
          Want this for your own fleet?
        </h2>
        <p className="mb-0 mt-2 text-[15px] font-medium text-sage">
          We convert, we power, we keep you moving. Talk to our engineers.
        </p>
      </div>
      <Link
        to="/contact"
        className="cta-gradient shrink-0 rounded-lg px-8 py-4 text-[15px] font-extrabold text-forest-deep transition-transform hover:scale-[1.03] hover:text-forest-deep"
      >
        Get in touch →
      </Link>
    </div>
  </section>
);

export default CtaBand;
