import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  server: {
    host: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  define: {
    "import.meta.env.VITE_BASE_URL": JSON.stringify("__VITE_BASE_URL__"),
    "import.meta.env.VITE_BASE_URL_HOME": JSON.stringify(
      "__VITE_BASE_URL_HOME__"
    ),
  },
});
