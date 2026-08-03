// Role capabilities, mirroring kgr-backend config/roles.ts. The
// backend enforces these on every route; the console uses them to
// show people only what they can actually do.
import type { UserRole } from "@/lib/network/types/auth.types";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  cashier: "Cashier",
  storekeeper: "Storekeeper",
  security: "Security",
  staff: "Staff",
};

export const ROLE_DESCRIPTION: Record<UserRole, string> = {
  admin: "Everything, including user accounts and the trip price.",
  manager:
    "Approves requests, voids receipts, closes repairs, sees reports and the daily account.",
  cashier:
    "Issues receipts, checks buses in, collects payments and works the NYP list.",
  storekeeper:
    "Runs the store: stock items, battery swaps, repair jobs and parts.",
  security:
    "The gate: sees approved gate passes and confirms items leaving the premises.",
  staff: "Views the console and raises part requests.",
};

export const MANAGERS: UserRole[] = ["admin", "manager"];
export const FRONT_DESK: UserRole[] = ["admin", "manager", "cashier"];
export const STORE: UserRole[] = ["admin", "manager", "storekeeper"];

export const canApprove = (role?: UserRole) =>
  !!role && MANAGERS.includes(role);
export const canIssue = (role?: UserRole) =>
  !!role && FRONT_DESK.includes(role);
export const canManageStock = (role?: UserRole) =>
  !!role && STORE.includes(role);
export const isAdminRole = (role?: UserRole) => role === "admin";

// The two owner accounts, mirrored from kgr-backend config/roles.ts.
// Nobody can delete them, change their role or disable them; only a
// super admin may edit a super admin at all.
export const SUPER_ADMIN_EMAILS = [
  "admin@kgrpartnersltd.com",
  "csanni52@gmail.com",
];

export const isSuperAdminEmail = (email?: string | null): boolean =>
  !!email && SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
