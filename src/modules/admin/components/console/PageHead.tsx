import type { ReactNode } from "react";
import SectionEyebrow from "@/components/shared/SectionEyebrow";

interface PageHeadProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHead = ({ eyebrow, title, subtitle, actions }: PageHeadProps) => (
  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h1 className="mb-0 mt-1.5 text-[26px] font-extrabold tracking-[-0.5px] text-ink sm:text-[30px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mb-0 mt-1.5 text-[14px] font-medium text-sage">
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
  </div>
);

export default PageHead;
