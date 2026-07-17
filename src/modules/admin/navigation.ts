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
  { label: "PayPoint", to: "/paypoint", icon: "HandCoins" },
  { label: "NYP List", to: "/nyp", icon: "Hourglass" },
  { label: "Receipts", to: "/receipts", icon: "ReceiptText" },
  { label: "Daily Account", to: "/daily-account", icon: "BookText" },
  { label: "Inventory", to: "/inventory", icon: "Boxes" },
  { label: "Requests", to: "/requests", icon: "ClipboardList" },
  { label: "Batteries", to: "/batteries", icon: "BatteryCharging" },
  { label: "Repairs", to: "/repairs", icon: "Wrench" },
  { label: "Buses", to: "/buses", icon: "Bus" },
  { label: "Trip Price", to: "/trip-price", icon: "Tag" },
  { label: "Reports", to: "/reports", icon: "ChartColumn" },
];
