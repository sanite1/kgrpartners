import { Mail, Phone, MapPin, type LucideIcon } from "lucide-react";
import { CONTACT_CHANNELS } from "@/data/contact-data";

// icons stored as string names in data, mapped to components here
const ICON_MAP: Record<string, LucideIcon> = {
  Mail,
  Phone,
  MapPin,
};

const ContactCards = () => (
  <section className="px-5 pt-16 sm:px-8 lg:px-16">
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
      {CONTACT_CHANNELS.map((channel, i) => {
        const Icon = ICON_MAP[channel.icon];
        return (
          <div
            key={channel.label}
            className="flex items-center gap-4 rounded-2xl border border-line bg-white p-6 lg:p-[26px]"
            data-aos="fade-up"
            data-aos-delay={i * 100}
          >
            <span className="cta-gradient flex h-[52px] w-[52px] flex-none items-center justify-center rounded-xl text-forest-deep">
              {Icon && <Icon size={22} strokeWidth={2.4} />}
            </span>
            <div>
              <div className="text-[13px] font-extrabold tracking-[1px] text-fog">
                {channel.label}
              </div>
              <div className="mt-[3px] text-[16px] font-extrabold text-ink lg:text-[17px]">
                {channel.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default ContactCards;
