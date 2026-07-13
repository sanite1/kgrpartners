import { Mail, Phone, MapPin, type LucideIcon } from "lucide-react";
import BoltMark from "@/components/shared/BoltMark";
import { CONTACT_CHANNELS } from "@/data/contact-data";
import { COMPANY_INFO } from "@/data/site-data";

const ICON_MAP: Record<string, LucideIcon> = {
  Mail,
  Phone,
  MapPin,
};

// fixed bar widths for the ticket barcode flourish
const BARCODE = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3];

// The three contact channels styled as one KGR transit pass: perforated
// dashed dividers with punch-hole notches, validity strip and barcode.
const ContactCards = () => (
  <section className="px-5 pt-16 sm:px-8 lg:px-16">
    <div className="mx-auto max-w-7xl" data-aos="fade-up">
      <div className="rounded-[20px] bg-forest shadow-[0_18px_44px_rgba(4,23,12,0.25)]">
        {/* ticket header */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b-2 border-dashed border-forest-border px-6 py-4 sm:px-8">
          <span className="flex items-center gap-2.5 text-[12px] font-extrabold tracking-[2px] text-neon">
            <BoltMark width={11} height={15} />
            KGR TRANSIT PASS
          </span>
          <div className="flex items-center gap-5">
            <span className="text-[11px] font-bold tracking-[1.5px] text-mint-soft sm:text-[12px]">
              VALID {COMPANY_INFO.hours.toUpperCase()}
            </span>
            <span className="hidden h-5 items-end gap-[3px] sm:flex" aria-hidden="true">
              {BARCODE.map((width, i) => (
                <span
                  key={i}
                  style={{ width: `${width}px` }}
                  className="h-full bg-mint-soft/60"
                />
              ))}
            </span>
          </div>
        </div>

        {/* the three channels, separated by perforations */}
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {CONTACT_CHANNELS.map((channel, i) => {
            const Icon = ICON_MAP[channel.icon];
            const external = channel.href.startsWith("http");
            return (
              <a
                key={channel.label}
                href={channel.href}
                {...(external && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                className="group relative flex items-center gap-4 px-6 py-6 sm:px-8 lg:py-7"
              >
                {i > 0 && (
                  <>
                    {/* mobile: horizontal perforation with side notches */}
                    <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-forest-border lg:hidden" />
                    <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-white lg:hidden" />
                    <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-white lg:hidden" />
                    {/* desktop: vertical perforation with top/bottom notches */}
                    <span className="absolute bottom-5 left-0 top-5 hidden border-l-2 border-dashed border-forest-border lg:block" />
                    <span className="absolute -left-2.5 -top-2.5 hidden h-5 w-5 rounded-full bg-white lg:block" />
                    <span className="absolute -bottom-2.5 -left-2.5 hidden h-5 w-5 rounded-full bg-white lg:block" />
                  </>
                )}
                <span className="cta-gradient flex h-[52px] w-[52px] flex-none items-center justify-center rounded-xl text-forest-deep transition-transform group-hover:scale-105">
                  {Icon && <Icon size={22} strokeWidth={2.4} />}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold tracking-[1.5px] text-mint-soft">
                    {channel.label}
                  </div>
                  <div className="mt-1 truncate text-[15px] font-extrabold text-white transition-colors group-hover:text-neon sm:text-[16px]">
                    {channel.value}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default ContactCards;
