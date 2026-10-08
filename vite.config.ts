import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from "node:url";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), svgr()],
    server: {
      proxy: env.VITE_API_BASE_URL
        ? {
            "^/profile/": {
              target: env.VITE_API_BASE_URL,
              changeOrigin: true,
              rewrite: (url: string) =>
                url.replace(/^\/profile\//, "/public/profiles/"),
              configure: (proxy) =>
                proxy.on("proxyReq", (req) => {
                  req.removeHeader("cookie");
                  req.removeHeader("authorization");
                }),
            },
          }
        : undefined,
    },
    resolve: {
      // Voice effects and the app must share the same React runtime.
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
      },
    },
  };
});
