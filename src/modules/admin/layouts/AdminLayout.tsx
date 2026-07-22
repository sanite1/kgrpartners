import { useEffect, useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Bus,
  Tag,
  TicketPlus,
  ReceiptText,
  HandCoins,
  Hourglass,
  BookText,
  Boxes,
  ClipboardList,
  ClipboardCheck,
  BatteryCharging,
  Wrench,
  ChartColumn,
  UsersRound,
  PlugZap,
  Wallet,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { navForRole } from "../navigation";
import { cn } from "@/lib/utils";
import TopBar, {
  NotificationBell,
  ProfileBadge,
} from "../components/console/TopBar";
import logoWhite from "@/assets/kgr-logo-white.png";
import logo from "@/assets/kgr-logo-trans.png";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Bus,
  Tag,
  TicketPlus,
  ReceiptText,
  HandCoins,
  Hourglass,
  BookText,
  Boxes,
  ClipboardList,
  ClipboardCheck,
  BatteryCharging,
  Wrench,
  ChartColumn,
  UsersRound,
  PlugZap,
  Wallet,
};

const AdminLayout = () => {
  const user = useAuthStore((s) => s.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navItems = navForRole(user?.role);

  // lock the page while the drawer is open: background scroll on iOS
  // shifts the browser toolbar and exposes content beside the scrim
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const sidebarContent = (
    <>
      {/* brand */}
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
        <img src={logoWhite} alt="KGR Partners" className="h-9 w-auto" />
        <span className="rounded-md bg-forest px-2 py-1 text-[10px] font-extrabold tracking-[1.5px] text-neon">
          CONSOLE
        </span>
      </div>

      {/* nav: scrolls on its own when taller than the screen */}
      <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-28 lg:pb-8">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-3 text-[14px] font-bold transition-colors",
                  isActive
                    ? "cta-gradient text-forest-deep"
                    : "text-mint hover:bg-white/5 hover:text-white",
                )
              }
            >
              {Icon && <Icon size={17} strokeWidth={2.3} />}
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-haze">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col bg-forest-deep lg:flex">
        {sidebarContent}
      </aside>

      {/* mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-line bg-white px-4 py-2.5 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="KGR Partners" className="h-8 w-auto" />
          <span className="rounded-md bg-mist px-1.5 py-0.5 text-[9px] font-extrabold tracking-[1.5px] text-bark">
            CONSOLE
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ProfileBadge compact />
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[90] h-lvh bg-forest-deep/60 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="relative flex h-full w-[270px] flex-col bg-forest-deep"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-lg border-none bg-transparent text-mint hover:text-white"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="px-4 pb-12 pt-[76px] sm:px-6 lg:px-10 lg:pt-8">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
