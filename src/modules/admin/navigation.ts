// Console sidebar navigation. Icons are lucide names resolved in AdminLayout.
// New pages from later phases slot in here.
export interface ConsoleNavItem {
  label: string;
  to: string;
  icon: string;
}

export const CONSOLE_NAV: ConsoleNavItem[] = [
  { label: "Dashboard", to: "/", icon: "LayoutDashboard" },
  { label: "Generate Receipt", to: "/generate", icon: "TicketPlus" },
  { label: "Receipts", to: "/receipts", icon: "ReceiptText" },
  { label: "Buses", to: "/buses", icon: "Bus" },
  { label: "Trip Price", to: "/trip-price", icon: "Tag" },
];
