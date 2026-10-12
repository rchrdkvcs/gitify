import adonisjs from "@adonisjs/vite/client";
import ui from "@nuxt/ui/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import appConfig from "./inertia/app.config.js";

export default defineConfig({
  plugins: [
    vue(),
    adonisjs({
      entryPoints: ["inertia/app.ts"],
      serverEntryPoints: ["inertia/ssr.ts"],
      reload: ["resources/views/**/*.edge"],
    }),
    ui({
      router: "inertia",
      ui: appConfig.ui,
      theme: { colors: ["primary", "success", "neutral", "error"] },
      colorMode: false,
      autoImport: {
        imports: ["vue"],
        dirs: ["inertia/composables", "inertia/utils"],
        dts: "inertia/auto-imports.d.ts",
        vueTemplate: true,
      },
      components: { dirs: ["inertia/components"], dts: "inertia/components.d.ts" },
    }),
  ],
  server: { host: "0.0.0.0", port: 5173, strictPort: true },
  resolve: {
    alias: {
      "~/": `${import.meta.dirname}/inertia/`,
      "@generated/": `${import.meta.dirname}/.adonisjs/client/`,
      "@shared/": `${import.meta.dirname}/shared/`,
    },
  },
});
