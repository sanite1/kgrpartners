import { rewrite, next } from "@vercel/edge";

// On the admin hostname, every PAGE request serves the neutral console
// shell (dist/admin.html: "KGR Console" title, no OG tags, noindex)
// instead of the marketing index.html - so sharing a console link never
// shows the company's social card. Asset requests (anything with a file
// extension) are excluded by the matcher and served as-is.
export const config = {
  matcher: "/((?!.*\\.).*)",
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname.startsWith("admin.")) {
    return rewrite(new URL("/admin.html", request.url));
  }
  return next();
}
