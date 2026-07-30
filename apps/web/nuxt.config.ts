import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  app: {
    head: {
      meta: [{ name: "theme-color", content: "#ffffff" }],
    },
  },

  ui: {
    colorMode: false,
  },

  modules: [
    "@nuxt/ui",
    "@nuxt/image",
    "@pinia/nuxt",
    "@pinia/colada-nuxt",
    "@nuxtjs/google-fonts",
    "@comark/nuxt",
  ],

  googleFonts: {
    families: {
      "Space Grotesk": {
        wght: [300, 400, 500, 600, 700],
      },
      "JetBrains Mono": {
        wght: [300, 400, 500, 600, 700],
      },
      Antic: {
        wght: [400],
      },
    },
    display: "swap",
  },

  css: ["~/assets/styles/main.css"],

  vite: {
    plugins: [tailwindcss() as any],
    optimizeDeps: {
      // three is lazy-imported by the archive easter egg — prebundle it so the
      // first open doesn't trigger a Vite dep-discovery full reload in dev
      include: [
        "@tuyau/core/client",
        "three",
        "three/addons/loaders/GLTFLoader.js",
        "three/addons/environments/RoomEnvironment.js",
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:3333",
    },
  },

  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
});
