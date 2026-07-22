// Console sidebar navigation. Icons are lucide names resolved in AdminLayout.
// Each item names the access module that unlocks it; the backend enforces
// the real permissions either way. Dashboard has no module: always visible.
import type { UserRole } from "@/lib/network/types/auth.types";
import { effectiveAccess, type ModuleKey } from "./access";

export interface ConsoleNavItem {
  label: string;
  to: string;
  icon: string;
  module?: ModuleKey;
}

export const CONSOLE_NAV: ConsoleNavItem[] = [
  { label: "Dashboard", to: "/", icon: "LayoutDashboard" },
  {
    label: "Generate Receipt",
    to: "/generate",
    icon: "TicketPlus",
    module: "generate",
  },
  { label: "PayPoint", to: "/paypoint", icon: "HandCoins", module: "paypoint" },
  { label: "NYP List", to: "/nyp", icon: "Hourglass", module: "nyp" },
  {
    label: "Receipts",
    to: "/receipts",
    icon: "ReceiptText",
    module: "receipts",
  },
  {
    label: "Daily Account",
    to: "/daily-account",
    icon: "BookText",
    module: "daily_account",
  },
  { label: "Inventory", to: "/inventory", icon: "Boxes", module: "inventory" },
  {
    label: "Requests",
    to: "/requests",
    icon: "ClipboardList",
    module: "requests",
  },
  {
    label: "Batteries",
    to: "/batteries",
    icon: "BatteryCharging",
    module: "batteries",
  },
  {
    label: "Battery Form",
    to: "/battery-form",
    icon: "ClipboardCheck",
    module: "battery_form",
  },
  { label: "Repairs", to: "/repairs", icon: "Wrench", module: "repairs" },
  { label: "Buses", to: "/buses", icon: "Bus", module: "buses" },
  {
    label: "Tracker Report",
    to: "/tracker-report",
    icon: "Radar",
    module: "tracker_report",
  },
  {
    label: "Trip Price",
    to: "/trip-price",
    icon: "Tag",
    module: "trip_price",
  },
  {
    label: "Reports",
    to: "/reports",
    icon: "ChartColumn",
    module: "reports",
  },
  {
    label: "Expenditures",
    to: "/expenditures",
    icon: "Wallet",
    module: "expenditures",
  },
  {
    label: "Conversions",
    to: "/conversions",
    icon: "PlugZap",
    module: "conversions",
  },
  { label: "Users", to: "/users", icon: "UsersRound", module: "users" },
];

interface NavUser {
  role: UserRole;
  access?: string[] | null;
}

export const navForUser = (user?: NavUser | null): ConsoleNavItem[] => {
  const allowed = effectiveAccess(user);
  return CONSOLE_NAV.filter(
    (item) => !item.module || allowed.includes(item.module),
  );
};
