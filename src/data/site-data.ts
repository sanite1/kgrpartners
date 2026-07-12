export interface NavLinkItem {
  label: string;
  to: string;
}

export const NAV_LINKS: NavLinkItem[] = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Our Technology", to: "/technology" },
  { label: "Contact", to: "/contact" },
];

export const COMPANY_INFO = {
  location: "Kaduna, Nigeria",
  hours: "Mon to Sat, 6:00 to 20:00",
  email: "info@kgrpartners.com",
  phone: "+234 800 000 0000",
  blurb:
    "A Nigerian transport company moving people and goods on solar charged electric buses, converted and powered by our own team.",
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
      { label: "Our technology", to: "/technology" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Electric conversion", to: "/technology#conversion" },
      { label: "Solar charging", to: "/technology#solar-charging" },
      { label: "Battery swapping", to: "/technology#battery-swapping" },
    ],
  },
];

export const QUOTE_TEXT = "We run not on oil, but on hope, ingenuity";
export const QUOTE_ACCENT = "and sunshine.";
