// Console sidebar navigation. Icons are lucide names resolved in AdminLayout.
// Items without roles are visible to everyone; the backend enforces the
// real permissions either way.
import type { UserRole } from "@/lib/network/types/auth.types";
import { MANAGERS, FRONT_DESK, STORE } from "./permissions";

export interface ConsoleNavItem {
  label: string;
  to: string;
  icon: string;
  roles?: UserRole[];
}

export const CONSOLE_NAV: ConsoleNavItem[] = [
  { label: "Dashboard", to: "/", icon: "LayoutDashboard" },
  {
    label: "Generate Receipt",
    to: "/generate",
    icon: "TicketPlus",
    roles: FRONT_DESK,
  },
  { label: "PayPoint", to: "/paypoint", icon: "HandCoins", roles: FRONT_DESK },
  { label: "NYP List", to: "/nyp", icon: "Hourglass", roles: FRONT_DESK },
  { label: "Receipts", to: "/receipts", icon: "ReceiptText", roles: FRONT_DESK },
  {
    label: "Daily Account",
    to: "/daily-account",
    icon: "BookText",
    roles: MANAGERS,
  },
  {
    label: "Inventory",
    to: "/inventory",
    icon: "Boxes",
    roles: [...STORE, "staff"],
  },
  { label: "Requests", to: "/requests", icon: "ClipboardList" },
  { label: "Batteries", to: "/batteries", icon: "BatteryCharging", roles: STORE },
  { label: "Repairs", to: "/repairs", icon: "Wrench", roles: STORE },
  { label: "Buses", to: "/buses", icon: "Bus" },
  { label: "Trip Price", to: "/trip-price", icon: "Tag", roles: MANAGERS },
  { label: "Reports", to: "/reports", icon: "ChartColumn", roles: MANAGERS },
  { label: "Users", to: "/users", icon: "UsersRound", roles: ["admin"] },
];

export const navForRole = (role?: UserRole): ConsoleNavItem[] =>
  CONSOLE_NAV.filter((item) => !item.roles || (role && item.roles.includes(role)));
