import router from "@adonisjs/core/services/router";
import { controllers } from "#generated/controllers";
import { middleware } from "#start/kernel";

// Public catalogue: browsing never requires an account.
router.get("/", [controllers.Pages, "home"]);
router.get("/explore", [controllers.Pages, "explore"]);
router.get("/projects/:owner/:name", [controllers.Pages, "project"]);
router.get("/auth/github/redirect", [controllers.Auth, "redirect"]);
router.get("/auth/github/callback", [controllers.Auth, "callback"]);

router
  .group(() => {
    router.get("/favorites", [controllers.Pages, "favorites"]);
    router.on("/profil").renderInertia("profil", {});
    router.on("/preferences").renderInertia("preferences", {});
    router.delete("/auth/logout", [controllers.Auth, "logout"]);
    router.put("/auth/preferences", [controllers.Preferences, "update"]);

    // JSON endpoints for client interactions.
    router.post("/api/projects/:id/favorite", [controllers.Project, "addFavorite"]);
    router.delete("/api/projects/:id/favorite", [controllers.Project, "removeFavorite"]);
  })
  .use(middleware.auth());
