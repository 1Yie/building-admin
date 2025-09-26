import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  server: {
    host: true,
<<<<<<< HEAD
=======
    port: 5174,
>>>>>>> dev
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
<<<<<<< HEAD
  // 生产环境下移除console和debugger
=======
>>>>>>> dev
  esbuild: {
    drop: ["console", "debugger"],
  },
});
