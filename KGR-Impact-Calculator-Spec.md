# KGR Partners — Impact Calculator Feature Spec

Two calculators for the homepage, packaged as one widget with two tabs: **Fleet footprint** and **Switch‑to‑EV savings**. A working, embeddable version is in `kgr-impact-calculator.html` — everything below explains what it does and how to wire it into the real site.

---

## 1. Fleet carbon footprint (daily operations)

**Purpose:** shows visitors how much CO₂ KGR's solar‑charged fleet is *avoiding* today, versus running the same routes on diesel buses or petrol tricycles.

### Inputs
| Field | Type | Default | Notes |
|---|---|---|---|
| Vehicle type | select | Diesel bus | Sets the comparison baseline (bus = diesel, keke = petrol) |
| Vehicles running today | number | 12 | Fleet size for the day |
| Average km per vehicle/day | number | 180 | Typical Kaduna route distance |
| Equivalent fuel use (L/100km) | number, editable | 35 (bus) / 4 (keke) | What that vehicle *would* burn on fossil fuel |

### Formula
```
litres_per_vehicle_per_day = km_per_day × (L_per_100km / 100)
total_litres_per_day        = litres_per_vehicle_per_day × vehicle_count
co2_avoided_kg_per_day       = total_litres_per_day × emission_factor
co2_avoided_kg_per_year      = co2_avoided_kg_per_day × 365
```
- `emission_factor` = **2.68 kg CO₂/L** for diesel, **2.31 kg CO₂/L** for petrol (standard combustion factors).
- Trees‑equivalent = `co2_avoided_kg_per_year / 21` (a mature tree absorbs ~21kg CO₂/year).
- Cars‑off‑road‑equivalent = `co2_avoided_kg_per_year / 4600` (an average petrol car emits ~4.6 tonnes CO₂/year).

### Displayed output
- Big number: **kg CO₂ avoided today**
- Supporting stats: tonnes/year, trees'-worth/year, cars‑off‑the‑road equivalent/year

---

## 2. Switch‑to‑EV savings (personal calculator)

**Purpose:** lets a site visitor with a petrol vehicle see what they'd save — in naira and CO₂ — by switching to one of KGR's EVs.

### Inputs (as requested)
| Field | Type | Default |
|---|---|---|
| Litres of petrol used per day | number | 8 |
| Number of cylinders | select (3/4/6/8) | 4 |
| Type of car | select (tricycle / sedan / SUV‑pickup / minibus) | sedan |
| Load carried, kg | number | 150 |
| *Advanced:* petrol price ₦/L | number, editable | 1,150 |
| *Advanced:* electricity price ₦/kWh | number, editable | 210 |

Distance isn't asked for directly — it's *derived* from litres burned and an assumed fuel‑efficiency figure, so the calculator only needs the inputs the user actually knows.

### Formula
```
petrol_L_per_100km   = base_L_per_100km[car_type] × cylinder_adjust[cylinders]
distance_km_per_day  = litres_per_day / (petrol_L_per_100km / 100)

load_multiplier      = 1 + (load_kg / 1000) × 0.10      // +10% EV energy per extra 1,000kg carried
ev_kwh_per_100km      = base_kwh_per_100km[car_type] × load_multiplier
ev_energy_kwh_per_day = distance_km_per_day × (ev_kwh_per_100km / 100)

petrol_cost_per_day  = litres_per_day × petrol_price
ev_cost_per_day       = ev_energy_kwh_per_day × electricity_price
savings_per_day        = petrol_cost_per_day − ev_cost_per_day
co2_avoided_kg_per_day = litres_per_day × 2.31
```

**Lookup tables used (all editable defaults, tune with real fleet data when available):**

| Vehicle type | Assumed petrol use (L/100km) | Assumed EV use (kWh/100km) |
|---|---|---|
| Tricycle / Keke | 4 | 5 |
| Car / sedan | 8 | 15 |
| SUV / pickup | 11 | 20 |
| Minibus | 14 | 28 |

| Cylinders | Adjustment multiplier |
|---|---|
| 3 | 0.85 |
| 4 | 1.00 |
| 6 | 1.20 |
| 8 | 1.40 |

### Displayed output
- Big number: **₦ saved per day**
- Supporting stats: ₦ saved/month, ₦ saved/year, kg CO₂ avoided/day

---

## 3. Where the numbers come from

- Petrol price default (₦1,150/L) and electricity price default (₦210/kWh, Band A) reflect Nigerian market rates as of **July 2026** — both are exposed as editable fields since these move often; consider pulling live figures from a fuel‑price API later if there's appetite.
- Emission factors (2.31 kg CO₂/L petrol, 2.68 kg CO₂/L diesel) are standard combustion factors used in most corporate carbon calculators.
- Fuel‑ and energy‑efficiency assumptions are reasonable planning estimates, not measured data. **Once KGR has real telemetry from its own buses/tricycles (litres avoided, kWh drawn from the solar stations), swap these lookup tables for actual fleet averages** — that's the single highest‑value upgrade to this feature's credibility.

## 4. Design intent

Built as a "solar charge meter" — a semicircular gauge like the charge controllers at KGR's own stations, with a big odometer‑style readout. Palette:

- Deep navy background (`#0b1b2b`) — the night grid KGR's solar stations operate independent of
- Solar‑gold accent (`#f2b705`) for the fleet‑footprint tab
- Charge‑green accent (`#33c481`) for the EV‑savings tab
- Space Grotesk for headings, Inter for body text, IBM Plex Mono for all numeric readouts (ties the numbers to a dashboard/meter feel)

## 5. Integration

The widget is one self‑contained block (HTML + `<style>` + `<script>`, no build step, no external JS dependencies — only an optional Google Fonts link). Three ways to use it on `kgrpartners.vercel.app`:

**A. Drop straight into a Next.js page/component** (recommended)
1. Copy the `<div id="kgr-impact-meter">…</div>` markup into a `.tsx`/`.jsx` component (or use `dangerouslySetInnerHTML` for the inner markup).
2. Move the `<style>` block into a CSS module or global stylesheet.
3. Move the `<script>` block's contents into a `useEffect(() => { ... }, [])` so it runs after the component mounts (the DOM queries assume the markup already exists).
4. Add the Google Fonts `<link>` tags to `_document.tsx` or `next/head`, or self‑host the three fonts if preferred.

**B. Static `<iframe>` embed**
Host `kgr-impact-calculator.html` as-is (e.g. `/public/impact-calculator.html`) and embed:
```html
<iframe src="/impact-calculator.html" style="width:100%; border:0; min-height:720px;" title="KGR Impact Calculator"></iframe>
```
Simplest option, zero React work, but harder to theme dynamically or track analytics events from the parent page.

**C. Copy-paste as-is into any plain HTML section**
Works unmodified in a plain HTML page — useful for quickly testing on a landing page before committing to the React integration.

## 6. Suggested next steps
- Confirm real fleet averages (km/day per bus/keke, actual litres or kWh per route) with operations, and swap into the lookup tables.
- Decide if the fleet‑footprint tab should show *company‑wide, all‑time* avoided emissions (a running counter) in addition to the daily calculator — a nice hero moment if the data exists.
- Add a small CTA under the EV‑savings tab ("Get a quote to switch") linking to KGR's contact/sales flow, since that calculator is effectively a lead‑gen tool.
