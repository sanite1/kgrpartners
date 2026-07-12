import { Link } from "react-router-dom";
import { COMPANY_INFO, FOOTER_COLUMNS } from "@/data/site-data";
import logoWhite from "@/assets/kgr-logo-white.png";

const Footer = () => (
  <footer className="bg-forest-deep px-5 pb-7 pt-14 sm:px-8 lg:px-16">
    <div className="mx-auto max-w-7xl">
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-b border-forest-line pb-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
      <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
        <img
          src={logoWhite}
          alt="KGR Partners"
          className="h-auto w-[170px] lg:w-[190px]"
        />
        <p className="m-0 max-w-[300px] text-[14px] font-medium leading-[1.7] text-mint-dim">
          {COMPANY_INFO.blurb}
        </p>
      </div>

      {FOOTER_COLUMNS.map((col) => (
        <div
          key={col.title}
          className="flex flex-col gap-3 text-[14px] font-semibold"
        >
          <span className="mb-1.5 text-[14px] font-extrabold text-white">
            {col.title}
          </span>
          {col.links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-mint transition-colors hover:text-neon"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ))}

      <div className="col-span-2 flex flex-col gap-3 text-[14px] font-semibold text-mint lg:col-span-1">
        <span className="mb-1.5 text-[14px] font-extrabold text-white">
          Reach us
        </span>
        <span>{COMPANY_INFO.location}</span>
        <span>{COMPANY_INFO.email}</span>
        <span>{COMPANY_INFO.phone}</span>
      </div>
    </div>

    <div className="flex flex-col items-center gap-2 pt-6 text-center text-[13px] font-medium text-mint-faint sm:flex-row sm:justify-between sm:text-left">
      <span>© 2026 KGR Partners. All rights reserved.</span>
      <span>Powered by sunshine ☀</span>
    </div>
    </div>
  </footer>
);

export default Footer;
