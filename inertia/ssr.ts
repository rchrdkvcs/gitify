import "./assets/styles/main.css";
import type { DefineComponent } from "vue";
import { createInertiaApp, type usePage } from "@inertiajs/vue3";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { mountGitifyApp, pageTitle, resolvePage } from "./lib/inertia-app.js";

export default function render(page: ReturnType<typeof usePage>) {
  return createInertiaApp({
    page,
    render: renderToString,
    title: pageTitle,
    resolve: (name) =>
      resolvePage(name, import.meta.glob<DefineComponent>("./pages/**/*.vue", { eager: true })),
    setup: (setup) => mountGitifyApp(createSSRApp, setup),
  });
}
