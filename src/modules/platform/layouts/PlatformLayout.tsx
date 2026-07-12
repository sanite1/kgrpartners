import { Outlet } from "react-router-dom";
import Topbar from "@/components/shared/Topbar";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

const PlatformLayout = () => (
  <>
    <Topbar />
    <Navbar />
    <Outlet />
    <Footer />
  </>
);

export default PlatformLayout;
