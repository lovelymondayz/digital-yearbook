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
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js core — separate chunk
          if (id.includes("node_modules/three")) {
            return "three";
          }
          // R3F + drei — separate chunk (depends on three)
          if (
            id.includes("@react-three/fiber") ||
            id.includes("@react-three/drei")
          ) {
            return "r3f";
          }
          // All other node_modules
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
