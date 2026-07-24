// Mirrors kgr-backend: interfaces/user.interface.ts + auth.service.ts.
// User shape is the Mongoose toJSON output (password and __v stripped).

export type UserRole =
  "staff" | "cashier" | "storekeeper" | "security" | "manager" | "admin";

export interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  access?: string[] | null; // per-user module overrides
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// POST /api/auth/login
export interface LoginPayload {
  email: string;
  password: string;
}
export interface LoginData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// POST /api/auth/refresh
export interface RefreshData {
  accessToken: string;
}

// POST /api/auth/change-password
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
