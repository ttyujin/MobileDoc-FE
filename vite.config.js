import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/profile": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/hospitals": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
});
