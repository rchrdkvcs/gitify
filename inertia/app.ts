import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./assets/styles/main.css";
import type { DefineComponent } from "vue";
import { resolvePageComponent } from "@adonisjs/inertia/helpers";
import { createInertiaApp } from "@inertiajs/vue3";
import UApp from "@nuxt/ui/components/App.vue";
import ui from "@nuxt/ui/vue-plugin";
import { createApp, createSSRApp, h } from "vue";
import Layout from "./layouts/default.vue";

createInertiaApp({
  title: (title) => (title ? `${title} | Gitify` : "Gitify"),
  resolve: (name) =>
    resolvePageComponent(
      `./pages/${name}.vue`,
      import.meta.glob<DefineComponent>("./pages/**/*.vue"),
      name === "preferences" ? undefined : Layout,
    ),
  setup({ el, App, props, plugin }) {
    // Server-rendered pages must hydrate the existing markup instead of replacing it.
    (props.serverRendered ? createSSRApp : createApp)({
      render: () => h(UApp, {}, { default: () => h(App, props) }),
    })
      .use(plugin)
      .use(ui)
      .mount(el);
  },
  progress: { color: "oklch(0.83 0.16 163)" },
});
