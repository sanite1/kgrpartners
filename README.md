# KGR Partners — Company Profile

Marketing site for KGR Partners, Nigeria's solar electric transport company.
Built from the Claude Design handoff (`KGR Home/About/Technology/Contact`),
following the fullstack scaffolding brief's frontend conventions.

## Stack

React 19 · Vite 7 · TypeScript · Tailwind CSS v4 (CSS-first, no config file) ·
TanStack Query 5 + Axios · react-hook-form + zod · sonner · AOS

## Setup

```sh
npm install
cp .env.example .env   # then fill in the real values
npm run dev            # port 3000
```

### Environment

| Var | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL (contact endpoint host) |
| `VITE_CONTACT_COMPANY_ID` | Company ObjectId for `POST /api/contact/:companyId` |

Set the same two vars in the hosting provider's project settings — the
contact form cannot submit without them.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — type-check, production build, then prerender (see below)
- `npm run check-types` — `tsc -b`
- `npm run lint` — ESLint
- `npm run format` / `check-format` — Prettier

## Pages

| Route | Page |
| --- | --- |
| `/` | Home — hero, services, bento, story teaser |
| `/about` | About — story, journey timeline, beliefs |
| `/technology` | Technology — 3 systems (`#conversion`, `#solar-charging`, `#battery-swapping`), day timeline |
| `/contact` | Contact — contact cards + form (the only backend integration) |

Home service cards and footer service links deep-link to the technology
anchors above.

## Structure

- `src/modules/platform/` — the marketing module (pages, layouts, feature components)
- `src/components/shared/` — Topbar (mobile marquee), Navbar, Footer, PageHeader, QuoteBand, …
- `src/lib/network/` — axios instance, `api` wrapper, react-query client, `contact` data layer
- `src/data/` — all static copy and image URLs, lifted verbatim from the design files
- `scripts/prerender.mjs` — post-build SEO prerender

## SEO & sharing

- Per-page `<title>`/description via `PageMeta` (client-side), Open Graph +
  Twitter cards, JSON-LD `Organization`, `robots.txt`, `sitemap.xml`,
  `og-image.png`.
- **Prerender:** `npm run build` writes `dist/<route>/index.html` per route
  with that page's meta baked in, so social scrapers (no JS) show the right
  card for every page. Hosting serves these files before the SPA rewrite.
- **Convention:** page meta lives in TWO places — each page's `<PageMeta>`
  and the `ROUTES` table in `scripts/prerender.mjs`. Change one → change the
  other.
- **Domain:** `https://www.kgrpartners.com` is assumed in
  `scripts/prerender.mjs` (`SITE_URL`), `index.html` (OG/canonical/JSON-LD),
  `public/robots.txt` and `public/sitemap.xml`. If the real domain differs,
  update all four.

## Deployment (Vercel)

`vercel.json` rewrites every unmatched path to `index.html` so React Router
handles deep links and refreshes. Prerendered route files take precedence
over the rewrite automatically.

## Remaining content TODOs

- Replace Unsplash placeholder photos with real fleet/depot photography
  (all URLs live in `src/data/*-data.ts`).
- Replace `public/og-image.png` with a real 1200×630 share card.
- After deploy, submit `sitemap.xml` in Google Search Console.

Real company data (contact details, stats, story) comes from
`KGR_Partners_Website_Content_Plan` and is integrated in phases; see
`src/data/` for the single source of truth per page.
