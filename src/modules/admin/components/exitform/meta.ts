// Shared labels for the battery exit form. Kept out of the components so
// fast refresh stays happy with constant-only exports.
import type {
  ExitCheck,
  ExitFormTotals,
} from "@/lib/network/types/batteryExitForm.types";
import type { BatteryLocation } from "@/lib/network/types/battery.types";

export const CHECK_LABEL: Record<ExitCheck, string> = {
  active: "Active",
  faulty: "Faulty",
  needs_check: "Needs check",
  out_of_use: "Out of use",
  sold: "Sold",
  bms: "BMS",
};

export const CHECK_OPTIONS = Object.entries(CHECK_LABEL) as [
  ExitCheck,
  string,
][];

export const LOCATION_LABEL: Record<BatteryLocation, string> = {
  main_yard: "Main Yard",
  muhd_house: "MUH'D House",
  kamila_house: "Kamila House",
  ubs: "UBS",
};

export const LOCATION_OPTIONS = Object.entries(LOCATION_LABEL) as [
  BatteryLocation,
  string,
][];

// the six tally boxes at the foot of the paper form, in the same order
export const TALLY_ROWS: { key: keyof ExitFormTotals; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "faulty", label: "Faulty" },
  { key: "needsCheck", label: "Needs check" },
  { key: "outOfUse", label: "Out of use" },
  { key: "sold", label: "Sold" },
  { key: "bms", label: "B.M.S" },
];
