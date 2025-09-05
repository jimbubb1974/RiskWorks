import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Suppress React DevTools suggestion
    __REACT_DEVTOOLS_GLOBAL_HOOK__: "undefined",
  },
  build: {
    // Skip TypeScript checking during build for deployment
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress TypeScript warnings during build
        if (warning.code === "UNRESOLVED_IMPORT") return;
        warn(warning);
      },
    },
  },
});
