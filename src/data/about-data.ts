export interface TimelineEntry {
  period: string;
  title: string;
  description: string;
  accent: "solar" | "brand" | "neon";
  dark?: boolean;
}

export const TIMELINE: TimelineEntry[] = [
  {
    period: "2017",
    title: "We start driving",
    description:
      "KGR Partners registers with the CAC and puts a conventional fuel-powered fleet on the road, moving people and goods across the Kaduna metropolis every day.",
    accent: "solar",
  },
  {
    period: "2017 to 2023",
    title: "We learn and prepare",
    description:
      "Volatile fuel costs and heavy maintenance push us to build the engineering skill to reimagine the fleet from the ground up.",
    accent: "solar",
  },
  {
    period: "Late 2023",
    title: "We go electric",
    description:
      "Our first batch of vehicles is retrofitted to full electric power and tested across Kaduna's urban terrain. The remaining fleet follows, charged by our own solar stations.",
    accent: "brand",
  },
  {
    period: "Today",
    title: "We build our own EVs",
    description:
      "Over 30 months of zero-emission, revenue-generating operation. And beyond converting, we now build electric tricycles from scratch with locally sourced materials.",
    accent: "neon",
    dark: true,
  },
];

export interface BeliefItem {
  title: string;
  description: string;
}

export const BELIEFS: BeliefItem[] = [
  {
    title: "Renew what already exists",
    description:
      "A converted bus is cheaper, cleaner and prouder than a scrapped one. Second life beats first waste.",
  },
  {
    title: "Own the whole chain",
    description:
      "Our buses, our solar stations, our batteries. When you build it yourself, no fuel crisis can touch you.",
  },
  {
    title: "Prove it on the road",
    description:
      "Sustainable transport is not a distant ambition. Our passengers ride the proof every morning.",
  },
];

export const VISION =
  "To be the leading indigenous electric vehicle mobility company in Nigeria, driving a clean, affordable, and sustainable transportation revolution from Northern Nigeria to the entire nation.";

export const MISSION =
  "To deliver reliable, locally adapted electric vehicle solutions and off-grid solar charging infrastructure that reduce transportation costs, cut carbon emissions, and create economic opportunities for Nigerian communities nationwide.";

export const ABOUT_IMAGES = {
  header:
    "https://images.unsplash.com/photo-1649502913092-fb7f0e8fc632?w=1400&q=80",
  values:
    "https://images.unsplash.com/photo-1573662766191-066ba9570a4b?w=800&q=80",
};
