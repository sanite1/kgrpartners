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
    id: "manufacturing",
    number: "01",
    title: "Local tricycle manufacturing",
    description:
      "We do not just convert vehicles. We design and build electric tricycles (Keke NAPEP) from scratch using locally sourced materials, right here in Kaduna. What began as retrofit expertise has grown into genuine local EV manufacturing, with components adapted for Nigerian terrain and climate through our international technical partners.",
    stats: [
      { value: "Built", label: "from scratch in Kaduna" },
      { value: "Local", label: "sourced materials" },
      { value: "Adapted", label: "for Nigerian terrain" },
    ],
    image:
      "https://images.unsplash.com/photo-1549383433-0d8ef3f38afa?w=800&q=80",
    accent: "brand",
  },
  {
    id: "conversion",
    number: "02",
    title: "Petrol to electric conversion",
    description:
      "Every vehicle in our fleet once burned petrol or diesel. Our engineers strip out the old engine, gearbox and fuel system, then install a silent electric powertrain built for Nigerian road and load conditions. We electrify 10-seater commercial buses and Keke NAPEP tricycles alike. Only the smoke leaves.",
    stats: [
      { value: "100%", label: "of our fleet converted" },
      { value: "50+", label: "buses and tricycles" },
      { value: "0", label: "vehicles scrapped" },
    ],
    image:
      "https://images.unsplash.com/photo-1529171918672-ba6d0733a56c?w=800&q=80",
    accent: "solar",
    imageFirst: true,
  },
  {
    id: "solar-charging",
    number: "03",
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
    accent: "brand",
  },
  {
    id: "battery-swapping",
    number: "04",
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
    accent: "solar",
    imageFirst: true,
  },
];

export interface SwapStep {
  title: string;
  description: string;
}

export const SWAP_STEPS: SwapStep[] = [
  {
    title: "Roll in",
    description:
      "A vehicle arrives at a swap station at the end of a route or when battery charge is low.",
  },
  {
    title: "Pack out",
    description:
      "The technician removes the depleted battery pack from the vehicle.",
  },
  {
    title: "Fresh pack in",
    description:
      "A fully charged, pre-verified replacement pack is installed in its place.",
  },
  {
    title: "Back on the road",
    description:
      "The vehicle is cleared for departure in under 5 minutes, resuming service without delay.",
  },
  {
    title: "Solar recharge",
    description:
      "The depleted battery goes onto the solar-powered charging rack, ready for the next swap cycle.",
  },
];

export interface Capability {
  title: string;
  description: string;
  icon: string;
}

export const CAPABILITIES: Capability[] = [
  {
    title: "International partnerships",
    description:
      "Active relationships with overseas technical partners producing components adapted for Nigerian terrain and climate.",
    icon: "Globe",
  },
  {
    title: "Training and capacity building",
    description:
      "We train local drivers and mechanics on EV systems, safety protocols and maintenance, building skills that outlast any single vehicle.",
    icon: "GraduationCap",
  },
];

export interface ImpactStat {
  value: string;
  label: string;
}

export const IMPACT_INTRO =
  "KGR Partners Ltd is not only a transport business. It is an active contributor to Nigeria's climate goals. By replacing fossil-fuel-powered vehicles with solar-charged electric alternatives, we have achieved measurable, verifiable reductions in carbon emissions.";

export const IMPACT_STATS: ImpactStat[] = [
  {
    value: "4,158t",
    label:
      "metric tons of CO₂ eliminated since full electric operations began in late 2023",
  },
  {
    value: "~1,663t",
    label:
      "metric tons of CO₂ avoided annually relative to an equivalent ICE fleet",
  },
  {
    value: "800kW DC",
    label:
      "solar capacity across 4 charging stations, fully off-grid, zero fossil-fuel input",
  },
  {
    value: "0",
    label:
      "tailpipe emissions across the fleet: no CO₂, no particulate matter, no NOx",
  },
  {
    value: "100%",
    label:
      "end-to-end zero-emission loop, from energy source to wheel, on power we generate ourselves",
  },
];

// standard EPA equivalency conversions, for illustration only; keep visually
// subordinate to the verified figures above (NCCC/NESREA may review this page)
export const IMPACT_EQUIVALENCY =
  "The 4,158-ton figure is roughly equivalent to removing 900 petrol cars from the road for a year, or the carbon captured by around 69,000 tree seedlings grown for ten years. These are standard EPA equivalency conversions shown for illustration only; they are not part of our verified figures.";

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
