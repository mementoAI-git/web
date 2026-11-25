import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { eveTanStack } from "eve/tanstack";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

/**
 * Loads sandbox-only configuration and mounts Eve on the local app.
 * @returns The isolated app and agent build configuration.
 */
export default defineConfig(({ mode }) => {
  const sandboxRoot = fileURLToPath(new URL("../..", import.meta.url));
  Object.assign(process.env, loadEnv(mode, sandboxRoot, ""));
  return {
    envDir: sandboxRoot,
    resolve: { tsconfigPaths: true },
    plugins: [
      eveTanStack({ eveRoot: sandboxRoot }),
      tailwindcss(),
      tanstackStart({ srcDirectory: "app" }),
      viteReact(),
      nitro(),
    ],
  };
});
