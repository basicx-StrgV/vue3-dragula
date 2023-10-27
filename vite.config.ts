import { fileURLToPath, URL } from "node:url";

import { resolve } from "path";
import { defineConfig } from "vite";

import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/vue3-dragula.ts"),
      name: "vue3-dragula",
      fileName: "vue3-dragula",
    },
    rollupOptions: {
      external: ["vue", "dragula"],
      output: {
        globals: {
          vue: "Vue",
          dragula: "Dragula",
        },
      },
    },
  },
  plugins: [dts()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
