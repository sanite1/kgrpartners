import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PlatformRoutes } from "@/modules/platform/routes";
import { AdminRoutes } from "@/modules/admin/routes";
import { getModule } from "./lib/network/helpers/getModule";
import { useAuthStore } from "./lib/network/stores/auth.store";
import { queryClient } from "./lib/network/query/client";
import AOS from "aos";
import "aos/dist/aos.css";

function App() {
  const module = getModule();
  const hydrate = useAuthStore((s) => s.hydrate);

  // rehydrate auth from localStorage
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    AOS.init({ duration: 600, easing: "ease-out", once: true, offset: 60 });
  }, []);

  const renderModule = () => {
    switch (module) {
      case "admin":
        return <AdminRoutes />;
      // the platform (marketing) module serves every other origin
      case "platform":
      default:
        return <PlatformRoutes />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      {renderModule()}
    </QueryClientProvider>
  );
}

export default App;
