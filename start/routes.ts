import router from "@adonisjs/core/services/router";
import { controllers } from "#generated/controllers";
import { middleware } from "#start/kernel";

router.get("/", [controllers.Pages, "home"]);
router.get("/explore", [controllers.Pages, "explore"]);
router.get("/issues", [controllers.Pages, "issues"]);
router.get("/projects/:owner/:name", [controllers.Pages, "project"]);
router.get("/auth/github/redirect", [controllers.Auth, "redirect"]);
router.get("/auth/github/callback", [controllers.Auth, "callback"]);

router
  .group(() => {
    router.get("/favorites", [controllers.Pages, "favorites"]);
    router.on("/profil").renderInertia("profil", {});
    router.on("/preferences").renderInertia("preferences", {});
    router.get("/onboarding", [controllers.Onboarding, "show"]);
    router.put("/onboarding", [controllers.Onboarding, "complete"]);
    router.post("/onboarding/skip", [controllers.Onboarding, "skip"]);
    router.delete("/auth/logout", [controllers.Auth, "logout"]);
    router.put("/auth/preferences", [controllers.Preferences, "update"]);

    router.post("/api/projects/:id/favorite", [controllers.Project, "addFavorite"]);
    router.delete("/api/projects/:id/favorite", [controllers.Project, "removeFavorite"]);
    router.patch("/api/onboarding", [controllers.Onboarding, "progress"]);
  })
  .use(middleware.auth());
