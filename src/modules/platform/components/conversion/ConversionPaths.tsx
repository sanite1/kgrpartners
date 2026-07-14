import { Download, MousePointerClick, Mail } from "lucide-react";
import {
  CONVERSION_PDF_PATH,
  CONVERSION_MAILTO,
} from "@/data/conversion-data";

// Two ways in: fill the sheet online (below) or take the PDF away.
const ConversionPaths = () => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-aos="fade-up">
    {/* fill online */}
    <div className="flex flex-col gap-4 rounded-[20px] bg-forest p-7 lg:p-8">
      <span className="cta-gradient flex h-[52px] w-[52px] items-center justify-center rounded-xl text-forest-deep">
        <MousePointerClick size={24} strokeWidth={2.2} />
      </span>
      <div className="text-[20px] font-extrabold text-white sm:text-[22px]">
        Fill it online
      </div>
      <p className="m-0 text-[14px] font-medium leading-[1.65] text-mint-pale sm:text-[15px]">
        Six short steps, right on this page. Skip anything you are unsure of,
        and your answers save automatically so you can come back anytime.
      </p>
      <a
        href="#online-form"
        className="cta-gradient mt-1 self-start rounded-lg px-6 py-3 text-[14px] font-extrabold text-forest-deep hover:text-forest-deep"
      >
        Start below ↓
      </a>
    </div>

    {/* download */}
    <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-haze p-7 lg:p-8">
      <span className="cta-gradient flex h-[52px] w-[52px] items-center justify-center rounded-xl text-forest-deep">
        <Download size={24} strokeWidth={2.2} />
      </span>
      <div className="text-[20px] font-extrabold text-ink sm:text-[22px]">
        Prefer the paper trail?
      </div>
      <p className="m-0 text-[14px] font-medium leading-[1.65] text-bark sm:text-[15px]">
        Download the fillable PDF, complete it at your own pace (typed or
        printed), and email it back to us with your vehicle photos attached.
      </p>
      <div className="mt-1 flex flex-wrap gap-3">
        <a
          href={CONVERSION_PDF_PATH}
          download
          className="rounded-lg bg-ink px-6 py-3 text-[14px] font-extrabold text-white hover:text-white"
        >
          Download the form (PDF)
        </a>
        <a
          href={CONVERSION_MAILTO}
          className="flex items-center gap-2 rounded-lg border-2 border-brand-500 px-5 py-[10px] text-[14px] font-extrabold text-brand-600 transition-colors hover:bg-brand-50"
        >
          <Mail size={16} strokeWidth={2.4} />
          Email it back
        </a>
      </div>
    </div>
  </div>
);

export default ConversionPaths;
