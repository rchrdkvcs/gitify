import router from "@adonisjs/core/services/router";
import { controllers } from "#generated/controllers";
import { middleware } from "#start/kernel";

router.get("/", [controllers.Pages, "home"]);
router.on("/community").renderInertia("community", {});
router.on("/ressources").renderInertia("ressources", {});
router.get("/auth/github/redirect", [controllers.Auth, "redirect"]);
router.get("/auth/github/callback", [controllers.Auth, "callback"]);

router
  .group(() => {
    router.get("/explore", [controllers.Pages, "explore"]);
    router.get("/favorites", [controllers.Pages, "favorites"]);
    router.get("/projects/:id", [controllers.Pages, "project"]);
    router.on("/profil").renderInertia("profil", {});
    router.on("/preferences").renderInertia("preferences", {});
    router.delete("/auth/logout", [controllers.Auth, "logout"]);
    router.put("/auth/preferences", [controllers.Preferences, "update"]);

    // JSON endpoints for client interactions and the archive overlay.
    router.get("/api/projects/feed", [controllers.Project, "feed"]);
    router.get("/api/projects/favorites", [controllers.Project, "favorites"]);
    router.post("/api/projects/:id/favorite", [controllers.Project, "addFavorite"]);
    router.delete("/api/projects/:id/favorite", [controllers.Project, "removeFavorite"]);
  })
  .use(middleware.auth());
