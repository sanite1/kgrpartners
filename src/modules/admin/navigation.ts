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

export interface ConsoleNavGroup {
  title?: string; // untitled groups (Dashboard) render without a header
  items: ConsoleNavItem[];
}

export const CONSOLE_NAV_GROUPS: ConsoleNavGroup[] = [
  {
    items: [{ label: "Dashboard", to: "/", icon: "LayoutDashboard" }],
  },
  {
    title: "Money",
    items: [
      {
        label: "Generate Receipt",
        to: "/generate",
        icon: "TicketPlus",
        module: "generate",
      },
      {
        label: "PayPoint",
        to: "/paypoint",
        icon: "HandCoins",
        module: "paypoint",
      },
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
      {
        label: "Expenditures",
        to: "/expenditures",
        icon: "Wallet",
        module: "expenditures",
      },
    ],
  },
  {
    title: "Batteries",
    items: [
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
      {
        label: "Battery Closing",
        to: "/battery-closing",
        icon: "BatteryFull",
        module: "battery_closing",
      },
      {
        label: "Muh'd & Kamila House",
        to: "/house-closing",
        icon: "House",
        module: "house_closing",
      },
      { label: "Swaps", to: "/swaps", icon: "ArrowLeftRight", module: "swaps" },
    ],
  },
  {
    title: "Store",
    items: [
      {
        label: "Inventory",
        to: "/inventory",
        icon: "Boxes",
        module: "inventory",
      },
      {
        label: "Warehouse",
        to: "/warehouse",
        icon: "Warehouse",
        module: "warehouse",
      },
      {
        label: "Requests",
        to: "/requests",
        icon: "ClipboardList",
        module: "requests",
      },
      {
        label: "Purchases",
        to: "/purchases",
        icon: "Package",
        module: "purchases",
      },
      {
        label: "Price List",
        to: "/price-list",
        icon: "CircleDollarSign",
        module: "price_list",
      },
    ],
  },
  {
    title: "Gate",
    items: [
      {
        label: "Gate Pass",
        to: "/gate-pass",
        icon: "DoorOpen",
        module: "gate_pass",
      },
      {
        label: "Checklist",
        to: "/checklist",
        icon: "ListChecks",
        module: "checklists",
      },
    ],
  },
  {
    title: "Fleet",
    items: [
      { label: "Buses", to: "/buses", icon: "Bus", module: "buses" },
      { label: "Repairs", to: "/repairs", icon: "Wrench", module: "repairs" },
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
        label: "Conversions",
        to: "/conversions",
        icon: "PlugZap",
        module: "conversions",
      },
    ],
  },
  {
    title: "Company",
    items: [
      {
        label: "Reports",
        to: "/reports",
        icon: "ChartColumn",
        module: "reports",
      },
      {
        label: "Partnerships",
        to: "/partnerships",
        icon: "Handshake",
        module: "partnerships",
      },
      { label: "Users", to: "/users", icon: "UsersRound", module: "users" },
    ],
  },
];

// flat list, kept for the deep-link guard and anything that does not
// care about grouping
export const CONSOLE_NAV: ConsoleNavItem[] = CONSOLE_NAV_GROUPS.flatMap(
  (g) => g.items,
);

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

// grouped version for the sidebar; groups the user has no tabs in vanish
export const navGroupsForUser = (user?: NavUser | null): ConsoleNavGroup[] => {
  const allowed = effectiveAccess(user);
  return CONSOLE_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.module || allowed.includes(item.module),
    ),
  })).filter((group) => group.items.length > 0);
};
