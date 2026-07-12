import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PlatformRoutes } from "@/modules/platform/routes";
import { getModule } from "./lib/network/helpers/getModule";
import { queryClient } from "./lib/network/query/client";
import AOS from "aos";
import "aos/dist/aos.css";

function App() {
  const module = getModule();

  useEffect(() => {
    AOS.init({ duration: 600, easing: "ease-out", once: true, offset: 60 });
  }, []);

  const renderModule = () => {
    switch (module) {
      // app/admin modules are not part of this build — the platform
      // (marketing) module serves every origin until they exist.
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
