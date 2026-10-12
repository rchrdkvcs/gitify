import "./assets/styles/main.css";
import type { DefineComponent } from "vue";
import { resolvePageComponent } from "@adonisjs/inertia/helpers";
import { createInertiaApp, type usePage } from "@inertiajs/vue3";
import UApp from "@nuxt/ui/components/App.vue";
import ui from "@nuxt/ui/vue-plugin";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import Layout from "./layouts/default.vue";

// Server entry: renders the first visit to HTML; `app.ts` hydrates it in the browser.
export default function render(page: ReturnType<typeof usePage>) {
  return createInertiaApp({
    page,
    render: renderToString,
    title: (title) => (title ? `${title} | Gitify` : "Gitify"),
    resolve: (name) =>
      resolvePageComponent(
        `./pages/${name}.vue`,
        import.meta.glob<DefineComponent>("./pages/**/*.vue", { eager: true }),
        name === "onboarding" ? undefined : Layout,
      ),
    setup({ App, props, plugin }) {
      return createSSRApp({
        render: () => h(UApp, {}, { default: () => h(App, props) }),
      })
        .use(plugin)
        .use(ui);
    },
  });
}
