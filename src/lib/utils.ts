import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// money arrives as strings from the backend; format for display only
export const fmtNaira = (amount: string | number | undefined): string =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

// the business day in Lagos, YYYY-MM-DD (matches the backend's dayString)
export const todayLagos = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const fmtDate = (iso: string | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

// clock time in Lagos, e.g. "2:51 pm"
export const fmtTime = (iso: string | undefined): string =>
  iso
    ? new Date(iso).toLocaleTimeString("en-NG", {
        timeZone: "Africa/Lagos",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";
