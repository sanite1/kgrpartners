export interface HomeStat {
  value: string;
  label: string;
}

export const HERO_STATS: HomeStat[] = [
  { value: "800 kW", label: "Our own solar power" },
  { value: "100%", label: "Fleet converted" },
  { value: "0 L", label: "Diesel burned" },
];

export interface ServiceCard {
  title: string;
  description: string;
  image: string;
  // anchor of the matching system section on /technology
  techId: string;
}

export const SERVICES: ServiceCard[] = [
  {
    techId: "conversion",
    title: "Diesel to electric conversion",
    description:
      "Old engines out, silent electric powertrains in. Our own fleet was our first customer, and every bus earned a second life instead of a trip to the scrapyard.",
    image:
      "https://images.unsplash.com/photo-1529171918672-ba6d0733a56c?w=600&q=80",
  },
  {
    techId: "solar-charging",
    title: "Solar charging stations",
    description:
      "We designed and built our own stations, generating about 800 kW. That is more than the entire fleet needs to run on sunlight every single day.",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
  },
  {
    techId: "battery-swapping",
    title: "Battery swap network",
    description:
      "Depleted packs are exchanged for charged ones in minutes. Our buses keep moving while others sit and wait at chargers.",
    image:
      "https://images.unsplash.com/photo-1572816225927-d08fb138f2b2?w=600&q=80",
  },
];

export const STORY_CHECKS: string[] = [
  "Conversion over replacement, nothing to the scrapyard",
  "Solar stations designed and run by our own team",
  "Integrated battery swapping in minutes, not hours",
];

export const HERO_IMAGES = {
  main: "https://images.unsplash.com/photo-1573662766191-066ba9570a4b?w=800&q=80",
  secondary:
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
};

export const BENTO_IMAGES = {
  fleet:
    "https://images.unsplash.com/photo-1649502913092-fb7f0e8fc632?w=900&q=80",
  charging:
    "https://images.unsplash.com/photo-1648023199223-25d3622bcb13?w=600&q=80",
  workshop:
    "https://images.unsplash.com/photo-1529171918672-ba6d0733a56c?w=600&q=80",
};

export const STORY_IMAGE =
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80";
