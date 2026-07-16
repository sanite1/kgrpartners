import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import ScrollToTop from "@/components/shared/ScrollToTop";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/shared/PublicOnlyRoute";

const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Buses = lazy(() => import("../pages/Buses"));
const GenerateReceipt = lazy(() => import("../pages/GenerateReceipt"));
const Receipts = lazy(() => import("../pages/Receipts"));
const TripPrice = lazy(() => import("../pages/TripPrice"));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
  </div>
);

export const AdminRoutes = () => {
  // the console must never be indexed by search engines
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generate" element={<GenerateReceipt />} />
              <Route path="/receipts" element={<Receipts />} />
              <Route path="/buses" element={<Buses />} />
              <Route path="/trip-price" element={<TripPrice />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
