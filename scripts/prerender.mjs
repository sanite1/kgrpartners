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
      "The road taught us. The sun changed us. From a 2017 diesel fleet to Nigeria's fully converted solar electric transport company.",
  },
  {
    path: "/technology",
    title: "Our Technology | KGR Partners",
    description:
      "Three systems, one fleet that never stops: diesel-to-electric conversion, 800 kW of our own solar charging, and battery swaps in minutes.",
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
