import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from "node:url";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    // port: 3000,
  },
  resolve: {
    // Voice effects and the app must share the same React runtime.
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
    },
  },
});
