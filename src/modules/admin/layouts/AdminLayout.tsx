import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bus,
  Tag,
  TicketPlus,
  ReceiptText,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { CONSOLE_NAV } from "../navigation";
import { cn } from "@/lib/utils";
import logoWhite from "@/assets/kgr-logo-white.png";
import logo from "@/assets/kgr-logo-trans.png";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Bus,
  Tag,
  TicketPlus,
  ReceiptText,
};

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <>
      {/* brand */}
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
        <img src={logoWhite} alt="KGR Partners" className="h-9 w-auto" />
        <span className="rounded-md bg-forest px-2 py-1 text-[10px] font-extrabold tracking-[1.5px] text-neon">
          CONSOLE
        </span>
      </div>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {CONSOLE_NAV.map((item) => {
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

      {/* user */}
      {user && (
        <div className="flex items-center gap-3 border-t border-forest-line px-4 py-4">
          <span className="cta-gradient flex h-10 w-10 flex-none items-center justify-center rounded-xl text-[14px] font-extrabold text-forest-deep">
            {initials(user.firstName, user.lastName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-extrabold leading-tight text-white">
              {user.firstName} {user.lastName}
            </div>
            <div
              className={cn(
                "text-[10px] font-bold uppercase tracking-[1px]",
                user.role === "admin" ? "text-neon" : "text-mint-soft",
              )}
            >
              {user.role}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-forest-line bg-transparent text-mint transition-colors hover:border-neon hover:text-neon"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
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
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[90] bg-forest-deep/60 lg:hidden"
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
      <main className="min-w-0 flex-1 px-4 pb-12 pt-[72px] sm:px-6 lg:px-10 lg:pt-8">
        <div className="mx-auto max-w-[1200px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
