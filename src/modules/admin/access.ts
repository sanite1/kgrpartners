// Mirrors kgr-backend config/access.ts. The backend enforces module
// access on every route; the console uses this to decide which tabs a
// user sees and to prefill the admin's access toggles.
import type { UserRole } from "@/lib/network/types/auth.types";
import { isSuperAdminEmail } from "./permissions";

export const ACCESS_MODULES = [
  { key: "generate", label: "Generate Receipt" },
  { key: "paypoint", label: "PayPoint" },
  { key: "nyp", label: "NYP List" },
  { key: "receipts", label: "Receipts" },
  { key: "daily_account", label: "Daily Account" },
  { key: "inventory", label: "Inventory" },
  { key: "warehouse", label: "Warehouse" },
  { key: "requests", label: "Requests" },
  { key: "batteries", label: "Batteries" },
  { key: "battery_form", label: "Battery Form" },
  { key: "battery_attendance", label: "Battery Attendance" },
  { key: "battery_closing", label: "Battery Closing" },
  { key: "house_closing", label: "Muh'd & Kamila House" },
  { key: "main_yard_closing", label: "Main Yard" },
  { key: "ubs_closing", label: "UBS" },
  { key: "swaps", label: "Battery Swaps" },
  { key: "gate_pass", label: "Gate Pass" },
  { key: "purchases", label: "Purchases" },
  { key: "price_list", label: "Price List" },
  { key: "todos", label: "To-Do List" },
  { key: "checklists", label: "Checklist" },
  { key: "repairs", label: "Repairs" },
  { key: "buses", label: "Buses" },
  { key: "tracker_report", label: "Tracker Report" },
  { key: "trackers", label: "Tracker Update" },
  { key: "trip_price", label: "Trip Price" },
  { key: "reports", label: "Reports" },
  { key: "expenditures", label: "Expenditures" },
  { key: "conversions", label: "Conversions" },
  { key: "partnerships", label: "Partnerships" },
  { key: "users", label: "Users" },
] as const;

export type ModuleKey = (typeof ACCESS_MODULES)[number]["key"];

export const MODULE_KEYS: ModuleKey[] = ACCESS_MODULES.map((m) => m.key);

const EVERYONE: ModuleKey[] = [
  "requests",
  "battery_form",
  "battery_attendance",
  "battery_closing",
  "house_closing",
  "main_yard_closing",
  "ubs_closing",
  "swaps",
  "gate_pass",
  "purchases",
  "price_list",
  "checklists",
  "buses",
  "tracker_report",
  "trackers",
];

export const ROLE_DEFAULT_ACCESS: Record<UserRole, ModuleKey[]> = {
  staff: [...EVERYONE, "inventory", "warehouse"],
  cashier: [...EVERYONE, "generate", "paypoint", "nyp", "receipts"],
  storekeeper: [...EVERYONE, "inventory", "warehouse", "batteries", "repairs"],
  security: ["gate_pass", "checklists"], // the gate desk plus its tally
  manager: MODULE_KEYS.filter((k) => k !== "users"),
  admin: [...MODULE_KEYS],
};

interface AccessUser {
  role: UserRole;
  email?: string | null;
  access?: string[] | null;
}

// per-user override when set, otherwise role defaults; only the super
// admins are untouchable with everything, normal admins can be narrowed
export const effectiveAccess = (user?: AccessUser | null): ModuleKey[] => {
  if (!user) return [];
  if (isSuperAdminEmail(user.email)) return ROLE_DEFAULT_ACCESS.admin;
  if (Array.isArray(user.access)) {
    return user.access.filter((k): k is ModuleKey =>
      (MODULE_KEYS as string[]).includes(k),
    );
  }
  return ROLE_DEFAULT_ACCESS[user.role] ?? [];
};

export const hasModule = (
  user: AccessUser | null | undefined,
  module: ModuleKey,
): boolean => effectiveAccess(user).includes(module);
