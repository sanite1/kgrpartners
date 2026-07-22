// Mirrors kgr-backend interfaces/user.interface.ts (admin management).
import type { UserRole } from "./auth.types";

export interface ConsoleUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  access?: string[] | null; // per-user module overrides
  lastLoginAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
  access?: string[]; // per-user module overrides; absent = role defaults
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  access?: string[] | null; // null resets to role defaults
}

export interface UsersQueryParams {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  isActive?: "true" | "false";
  search?: string;
}
