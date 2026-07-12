import { Link } from "react-router-dom";
import { QUOTE_TEXT, QUOTE_ACCENT } from "@/data/site-data";

interface QuoteBandProps {
  ctaLabel: string;
  ctaTo: string;
}

// The dark "hope, ingenuity and sunshine" band — CTA differs per page.
const QuoteBand = ({ ctaLabel, ctaTo }: QuoteBandProps) => (
  <div className="bg-forest px-5 py-12 sm:px-8 lg:px-16">
    <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-[600px] text-[22px] font-extrabold leading-[1.3] text-white sm:text-[26px] lg:text-[28px]">
        "{QUOTE_TEXT} <span className="text-solar">{QUOTE_ACCENT}</span>"
      </div>
      <Link
        to={ctaTo}
        className="cta-gradient rounded-lg px-8 py-4 text-[15px] font-extrabold text-forest-deep transition-transform hover:scale-[1.03] hover:text-forest-deep"
      >
        {ctaLabel} →
      </Link>
    </div>
  </div>
);

export default QuoteBand;
