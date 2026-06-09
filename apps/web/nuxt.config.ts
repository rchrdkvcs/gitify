import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  modules: ["@nuxt/ui", "@nuxt/image", "@pinia/nuxt", "@pinia/colada-nuxt", "@nuxtjs/google-fonts"],

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
      include: ["@tuyau/core/client"],
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
