// Post-build prerender: writes dist/<route>/index.html with per-page meta
// baked in, so social scrapers (which don't run JS) see the right
// title/description/OG card for every route. Values mirror each page's
// <PageMeta> exactly — change one, change the other.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://www.kgrpartners.com";

const ROUTES = [
  {
    path: "/about",
    title: "About Us | KGR Partners",
    description:
      "The road taught us. The sun changed us. From a 2017 fuel-powered fleet to Nigeria's first fully electric, solar-powered mass transit operator and local EV manufacturer.",
  },
  {
    path: "/technology",
    title: "Our Technology | KGR Partners",
    description:
      "Four systems, one fleet that never stops: local tricycle manufacturing, petrol to electric conversion, 800kW DC off-grid solar charging, and battery swaps in under 5 minutes.",
  },
  {
    path: "/team",
    title: "Meet the Team | KGR Partners",
    description:
      "The nine people behind Nigeria's first fully electric, solar-powered mass transit fleet, from the CEO to the battery technicians.",
  },
  {
    path: "/gallery",
    title: "Gallery | KGR Partners",
    description:
      "The fleet, the solar stations and the swap bays. Photos of KGR Partners' electric transport operation in Kaduna.",
  },
  {
    path: "/faq",
    title: "FAQ | KGR Partners",
    description:
      "What we do, how battery swapping works, where we operate and how to partner with KGR Partners.",
  },
  {
    path: "/partner",
    title: "Partner With Us | KGR Partners",
    description:
      "We collaborate with government agencies, investors, transport unions and development organizations on EV conversion, charging infrastructure and fleet electrification.",
  },
  {
    path: "/contact",
    title: "Contact | KGR Partners",
    description:
      "Talk to KGR. We reply within a day. Ride requests, fleet conversion enquiries, partnerships and press.",
  },
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(resolve(root, "dist/index.html"), "utf8");

const setTag = (html, pattern, replacement) => {
  if (!pattern.test(html)) {
    throw new Error(`prerender: pattern not found: ${pattern}`);
  }
  return html.replace(pattern, replacement);
};

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

for (const route of ROUTES) {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const url = `${SITE_URL}${route.path}`;

  let html = template;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = setTag(
    html,
    /(<meta[^>]*name="description"[^>]*content=")[^"]*(")/,
    `$1${description}$2`,
  );
  html = setTag(
    html,
    /(<meta[^>]*property="og:title"[^>]*content=")[^"]*(")/,
    `$1${title}$2`,
  );
  html = setTag(
    html,
    /(<meta[^>]*property="og:description"[^>]*content=")[^"]*(")/,
    `$1${description}$2`,
  );
  html = setTag(
    html,
    /(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")/,
    `$1${url}$2`,
  );
  html = setTag(
    html,
    /(<meta[^>]*name="twitter:title"[^>]*content=")[^"]*(")/,
    `$1${title}$2`,
  );
  html = setTag(
    html,
    /(<meta[^>]*name="twitter:description"[^>]*content=")[^"]*(")/,
    `$1${description}$2`,
  );
  html = setTag(
    html,
    /(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/,
    `$1${url}$2`,
  );

  const outDir = resolve(root, `dist${route.path}`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "index.html"), html);
  console.log(`prerendered ${route.path}/index.html`);
}
