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
      "Every bus in our fleet once burned diesel. Our engineers strip out the old engine, gearbox and fuel system, then install a silent electric powertrain in its place. The body, the seats and the soul of the bus stay Nigerian. Only the smoke leaves.",
    stats: [
      { value: "100%", label: "of our fleet converted" },
      { value: "0", label: "buses scrapped" },
      { value: "Silent", label: "and free of fumes" },
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
      "We built our own charging infrastructure rather than wait for the grid. Our solar stations generate roughly 800 kW, more than the entire fleet needs. Every kilometre we drive is powered by Nigerian sunlight collected on Nigerian rooftops.",
    stats: [
      { value: "800 kW", label: "generation capacity" },
      { value: "100%", label: "fleet needs covered" },
      { value: "₦0", label: "spent on diesel" },
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
      "A bus that waits at a charger is a bus that earns nothing. So we designed a battery swap system: when a pack runs low, the bus rolls into a station and exchanges it for a fully charged one in minutes. The depleted pack charges on solar while the bus is already back on its route.",
    stats: [
      { value: "Minutes", label: "per battery swap" },
      { value: "0 hrs", label: "idle at chargers" },
      { value: "~2 yrs", label: "without a breakdown" },
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
