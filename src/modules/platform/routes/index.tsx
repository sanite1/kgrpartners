import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import PlatformLayout from "../layouts/PlatformLayout";
import ScrollToTop from "@/components/shared/ScrollToTop";
import NotFound from "../pages/NotFound";

const Home = lazy(() => import("../pages/Home"));
const About = lazy(() => import("../pages/About"));
const Technology = lazy(() => import("../pages/Technology"));
const Contact = lazy(() => import("../pages/Contact"));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
  </div>
);

export const PlatformRoutes = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<PlatformLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
