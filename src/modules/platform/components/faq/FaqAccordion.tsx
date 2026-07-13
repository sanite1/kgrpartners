import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS } from "@/data/faq-data";

const FaqAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
      <div className="mx-auto flex max-w-[860px] flex-col gap-4">
        {FAQ_ITEMS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div
              key={item.question}
              className={cn(
                // no data-aos here: scroll-reveal + accordion layout shifts
                // leave cards stuck at opacity 0 when items above collapse
                "rounded-2xl border transition-colors",
                open ? "border-brand-500 bg-haze" : "border-line bg-white",
              )}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-6 py-5 text-left"
              >
                <span className="text-[16px] font-extrabold text-ink sm:text-[17px]">
                  {item.question}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-transform duration-300",
                    open
                      ? "cta-gradient rotate-45 text-forest-deep"
                      : "bg-mist text-ink",
                  )}
                >
                  <Plus size={18} strokeWidth={2.6} />
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="m-0 px-6 pb-5 text-[15px] font-medium leading-[1.7] text-bark">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl bg-mist p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[16px] font-extrabold text-ink">
            Still have a question we did not answer?
          </div>
          <Link
            to="/contact"
            className="cta-gradient rounded-lg px-6 py-3 text-[14px] font-extrabold text-forest-deep hover:text-forest-deep"
          >
            Ask us directly →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FaqAccordion;
