import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, UserRound } from "lucide-react";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { useGetItems } from "@/lib/network/api/inventory.api";
import { useGetPartRequests } from "@/lib/network/api/partRequest.api";
import { useGetGatePasses } from "@/lib/network/api/gatePass.api";
import { canApprove } from "../../permissions";
import { cn } from "@/lib/utils";

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

const menuClasses =
  "absolute right-0 top-[52px] z-40 w-[260px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_18px_44px_rgba(13,31,21,0.15)]";

// closes the given dropdown on any outside click
const useOutsideClose = (open: boolean, onClose: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return ref;
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const role = useAuthStore((s) => s.user?.role);
  const isSecurity = role === "security";

  // real signals, refreshed each minute: stock running low, requests waiting
  const { data: lowStockData } = useGetItems(
    { lowStock: "true", isActive: "true", pageSize: 1 },
    { refetchInterval: 60_000 },
  );
  const { data: pendingData } = useGetPartRequests(
    { status: "pending", pageSize: 1 },
    { refetchInterval: 60_000, enabled: !isSecurity },
  );
  // gate passes: managers see what waits for a decision (and staff their
  // own pending); the gate sees what has been cleared for release
  const { data: gatePassData } = useGetGatePasses(
    { status: isSecurity ? "approved" : "pending", pageSize: 1 },
    { refetchInterval: 60_000 },
  );

  const lowStock = isSecurity ? 0 : (lowStockData?.pagination?.totalItems ?? 0);
  const pending = isSecurity ? 0 : (pendingData?.pagination?.totalItems ?? 0);
  const gatePasses = gatePassData?.pagination?.totalItems ?? 0;
  const count = lowStock + pending + gatePasses;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
      >
        <Bell size={17} />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-solar px-1 text-[10px] font-extrabold text-forest-deep">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className={menuClasses}>
          <div className="border-b border-line px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog">
            NEEDS ATTENTION
          </div>
          {lowStock > 0 && (
            <Link
              to="/inventory"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-haze"
            >
              {lowStock} item{lowStock === 1 ? "" : "s"} low on stock
              <span className="text-[12px] font-extrabold text-brand-600">
                Inventory →
              </span>
            </Link>
          )}
          {pending > 0 && (
            <Link
              to="/requests"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-haze"
            >
              {pending} request{pending === 1 ? "" : "s"} awaiting decision
              <span className="text-[12px] font-extrabold text-brand-600">
                Requests →
              </span>
            </Link>
          )}
          {gatePasses > 0 && (
            <Link
              to="/gate-pass"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-haze"
            >
              {isSecurity
                ? `${gatePasses} approved pass${gatePasses === 1 ? "" : "es"} at the gate`
                : canApprove(role)
                  ? `${gatePasses} gate pass${gatePasses === 1 ? "" : "es"} awaiting approval`
                  : `${gatePasses} of your gate pass${gatePasses === 1 ? "" : "es"} still pending`}
              <span className="text-[12px] font-extrabold text-brand-600">
                Gate Pass →
              </span>
            </Link>
          )}
          {count === 0 && (
            <p className="m-0 px-4 py-4 text-[13.5px] font-semibold text-fog">
              All clear. Nothing needs attention.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const ProfileBadge = ({ compact }: { compact?: boolean }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white transition-colors hover:border-brand-500",
          compact ? "p-0.5" : "py-1.5 pl-1.5 pr-3",
        )}
      >
        <span className="cta-gradient flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-[13px] font-extrabold text-forest-deep">
          {initials(user.firstName, user.lastName)}
        </span>
        {!compact && (
          <>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-extrabold leading-tight text-ink">
                {user.firstName} {user.lastName}
              </span>
              <span
                className={cn(
                  "block text-[10px] font-bold uppercase tracking-[1px]",
                  user.role === "admin" ? "text-brand-600" : "text-fog",
                )}
              >
                {user.role}
              </span>
            </span>
            <ChevronDown
              size={14}
              className={cn(
                "text-fog transition-transform",
                open && "rotate-180",
              )}
            />
          </>
        )}
      </button>

      {open && (
        <div className={menuClasses}>
          <div className="border-b border-line px-4 py-3">
            <div className="text-[13.5px] font-extrabold text-ink">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[12px] font-semibold text-fog">
              {user.email}
            </div>
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-haze"
          >
            <UserRound size={15} className="text-fog" /> Profile settings
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              navigate("/login");
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-4 py-3 text-left text-[13.5px] font-bold text-red-600 transition-colors hover:bg-haze"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

const todayLabel = () =>
  new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

// Desktop header for the light side; matches the sidebar brand height.
const TopBar = () => (
  <header className="sticky top-0 z-40 hidden h-[84px] items-center justify-between border-b border-line bg-white px-10 lg:flex">
    <span className="text-[13.5px] font-bold text-fog">{todayLabel()}</span>
    <div className="flex items-center gap-3">
      <NotificationBell />
      <ProfileBadge />
    </div>
  </header>
);

export default TopBar;
