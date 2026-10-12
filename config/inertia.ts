import { defineConfig } from "@adonisjs/inertia";

const inertiaConfig = defineConfig({
  ssr: {
    enabled: true,
    entrypoint: "inertia/ssr.ts",
  },
});

export default inertiaConfig;
