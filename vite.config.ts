import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tsConfigPaths(), tailwindcss()],
  resolve: {
    alias: {
      // Compatibility shims so existing imports keep working on the Vite SPA
      // stack while the app runs on react-router-dom under the hood.
      "@tanstack/react-router": path.resolve(
        __dirname,
        "./src/compat/tanstack-router.tsx",
      ),
      "@tanstack/react-start": path.resolve(
        __dirname,
        "./src/compat/tanstack-start.ts",
      ),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
});
