import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Fuel, Zap, Leaf } from "lucide-react";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import {
  EMISSION_FACTOR_DIESEL,
  EMISSION_FACTOR_PETROL,
  TREE_KG_PER_YEAR,
  CAR_KG_PER_YEAR,
  FLEET_EFFICIENCY_DEFAULTS,
  PETROL_BASE,
  EV_BASE,
  CYL_ADJUST,
  LOAD_FACTOR_PER_TONNE,
  DEFAULT_PETROL_PRICE,
  DEFAULT_ELECTRICITY_PRICE,
  FLEET_GAUGE_REF_KG_DAY,
  EV_GAUGE_REF_NAIRA_DAY,
  IMPACT_FOOTNOTE,
} from "@/data/impact-data";
import { cn } from "@/lib/utils";

type TabId = "fleet" | "ev";
type FleetVehicle = keyof typeof FLEET_EFFICIENCY_DEFAULTS;
type EvVehicle = keyof typeof PETROL_BASE;

const fmt = (n: number) => Math.round(n).toLocaleString("en-NG");
const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-NG");
const num = (s: string) => Math.max(0, parseFloat(s) || 0);

const inputClasses =
  "w-full box-border rounded-[10px] border border-input-line bg-white px-4 py-3 text-base font-medium text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:text-[15px]";

const labelClasses = "text-[13px] font-extrabold text-ink";

// semicircular "solar charge meter" gauge; arc length of r=90 half circle
const ARC = 283;

const Gauge = ({
  pct,
  tone,
  children,
}: {
  pct: number;
  tone: "solar" | "green";
  children: ReactNode;
}) => {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="relative w-full max-w-[280px]">
      <svg viewBox="0 0 220 130" className="block w-full" aria-hidden="true">
        <defs>
          <linearGradient id="kgr-gauge-green" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0FA53A" />
            <stop offset="100%" stopColor="#0FF338" />
          </linearGradient>
        </defs>
        <path
          d="M20,120 A90,90 0 0 1 200,120"
          fill="none"
          stroke="#E4E9E3"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d="M20,120 A90,90 0 0 1 200,120"
          fill="none"
          stroke={tone === "solar" ? "#F0B429" : "url(#kgr-gauge-green)"}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={ARC}
          strokeDashoffset={ARC - ARC * clamped}
          style={{
            transition: "stroke-dashoffset 0.6s cubic-bezier(0.2,0.8,0.2,1)",
          }}
        />
      </svg>
      <div className="absolute left-1/2 top-[58%] flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
        {children}
      </div>
    </div>
  );
};

const Chip = ({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "solar" | "green";
}) => (
  <div className="flex-1 basis-[140px] rounded-xl border border-line bg-white px-3 py-3 text-center">
    <strong
      className={cn(
        "block text-[17px] font-extrabold",
        tone === "solar" ? "text-solar-700" : "text-brand-600",
      )}
    >
      {value}
    </strong>
    <span className="text-[11px] font-semibold leading-[1.35] text-fog">
      {label}
    </span>
  </div>
);

const ImpactMeter = () => {
  const [tab, setTab] = useState<TabId>("fleet");

  // fleet footprint inputs
  const [fType, setFType] = useState<FleetVehicle>("bus");
  const [fCount, setFCount] = useState("12");
  const [fKm, setFKm] = useState("180");
  const [fEff, setFEff] = useState(String(FLEET_EFFICIENCY_DEFAULTS.bus));

  // switch-to-EV inputs
  const [eLitres, setELitres] = useState("8");
  const [eCyl, setECyl] = useState("4");
  const [eType, setEType] = useState<EvVehicle>("sedan");
  const [eLoad, setELoad] = useState("150");
  const [ePriceP, setEPriceP] = useState(String(DEFAULT_PETROL_PRICE));
  const [ePriceE, setEPriceE] = useState(String(DEFAULT_ELECTRICITY_PRICE));

  // ── fleet math (spec §1) ──
  const fFactor =
    fType === "bus" ? EMISSION_FACTOR_DIESEL : EMISSION_FACTOR_PETROL;
  const fLitresDay = num(fKm) * (num(fEff) / 100) * num(fCount);
  const fCo2Day = fLitresDay * fFactor;
  const fCo2Year = fCo2Day * 365;

  // ── EV savings math (spec §2) ──
  const petrolL100 = PETROL_BASE[eType] * (CYL_ADJUST[eCyl] ?? 1);
  const distanceKm = petrolL100 > 0 ? num(eLitres) / (petrolL100 / 100) : 0;
  // +10% EV energy per extra 1,000 kg carried (spec §2)
  const loadMultiplier = 1 + (num(eLoad) / 1000) * LOAD_FACTOR_PER_TONNE;
  const evKwh100 = EV_BASE[eType] * loadMultiplier;
  const evEnergyDay = distanceKm * (evKwh100 / 100);
  const petrolCostDay = num(eLitres) * num(ePriceP);
  const evCostDay = evEnergyDay * num(ePriceE);
  const savingsDay = petrolCostDay - evCostDay;
  const eCo2Day = num(eLitres) * EMISSION_FACTOR_PETROL;

  return (
    <div
      className="rounded-[20px] border border-line bg-white p-5 shadow-[0_12px_30px_rgba(13,31,21,0.07)] sm:p-9"
      data-aos="fade-up"
    >
      <SectionEyebrow>LIVE IMPACT METER</SectionEyebrow>
      <p className="mb-6 mt-2 max-w-[600px] text-[14px] font-medium leading-[1.6] text-sage sm:text-[15px]">
        Every kilometre our solar-charged fleet runs instead of a petrol or
        diesel equivalent keeps carbon out of Kaduna's air. Run the numbers
        below.
      </p>

      {/* tabs */}
      <div className="mb-8 flex w-fit gap-1 rounded-full border border-line bg-mist p-1">
        {(
          [
            ["fleet", "Fleet footprint"],
            ["ev", "Switch-to-EV savings"],
          ] as [TabId, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "cursor-pointer rounded-full border-none px-4 py-2.5 text-[13px] font-extrabold transition-colors sm:px-5 sm:text-[13.5px]",
              tab === id
                ? id === "fleet"
                  ? "bg-solar text-forest-deep"
                  : "cta-gradient text-forest-deep"
                : "bg-transparent text-bark hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── fleet panel ── */}
      {tab === "fleet" && (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-type" className={labelClasses}>
                Vehicle type
              </label>
              <select
                id="f-type"
                value={fType}
                onChange={(e) => {
                  const next = e.target.value as FleetVehicle;
                  setFType(next);
                  setFEff(String(FLEET_EFFICIENCY_DEFAULTS[next]));
                }}
                className={inputClasses}
              >
                <option value="bus">
                  Diesel bus (baseline you're avoiding)
                </option>
                <option value="keke">Petrol tricycle / Keke</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-count" className={labelClasses}>
                Vehicles running today
              </label>
              <input
                id="f-count"
                type="number"
                min={0}
                value={fCount}
                onChange={(e) => setFCount(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-km" className={labelClasses}>
                Average km per vehicle, per day
              </label>
              <input
                id="f-km"
                type="number"
                min={0}
                value={fKm}
                onChange={(e) => setFKm(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-eff" className={labelClasses}>
                Equivalent fuel use (L / 100km){" "}
                <span
                  title="Editable. Defaults are typical for Nigerian city routes: about 35L/100km for a loaded diesel minibus, about 4L/100km for a petrol tricycle."
                  className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-mist text-[10px] font-bold text-fog"
                >
                  ?
                </span>
              </label>
              <input
                id="f-eff"
                type="number"
                min={0}
                step={0.1}
                value={fEff}
                onChange={(e) => setFEff(e.target.value)}
                className={inputClasses}
              />
            </div>
            {/* the emission factor in use, mirroring the EV tab's rates strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-line bg-haze px-4 py-3.5">
              <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
                <Fuel size={15} className="text-solar-700" />
                {fFactor}
                <span className="font-semibold text-fog">
                  kg CO₂ / litre of {fType === "bus" ? "diesel" : "petrol"}
                </span>
              </span>
              <span className="hidden h-3.5 w-px bg-divider sm:block" />
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-fog">
                <Leaf size={14} className="text-brand-600" />
                standard combustion factor
              </span>
            </div>

            <p className="m-0 text-[12.5px] font-semibold leading-[1.5] text-fog">
              ≈ {fmt1(fLitresDay)} L of {fType === "bus" ? "diesel" : "petrol"}{" "}
              avoided per day across the fleet.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Gauge pct={fCo2Day / FLEET_GAUGE_REF_KG_DAY} tone="solar">
              <span className="text-[26px] font-extrabold text-ink sm:text-[32px]">
                {fmt(fCo2Day)}
              </span>
              <span className="max-w-[140px] text-[11px] font-semibold text-fog">
                kg CO₂ avoided / day
              </span>
            </Gauge>
            <div className="flex w-full flex-wrap justify-center gap-2.5">
              <Chip
                tone="solar"
                value={fmt1(fCo2Year / 1000)}
                label="tonnes CO₂ avoided / year"
              />
              <Chip
                tone="solar"
                value={fmt(fCo2Year / TREE_KG_PER_YEAR)}
                label="mature trees' worth of CO₂ / year"
              />
              <Chip
                tone="solar"
                value={fmt(fCo2Year / CAR_KG_PER_YEAR)}
                label="petrol cars taken off the road, equivalent"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── EV savings panel ── */}
      {tab === "ev" && (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="e-litres" className={labelClasses}>
                Petrol used per day (litres)
              </label>
              <input
                id="e-litres"
                type="number"
                min={0}
                step={0.1}
                value={eLitres}
                onChange={(e) => setELitres(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="e-cyl" className={labelClasses}>
                Engine size
              </label>
              <select
                id="e-cyl"
                value={eCyl}
                onChange={(e) => setECyl(e.target.value)}
                className={inputClasses}
              >
                <option value="3">3-cylinder (mini / kei car)</option>
                <option value="4">4-cylinder (sedan / small SUV)</option>
                <option value="6">6-cylinder (SUV / crossover)</option>
                <option value="8">8-cylinder (pickup / large SUV)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="e-type" className={labelClasses}>
                Type of vehicle
              </label>
              <select
                id="e-type"
                value={eType}
                onChange={(e) => setEType(e.target.value as EvVehicle)}
                className={inputClasses}
              >
                <option value="tricycle">Tricycle / Keke</option>
                <option value="sedan">Car / sedan</option>
                <option value="suv">SUV / pickup</option>
                <option value="minibus">Minibus</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="e-load" className={labelClasses}>
                Load carried, typical (kg)
              </label>
              <input
                id="e-load"
                type="number"
                min={0}
                value={eLoad}
                onChange={(e) => setELoad(e.target.value)}
                className={inputClasses}
              />
            </div>

            {/* the rates in use, always visible; expand to edit */}
            <details className="group rounded-xl border border-line bg-haze">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
                  <Fuel size={15} className="text-solar-700" />
                  ₦{fmt(num(ePriceP))}
                  <span className="font-semibold text-fog">/ litre petrol</span>
                </span>
                <span className="hidden h-3.5 w-px bg-divider sm:block" />
                <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
                  <Zap size={15} className="text-brand-600" />
                  ₦{fmt(num(ePriceE))}
                  <span className="font-semibold text-fog">
                    / kWh electricity
                  </span>
                </span>
                <span className="ml-auto text-[12px] font-extrabold text-brand-600">
                  <span className="group-open:hidden">Adjust →</span>
                  <span className="hidden group-open:inline">Done ↑</span>
                </span>
              </summary>
              <div className="flex flex-col gap-4 border-t border-line px-4 pb-4 pt-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="e-price-petrol" className={labelClasses}>
                    Petrol price (₦ / litre)
                  </label>
                  <input
                    id="e-price-petrol"
                    type="number"
                    min={0}
                    value={ePriceP}
                    onChange={(e) => setEPriceP(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="e-price-kwh" className={labelClasses}>
                    Electricity price (₦ / kWh)
                  </label>
                  <input
                    id="e-price-kwh"
                    type="number"
                    min={0}
                    value={ePriceE}
                    onChange={(e) => setEPriceE(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <p className="m-0 text-[12px] font-medium text-fog">
                  Defaults reflect Nigerian market rates as of July 2026.
                  Adjust them to match what you actually pay.
                </p>
              </div>
            </details>

            <p className="m-0 text-[12.5px] font-semibold leading-[1.5] text-fog">
              ≈ {fmt1(distanceKm)} km/day, needing ≈ {fmt1(evEnergyDay)} kWh on
              an EV, vs ₦{fmt(petrolCostDay)} of petrol today.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Gauge pct={savingsDay / EV_GAUGE_REF_NAIRA_DAY} tone="green">
              <span className="text-[24px] font-extrabold text-ink sm:text-[30px]">
                ₦{fmt(savingsDay)}
              </span>
              <span className="max-w-[150px] text-[11px] font-semibold text-fog">
                saved / day switching to EV
              </span>
            </Gauge>
            <div className="flex w-full flex-wrap justify-center gap-2.5">
              <Chip
                tone="green"
                value={`₦${fmt(savingsDay * 30)}`}
                label="saved / month"
              />
              <Chip
                tone="green"
                value={`₦${fmt(savingsDay * 365)}`}
                label="saved / year"
              />
              <Chip
                tone="green"
                value={fmt(eCo2Day)}
                label="kg CO₂ avoided / day"
              />
            </div>
            <Link
              to="/conversion"
              className="cta-gradient whitespace-nowrap rounded-lg px-6 py-3 text-[14px] font-extrabold text-forest-deep hover:text-forest-deep"
            >
              Start a conversion sheet →
            </Link>
          </div>
        </div>
      )}

      <p className="mb-0 mt-8 border-t border-line pt-5 text-[11.5px] font-medium leading-[1.6] text-fog">
        {IMPACT_FOOTNOTE}
      </p>
    </div>
  );
};

export default ImpactMeter;
