import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// money arrives as strings from the backend; format for display only
export const fmtNaira = (amount: string | number | undefined): string =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

export const fmtDate = (iso: string | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
