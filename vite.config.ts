import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "node:path";

// These are public browser credentials (not service-role secrets). Keeping a
// fallback makes third-party SPA builds work even when a host does not import
// the Lovable Cloud build variables.
const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "https://epzfiwshtokyfkcnotih.supabase.co";
const supabasePublishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwemZpd3NodG9reWZrY25vdGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDc3MzQsImV4cCI6MjA5ODM4MzczNH0.SH-cPIiTSlS_DlPXsdseQot-wooTJTs2cpF3RT_ay8Y";
const supabaseProjectId = process.env.VITE_SUPABASE_PROJECT_ID ?? "epzfiwshtokyfkcnotih";

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
    ...(supabaseUrl ? { "process.env.SUPABASE_URL": JSON.stringify(supabaseUrl) } : {}),
    ...(supabasePublishableKey
      ? {
          "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
            supabasePublishableKey,
          ),
        }
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
