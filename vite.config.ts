import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "node:path";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabasePublishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseProjectId = process.env.VITE_SUPABASE_PROJECT_ID;

export default defineConfig({
  plugins: [react(), tsConfigPaths(), tailwindcss()],
  define: {
    ...(supabaseUrl
      ? { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl) }
      : {}),
    ...(supabasePublishableKey
      ? {
          "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
            supabasePublishableKey,
          ),
        }
      : {}),
    ...(supabaseProjectId
      ? { "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supabaseProjectId) }
      : {}),
  },
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
