import { Eye, Compass, type LucideIcon } from "lucide-react";
import { VISION, MISSION } from "@/data/about-data";
import { cn } from "@/lib/utils";

interface VmCard {
  title: string;
  text: string;
  icon: string;
  dark?: boolean;
}

const CARDS: VmCard[] = [
  { title: "Our Vision", text: VISION, icon: "Eye", dark: true },
  { title: "Our Mission", text: MISSION, icon: "Compass" },
];

const ICON_MAP: Record<string, LucideIcon> = { Eye, Compass };

const VisionMission = () => (
  <section className="bg-white px-5 pb-16 sm:px-8 lg:px-16 lg:pb-20">
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
      {CARDS.map((card, i) => {
        const Icon = ICON_MAP[card.icon];
        return (
          <div
            key={card.title}
            className={cn(
              "flex flex-col gap-4 rounded-[20px] p-8 lg:p-10",
              card.dark ? "bg-forest" : "border border-line bg-haze",
            )}
            data-aos="fade-up"
            data-aos-delay={i * 100}
          >
            <span className="cta-gradient flex h-[52px] w-[52px] items-center justify-center rounded-xl text-forest-deep">
              {Icon && <Icon size={24} strokeWidth={2.2} />}
            </span>
            <span
              className={cn(
                "text-[22px] font-extrabold tracking-[-0.5px]",
                card.dark ? "text-white" : "text-ink",
              )}
            >
              {card.title}
            </span>
            <p
              className={cn(
                "m-0 text-[15px] font-medium leading-[1.75] sm:text-[16px]",
                card.dark ? "text-mint-pale" : "text-bark",
              )}
            >
              {card.text}
            </p>
          </div>
        );
      })}
    </div>
  </section>
);

export default VisionMission;
