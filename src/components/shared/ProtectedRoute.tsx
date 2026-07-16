import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import type { UserRole } from "@/lib/network/types/auth.types";

interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

// Layout-route guard: spinner while hydrating, /login if unauthenticated,
// home if the role does not match.
export const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(
      location.pathname + location.search,
    );
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
