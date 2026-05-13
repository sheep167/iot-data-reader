import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        // In Docker the backend is reachable via its service name.
        // Override with VITE_API_TARGET env var (e.g. http://backend:3001).
        // Defaults to localhost for local-only (non-Docker) development.
        target: process.env.VITE_API_TARGET ?? "http://localhost:3001",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
