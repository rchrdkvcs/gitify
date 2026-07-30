/* eslint-disable prettier/prettier */
import type { routes } from "./index.ts";

export interface ApiDefinition {
  openapi: {
    html: (typeof routes)["openapi.html"];
    json: (typeof routes)["openapi.json"];
    yaml: (typeof routes)["openapi.yaml"];
  };
  auth: {
    redirect: (typeof routes)["auth.redirect"];
    callback: (typeof routes)["auth.callback"];
    me: (typeof routes)["auth.me"];
    logout: (typeof routes)["auth.logout"];
  };
  preferences: {
    update: (typeof routes)["preferences.update"];
  };
  project: {
    showcase: (typeof routes)["project.showcase"];
    feed: (typeof routes)["project.feed"];
    favorites: (typeof routes)["project.favorites"];
    show: (typeof routes)["project.show"];
    addFavorite: (typeof routes)["project.add_favorite"];
    removeFavorite: (typeof routes)["project.remove_favorite"];
  };
}
