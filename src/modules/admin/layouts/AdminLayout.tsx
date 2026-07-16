import { Outlet, Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { cn } from "@/lib/utils";
import logo from "@/assets/kgr-logo-trans.png";

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-haze">
      <header className="sticky top-0 z-50 border-b border-line bg-white">
        <div className="px-5 sm:px-8 lg:px-16">
          <div className="mx-auto flex max-w-7xl items-center justify-between py-2.5">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src={logo}
                alt="KGR Partners"
                className="-my-[11px] block h-[42px] w-auto"
              />
              <span className="rounded-md bg-mist px-2 py-1 text-[10px] font-extrabold tracking-[1.5px] text-bark">
                CONSOLE
              </span>
            </Link>

            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-[13px] font-extrabold leading-tight text-ink">
                    {user.firstName} {user.lastName}
                  </div>
                  <div
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-[1px]",
                      user.role === "admin" ? "text-brand-600" : "text-fog",
                    )}
                  >
                    {user.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
