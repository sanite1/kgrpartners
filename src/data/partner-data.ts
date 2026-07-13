export const PARTNER_INTRO =
  "KGR Partners Ltd is positioned to serve as a strategic partner for government agencies, private investors, transport unions, and development organizations across all 36 states and the FCT. We are open to collaborating on:";

export interface PartnerArea {
  title: string;
  description: string;
  icon: string;
}

export const PARTNER_AREAS: PartnerArea[] = [
  {
    title: "EV conversion programmes",
    description:
      "Structured EV conversion programmes for commercial tricycles and buses nationwide.",
    icon: "Bus",
  },
  {
    title: "Charging infrastructure",
    description:
      "Expansion of solar-powered off-grid EV charging infrastructure across all states.",
    icon: "Sun",
  },
  {
    title: "Training and capacity building",
    description:
      "Capacity building and training programmes for vehicle operators and local technicians.",
    icon: "GraduationCap",
  },
  {
    title: "Fleet electrification",
    description:
      "Government and institutional fleet electrification programmes.",
    icon: "Building2",
  },
  {
    title: "Component localization",
    description:
      "Joint ventures for EV component localization and assembly within Nigeria.",
    icon: "Factory",
  },
  {
    title: "Carbon and climate finance",
    description:
      "Carbon credit generation and climate finance partnerships.",
    icon: "Leaf",
  },
];

export const PARTNER_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=1400&q=80";
