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

// fleet tab: what the equivalent fossil vehicle would burn (L/100km)
export const FLEET_EFFICIENCY_DEFAULTS = { bus: 35, keke: 4 } as const;

// EV tab: assumed petrol use by vehicle type (L/100km)
export const PETROL_BASE = {
  tricycle: 4,
  sedan: 8,
  suv: 11,
  minibus: 14,
} as const;

// EV tab: assumed EV energy use by vehicle type (kWh/100km)
export const EV_BASE = {
  tricycle: 5,
  sedan: 15,
  suv: 20,
  minibus: 28,
} as const;

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

export const IMPACT_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1593717191400-84f38ee95485?w=1400&q=80";
