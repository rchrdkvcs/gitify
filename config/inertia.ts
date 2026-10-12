import { defineConfig } from "@adonisjs/inertia";

const inertiaConfig = defineConfig({
  ssr: {
    enabled: false,
  },
});

export default inertiaConfig;
