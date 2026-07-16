import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/lib/network/stores/auth.store";

// Bounces already-authenticated users away from login-style pages.
export const PublicOnlyRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};
