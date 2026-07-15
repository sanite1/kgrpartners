export interface NavLinkItem {
  label: string;
  to: string;
}

// Team / FAQ / Partner / Gallery stay out of the bar to keep it uncrowded;
// all of them remain reachable from the footer.
export const NAV_LINKS: NavLinkItem[] = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Our Technology", to: "/technology" },
  { label: "Impact Calculator", to: "/impact" },
  { label: "Contact", to: "/contact" },
];

export const COMPANY_INFO = {
  location: "Kawo, Kaduna State, Nigeria",
  address: "No.6 GGSS Road, KTC Layout, Kawo, Kaduna State, Nigeria",
  hours: "Mon to Sat, 6:00 to 20:00",
  email: "info@kgrpartnersltd.com",
  phone: "0703 697 3015",
  phone2: "0803 343 4560",
  rcNumber: "RC: 7451921",
  blurb:
    "An indigenous Nigerian clean energy mobility company. We build and convert electric vehicles, charge them on our own off-grid solar stations, and move thousands of commuters across Kaduna every day.",
};

export interface FooterColumn {
  title: string;
  links: { label: string; to: string }[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Meet the team", to: "/team" },
      { label: "Gallery", to: "/gallery" },
      { label: "Impact calculator", to: "/impact" },
      { label: "FAQ", to: "/faq" },
      { label: "Partner with us", to: "/partner" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Tricycle manufacturing", to: "/technology#manufacturing" },
      { label: "Electric conversion", to: "/technology#conversion" },
      { label: "Solar charging", to: "/technology#solar-charging" },
      { label: "Battery swapping", to: "/technology#battery-swapping" },
      { label: "Start a conversion", to: "/conversion" },
    ],
  },
];

export const QUOTE_TEXT = "We run not on oil, but on hope, ingenuity";
export const QUOTE_ACCENT = "and sunshine.";
