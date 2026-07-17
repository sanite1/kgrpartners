import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import PlatformLayout from "../layouts/PlatformLayout";
import ScrollToTop from "@/components/shared/ScrollToTop";
import NotFound from "../pages/NotFound";

const Home = lazy(() => import("../pages/Home"));
const About = lazy(() => import("../pages/About"));
const Technology = lazy(() => import("../pages/Technology"));
const Team = lazy(() => import("../pages/Team"));
const Gallery = lazy(() => import("../pages/Gallery"));
const Faq = lazy(() => import("../pages/Faq"));
const Partner = lazy(() => import("../pages/Partner"));
const Conversion = lazy(() => import("../pages/Conversion"));
const Impact = lazy(() => import("../pages/Impact"));
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
          <Route path="/team" element={<Team />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/conversion" element={<Conversion />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
