// Mirrors kgr-backend config/access.ts. The backend enforces module
// access on every route; the console uses this to decide which tabs a
// user sees and to prefill the admin's access toggles.
import type { UserRole } from "@/lib/network/types/auth.types";

export const ACCESS_MODULES = [
  { key: "generate", label: "Generate Receipt" },
  { key: "paypoint", label: "PayPoint" },
  { key: "nyp", label: "NYP List" },
  { key: "receipts", label: "Receipts" },
  { key: "daily_account", label: "Daily Account" },
  { key: "inventory", label: "Inventory" },
  { key: "requests", label: "Requests" },
  { key: "batteries", label: "Batteries" },
  { key: "battery_form", label: "Battery Form" },
  { key: "repairs", label: "Repairs" },
  { key: "buses", label: "Buses" },
  { key: "tracker_report", label: "Tracker Report" },
  { key: "trip_price", label: "Trip Price" },
  { key: "reports", label: "Reports" },
  { key: "expenditures", label: "Expenditures" },
  { key: "conversions", label: "Conversions" },
  { key: "users", label: "Users" },
] as const;

export type ModuleKey = (typeof ACCESS_MODULES)[number]["key"];

export const MODULE_KEYS: ModuleKey[] = ACCESS_MODULES.map((m) => m.key);

const EVERYONE: ModuleKey[] = [
  "requests",
  "battery_form",
  "buses",
  "tracker_report",
];

export const ROLE_DEFAULT_ACCESS: Record<UserRole, ModuleKey[]> = {
  staff: [...EVERYONE, "inventory"],
  cashier: [...EVERYONE, "generate", "paypoint", "nyp", "receipts"],
  storekeeper: [...EVERYONE, "inventory", "batteries", "repairs"],
  manager: MODULE_KEYS.filter((k) => k !== "users"),
  admin: [...MODULE_KEYS],
};

interface AccessUser {
  role: UserRole;
  access?: string[] | null;
}

// per-user override when set, otherwise role defaults; admins get all
export const effectiveAccess = (user?: AccessUser | null): ModuleKey[] => {
  if (!user) return [];
  if (user.role === "admin") return ROLE_DEFAULT_ACCESS.admin;
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
