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
      "A diesel fleet begins moving people and goods across Nigerian roads, serving workers, students and traders every day.",
    accent: "solar",
  },
  {
    period: "2017 to 2022",
    title: "We learn and prepare",
    description:
      "While serving our routes, we build the engineering skill and capability to reimagine the fleet from the ground up.",
    accent: "solar",
  },
  {
    period: "2023",
    title: "We go electric",
    description:
      "Old engines come out, silent electric powertrains go in. Our solar stations rise and the battery swap system goes live.",
    accent: "brand",
  },
  {
    period: "Today",
    title: "We run on sunshine",
    description:
      "Nearly two years electric, without a single breakdown, insulated from fuel prices and free of diesel fumes.",
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

export const ABOUT_IMAGES = {
  header:
    "https://images.unsplash.com/photo-1649502913092-fb7f0e8fc632?w=1400&q=80",
  values:
    "https://images.unsplash.com/photo-1573662766191-066ba9570a4b?w=800&q=80",
};
