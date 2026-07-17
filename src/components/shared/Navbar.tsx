import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS, COMPANY_INFO } from "@/data/site-data";
import logo from "@/assets/kgr-logo-trans.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // close the mobile menu on outside click / tap or Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-line bg-white"
    >
      <div className="px-5 sm:px-8 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between py-2.5">
          <Link to="/" onClick={() => setOpen(false)}>
            <img
              src={logo}
              alt="KGR Partners"
              className="-my-[11px] block h-[46px] w-auto lg:h-[52px]"
            />
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-8 text-[15px] font-semibold lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "transition-colors",
                    isActive
                      ? "text-brand-600"
                      : "text-[#1C2B22] hover:text-brand-500",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/conversion"
              className="cta-gradient rounded-lg px-6 py-[11px] text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.03] hover:text-forest-deep"
            >
              Start a Conversion →
            </Link>
          </nav>

          {/* mobile toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* mobile panel — slides open under the bar */}
      <div
        className={cn(
          "grid overflow-hidden bg-white transition-[grid-template-rows] duration-300 ease-out lg:hidden",
          open ? "grid-rows-[1fr] border-t border-line" : "grid-rows-[0fr]",
        )}
      >
        <nav className="min-h-0 overflow-hidden">
          <div className="px-5 sm:px-8 lg:px-16">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 py-4">
              {NAV_LINKS.map((link, i) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: `${i * 40}ms` }}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-3 text-[16px] font-bold transition-all",
                      open
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-2 opacity-0",
                      isActive
                        ? "bg-haze text-brand-600"
                        : "text-[#1C2B22] hover:bg-haze",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to="/conversion"
                onClick={() => setOpen(false)}
                className="cta-gradient mt-2 rounded-lg px-6 py-3.5 text-center text-[15px] font-extrabold text-forest-deep hover:text-forest-deep"
              >
                Start a Conversion →
              </Link>
              <div className="mt-3 border-t border-line pt-3 text-[13px] font-semibold text-fog">
                {COMPANY_INFO.phone} · {COMPANY_INFO.email}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
