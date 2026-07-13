export interface TechStat {
  value: string;
  label: string;
}

export interface TechSystem {
  id: string;
  number: string;
  title: string;
  description: string;
  stats: TechStat[];
  image: string;
  accent: "brand" | "solar";
  imageFirst?: boolean;
}

export const TECH_SYSTEMS: TechSystem[] = [
  {
    id: "conversion",
    number: "01",
    title: "Diesel to electric conversion",
    description:
      "Every vehicle in our fleet once burned petrol or diesel. Our engineers strip out the old engine, gearbox and fuel system, then install a silent electric powertrain built for Nigerian road and load conditions. We electrify 10-seater commercial buses and Keke NAPEP tricycles alike. Only the smoke leaves.",
    stats: [
      { value: "100%", label: "of our fleet converted" },
      { value: "50+", label: "buses and tricycles" },
      { value: "0", label: "vehicles scrapped" },
    ],
    image:
      "https://images.unsplash.com/photo-1529171918672-ba6d0733a56c?w=800&q=80",
    accent: "brand",
  },
  {
    id: "solar-charging",
    number: "02",
    title: "Solar charging stations",
    description:
      "We built our own charging infrastructure rather than wait for the grid. Our 4 off-grid solar stations generate roughly 800kW DC combined, fully independent of the national grid. Every kilometre we drive is powered by Nigerian sunlight, even where public power supply is unreliable.",
    stats: [
      { value: "800kW DC", label: "combined solar capacity" },
      { value: "4", label: "off-grid charging stations" },
      { value: "₦0", label: "spent on fuel or grid power" },
    ],
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    accent: "solar",
    imageFirst: true,
  },
  {
    id: "battery-swapping",
    number: "03",
    title: "Integrated battery swapping",
    description:
      "A vehicle that waits at a charger is a vehicle that earns nothing. So we built a proprietary battery swap system: when a pack runs low, the vehicle rolls into a station and exchanges it for a fully charged, pre-verified one in under 5 minutes. The depleted pack charges on solar while the vehicle is already back on its route.",
    stats: [
      { value: "< 5 min", label: "per battery swap" },
      { value: "0 hrs", label: "idle at chargers" },
      { value: "30+ mo", label: "zero-emission operation" },
    ],
    image:
      "https://images.unsplash.com/photo-1572816225927-d08fb138f2b2?w=800&q=80",
    accent: "brand",
  },
];

export interface DayMoment {
  time: string;
  title: string;
  description: string;
}

export const DAY_TIMELINE: DayMoment[] = [
  {
    time: "06:00",
    title: "Stations wake",
    description:
      "Solar panels catch first light. Overnight charged packs are ready in the racks.",
  },
  {
    time: "06:30",
    title: "Fleet rolls out",
    description:
      "Silent buses pick up the first commuters heading to work and school.",
  },
  {
    time: "13:00",
    title: "Swap and go",
    description:
      "Low packs are exchanged in minutes while the midday sun recharges the racks.",
  },
  {
    time: "20:00",
    title: "Last stop, zero fumes",
    description:
      "The fleet returns having burned nothing all day. Tomorrow, the sun does it again.",
  },
];

export const TECH_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1400&q=80";
