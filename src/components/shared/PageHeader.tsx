import { Link } from "react-router-dom";
import SectionEyebrow from "./SectionEyebrow";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  crumb: string;
  image: string;
}

// Shared photo header used by About / Technology / Contact.
const PageHeader = ({ eyebrow, title, crumb, image }: PageHeaderProps) => (
  <div className="relative min-h-[280px] sm:min-h-[340px] lg:h-[360px]">
    <img
      src={image}
      alt=""
      loading="eager"
      fetchPriority="high"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="header-overlay absolute inset-0" />
    <div className="relative px-5 py-16 sm:px-8 sm:py-20 lg:px-16 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-3.5">
        <SectionEyebrow tone="neon" className="tracking-[3px]">
          {eyebrow}
        </SectionEyebrow>
        <h1 className="m-0 max-w-[700px] text-[34px] font-extrabold leading-[1.1] tracking-[-1.5px] text-white sm:text-[44px] lg:text-[52px]">
          {title}
        </h1>
        <span className="text-[14px] font-semibold text-mint-pale">
          <Link to="/" className="text-mint-pale hover:text-neon">
            Home
          </Link>
          &nbsp;&nbsp;/&nbsp;&nbsp;{crumb}
        </span>
      </div>
    </div>
  </div>
);

export default PageHeader;
