export interface HomeStat {
  value: string;
  label: string;
}

// the original design's stat trio, values corrected to the real data
export const HERO_STATS: HomeStat[] = [
  { value: "800kW DC", label: "Our own solar power" },
  { value: "100%", label: "Fleet converted" },
  { value: "4,158t", label: "CO₂ eliminated" },
];

// secondary stats bar from the content plan
export const COMPANY_COUNTERS: HomeStat[] = [
  { value: "2017", label: "Founded" },
  { value: "50+", label: "Fleet size" },
  { value: "5,000+", label: "Daily commuters" },
  { value: "100+", label: "Total staff" },
  { value: "300+", label: "Indirect jobs" },
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
    techId: "manufacturing",
    title: "Local tricycle manufacturing",
    description:
      "We do not just convert. We design and build electric tricycles (Keke NAPEP) from scratch using locally sourced materials, right here in Kaduna.",
    image:
      "https://images.unsplash.com/photo-1549383433-0d8ef3f38afa?w=600&q=80",
  },
  {
    techId: "conversion",
    title: "Petrol to electric conversion",
    description:
      "Old engines out, silent electric powertrains in. We retrofit commercial buses and Keke NAPEP tricycles, and every vehicle earns a second life instead of a trip to the scrapyard.",
    image:
      "https://images.unsplash.com/photo-1529171918672-ba6d0733a56c?w=600&q=80",
  },
  {
    techId: "solar-charging",
    title: "Solar charging stations",
    description:
      "We designed and built 4 off-grid stations generating about 800kW DC combined. That is more than the entire fleet needs to run on sunlight every single day.",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
  },
  {
    techId: "battery-swapping",
    title: "Battery swap network",
    description:
      "Depleted packs are exchanged for fully charged ones in under 5 minutes. Our vehicles keep moving while others sit and wait at chargers.",
    image:
      "https://images.unsplash.com/photo-1572816225927-d08fb138f2b2?w=600&q=80",
  },
];

export const STORY_CHECKS: string[] = [
  "Electric tricycles built from scratch with locally sourced materials",
  "4 off-grid solar stations designed and run by our own team",
  "Integrated battery swapping in under 5 minutes, not hours",
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
