import type { App as VueApp, Component, DefineComponent, Plugin } from "vue";
import { resolvePageComponent } from "@adonisjs/inertia/helpers";
import UApp from "@nuxt/ui/components/App.vue";
import ui from "@nuxt/ui/vue-plugin";
import { h } from "vue";
import Layout from "../layouts/default.vue";

type PageModules = Record<string, DefineComponent | (() => Promise<DefineComponent>)>;

type InertiaSetup = { App: Component; props: object; plugin: Plugin };

const pagesWithoutLayout = new Set(["onboarding"]);

export const pageTitle = (title: string) => (title ? `${title} | Gitify` : "Gitify");

export function resolvePage(name: string, pages: PageModules) {
  return resolvePageComponent(
    `./pages/${name}.vue`,
    pages,
    pagesWithoutLayout.has(name) ? undefined : Layout,
  );
}

export function mountGitifyApp(
  createVueApp: (root: Component) => VueApp,
  { App, props, plugin }: InertiaSetup,
) {
  return createVueApp({
    render: () => h(UApp, {}, { default: () => h(App, props) }),
  })
    .use(plugin)
    .use(ui);
}
