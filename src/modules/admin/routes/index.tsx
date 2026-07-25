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
const PayPoint = lazy(() => import("../pages/PayPoint"));
const Nyp = lazy(() => import("../pages/Nyp"));
const DailyAccount = lazy(() => import("../pages/DailyAccount"));
const Inventory = lazy(() => import("../pages/Inventory"));
const Requests = lazy(() => import("../pages/Requests"));
const Batteries = lazy(() => import("../pages/Batteries"));
const BatteryExitFormPage = lazy(() => import("../pages/BatteryExitFormPage"));
const BatteryClosing = lazy(() => import("../pages/BatteryClosing"));
const Swaps = lazy(() => import("../pages/Swaps"));
const GatePassPage = lazy(() => import("../pages/GatePass"));
const GatePassNewPage = lazy(() => import("../pages/GatePassNewPage"));
const Purchases = lazy(() => import("../pages/Purchases"));
const Checklist = lazy(() => import("../pages/Checklist"));
const TrackerReportPage = lazy(() => import("../pages/TrackerReportPage"));
const Repairs = lazy(() => import("../pages/Repairs"));
const Profile = lazy(() => import("../pages/Profile"));
const Users = lazy(() => import("../pages/Users"));
const UserFormPage = lazy(() => import("../pages/UserFormPage"));
const Reports = lazy(() => import("../pages/Reports"));
const Conversions = lazy(() => import("../pages/Conversions"));
const Partnerships = lazy(() => import("../pages/Partnerships"));
const Expenditures = lazy(() => import("../pages/Expenditures"));
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
              <Route path="/paypoint" element={<PayPoint />} />
              <Route path="/nyp" element={<Nyp />} />
              <Route path="/daily-account" element={<DailyAccount />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/batteries" element={<Batteries />} />
              <Route path="/battery-form" element={<BatteryExitFormPage />} />
              <Route path="/battery-closing" element={<BatteryClosing />} />
              <Route path="/swaps" element={<Swaps />} />
              <Route path="/gate-pass" element={<GatePassPage />} />
              <Route path="/gate-pass/new" element={<GatePassNewPage />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/tracker-report" element={<TrackerReportPage />} />
              <Route path="/repairs" element={<Repairs />} />
              <Route path="/buses" element={<Buses />} />
              <Route path="/trip-price" element={<TripPrice />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/expenditures" element={<Expenditures />} />
              <Route path="/conversions" element={<Conversions />} />
              <Route path="/partnerships" element={<Partnerships />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/new" element={<UserFormPage />} />
              <Route path="/users/:id/edit" element={<UserFormPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
