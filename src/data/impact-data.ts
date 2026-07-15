// Impact calculator constants, verbatim from KGR-Impact-Calculator-Spec.md.
// All figures are editable planning defaults; swap in real fleet telemetry
// (litres avoided, kWh drawn from the solar stations) when available.

// kg CO₂ per litre burned, standard combustion factors
export const EMISSION_FACTOR_DIESEL = 2.68;
export const EMISSION_FACTOR_PETROL = 2.31;

// a mature tree absorbs ~21 kg CO₂/year
export const TREE_KG_PER_YEAR = 21;
// an average petrol car emits ~4.6 tonnes CO₂/year
export const CAR_KG_PER_YEAR = 4600;

// fleet tab: the fossil baseline being avoided — fuel sets the emission
// factor, l100 is the typical consumption prefilled into the editable field
export interface FleetVehicleOption {
  id: string;
  label: string;
  fuel: "diesel" | "petrol";
  l100: number;
}

export const FLEET_VEHICLES: FleetVehicleOption[] = [
  { id: "bus", label: "Diesel bus", fuel: "diesel", l100: 35 },
  { id: "dieselMinibus", label: "Diesel minibus", fuel: "diesel", l100: 18 },
  { id: "truck", label: "Diesel truck", fuel: "diesel", l100: 30 },
  { id: "keke", label: "Petrol tricycle / Keke", fuel: "petrol", l100: 4 },
  { id: "motorcycle", label: "Petrol motorcycle", fuel: "petrol", l100: 3 },
  { id: "hatchback", label: "Petrol hatchback", fuel: "petrol", l100: 7 },
  { id: "sedan", label: "Petrol sedan", fuel: "petrol", l100: 8 },
  { id: "suv", label: "Petrol SUV / crossover", fuel: "petrol", l100: 11 },
  { id: "pickup", label: "Petrol pickup", fuel: "petrol", l100: 12 },
  { id: "petrolMinibus", label: "Petrol minibus", fuel: "petrol", l100: 14 },
];

// vehicle age adjusts the prefilled consumption; older engines burn more
export interface VehicleAgeOption {
  id: string;
  label: string;
  multiplier: number;
}

export const VEHICLE_AGES: VehicleAgeOption[] = [
  { id: "new", label: "2015 or newer", multiplier: 1 },
  { id: "mid", label: "2005 to 2014", multiplier: 1.15 },
  { id: "old", label: "Before 2005", multiplier: 1.3 },
];

// EV tab: assumed petrol use by vehicle type (L/100km)
export const PETROL_BASE = {
  tricycle: 4,
  motorcycle: 3,
  hatchback: 7,
  sedan: 8,
  suv: 11,
  pickup: 12,
  minibus: 14,
} as const;

// EV tab: assumed EV energy use by vehicle type (kWh/100km)
export const EV_BASE = {
  tricycle: 5,
  motorcycle: 3,
  hatchback: 13,
  sedan: 15,
  suv: 20,
  pickup: 22,
  minibus: 28,
} as const;

export const EV_VEHICLE_LABELS: Record<keyof typeof PETROL_BASE, string> = {
  tricycle: "Tricycle / Keke",
  motorcycle: "Motorcycle",
  hatchback: "Hatchback",
  sedan: "Car / sedan",
  suv: "SUV / crossover",
  pickup: "Pickup",
  minibus: "Minibus",
};

// engine size adjustment on petrol consumption
export const CYL_ADJUST: Record<string, number> = {
  "3": 0.85,
  "4": 1,
  "6": 1.2,
  "8": 1.4,
};

// +10% EV energy per extra 1,000 kg carried
export const LOAD_FACTOR_PER_TONNE = 0.1;

// Nigerian market defaults as of July 2026, exposed as editable fields
export const DEFAULT_PETROL_PRICE = 1150; // ₦/L
export const DEFAULT_ELECTRICITY_PRICE = 210; // ₦/kWh (Band A)

// gauge scaling references so the arc has visible range
export const FLEET_GAUGE_REF_KG_DAY = 500;
export const EV_GAUGE_REF_NAIRA_DAY = 15000;

export const IMPACT_FOOTNOTE =
  "Estimates for planning purposes only, based on standard emission factors (petrol 2.31 kg CO₂/L, diesel 2.68 kg CO₂/L), a mature tree absorbing about 21 kg of CO₂ per year, and an average petrol car emitting about 4.6 tonnes of CO₂ per year. All prices and consumption rates are editable defaults; we will swap in KGR's own metered data as it becomes available.";

// live CO₂ ticker: the verified 4,158t figure (as of the content plan,
// 12 July 2026) accruing at the documented ~1,663 t/year avoidance rate
export const CO2_ANCHOR_TONNES = 4158;
export const CO2_ANCHOR_MS = Date.UTC(2026, 6, 12);
export const CO2_TONNES_PER_YEAR = 1663;

export const IMPACT_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1593717191400-84f38ee95485?w=1400&q=80";
