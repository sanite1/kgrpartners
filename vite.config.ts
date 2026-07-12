import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: Number(process.env.PORT) || 3000, strictPort: false },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(
              id,
            )
          )
            return "react-vendor";
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("zod")) return "zod";
          if (id.includes("lucide-react")) return "lucide";
          return "vendor";
        },
      },
    },
  },
});
