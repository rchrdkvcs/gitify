import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./assets/styles/main.css";
import type { DefineComponent } from "vue";
import { createInertiaApp } from "@inertiajs/vue3";
import { createApp, createSSRApp } from "vue";
import { mountGitifyApp, pageTitle, resolvePage } from "./lib/inertia-app.js";

createInertiaApp({
  title: pageTitle,
  resolve: (name) => resolvePage(name, import.meta.glob<DefineComponent>("./pages/**/*.vue")),
  setup({ el, ...setup }) {
    mountGitifyApp(setup.props.serverRendered ? createSSRApp : createApp, setup).mount(el);
  },
  progress: { color: "oklch(0.83 0.16 163)" },
});
